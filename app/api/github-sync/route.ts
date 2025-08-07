import { NextRequest, NextResponse } from 'next/server';
import { createLink, getAllLinks, deleteLink } from '@/lib/db';
import { triggerGitHubSync } from '@/lib/github';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'localan/shortener'; // Replace with your repo
const GITHUB_FILE_PATH = 'redirects.json';

export async function GET() {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }

    // Fetch redirects.json from GitHub
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const redirects = JSON.parse(content);

    // Sync to database
    const existingLinks = await getAllLinks();
    
    // Remove old GitHub-synced links (you might want to add a flag to track this)
    // For now, we'll just add new ones
    
    for (const redirect of redirects.redirects) {
      try {
        const existingLink = existingLinks.find(link => link.source === redirect.source);
        
        if (!existingLink) {
          await createLink({
            source: redirect.source,
            destination: redirect.destination,
            title: redirect.title || `GitHub Sync: ${redirect.source}`,
            description: redirect.description || `Auto-synced from GitHub`
          });
          console.log(`✅ Synced from GitHub: ${redirect.source}`);
        }
      } catch (error) {
        console.log(`⚠️ Skipped ${redirect.source}:`, error);
      }
    }

    return NextResponse.json({
      message: 'GitHub sync completed',
      synced: redirects.redirects.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GitHub sync error:', error);
    return NextResponse.json({
      error: 'GitHub sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // GitHub webhook handler
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');
    
    if (event === 'push') {
      // Auto-sync when redirects.json is updated
      return GET();
    }
    
    return NextResponse.json({ message: 'Webhook received' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      error: 'Webhook processing failed'
    }, { status: 500 });
  }
}

// Manual trigger GitHub Action untuk sync ke vercel.json
export async function PUT() {
  try {
    console.log('🔄 Manual sync to vercel.json triggered via API');
    
    const success = await triggerGitHubSync();
    
    if (success) {
      return NextResponse.json({ 
        message: 'GitHub Action triggered successfully - will sync database to vercel.json',
        status: 'success'
      });
    } else {
      return NextResponse.json({ 
        message: 'Failed to trigger GitHub Action',
        status: 'error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error triggering manual sync:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
