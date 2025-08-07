import { NextRequest, NextResponse } from 'next/server';
import { getAllLinks, createLink } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Get all links from database
    const dbLinks = await getAllLinks();
    
    // Transform database links to Vercel redirects format
    // Simple URL shortener format: /short-path -> https://destination.com
    const redirects = dbLinks.map(link => ({
      source: link.source, // e.g., "/gh", "/react-17-suspence"
      destination: link.destination, // e.g., "https://github.com/username", "/blog/long-article-title"
      permanent: false // Use temporary redirects (307) for flexibility
    }));
    
    // Simple Vercel config for URL shortener
    const vercelConfig = {
      "redirects": redirects
    };
    
    return NextResponse.json({
      message: 'Simple URL Shortener config generated',
      redirectsCount: redirects.length,
      vercelConfig,
      instructions: {
        about: 'Simple URL Shortener using Vercel redirects',
        step1: 'Copy the vercelConfig to your vercel.json file',
        step2: 'Deploy with: vercel --prod', 
        step3: 'All short URLs will redirect via Vercel (307 temporary redirects)',
        example: 'Add /gh -> https://github.com/username for easy sharing',
        note: 'Works with both internal (/blog/article) and external (https://site.com) destinations'
      }
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      error: 'Failed to generate config',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Auto-update vercel.json file
    const response = await GET();
    const data = await response.json();
    
    if (data.vercelConfig) {
      const vercelPath = path.join(process.cwd(), 'vercel.json');
      await fs.writeFile(vercelPath, JSON.stringify(data.vercelConfig, null, 2));
      
      return NextResponse.json({
        message: 'vercel.json updated with simple URL shortener config',
        redirectsCount: data.redirectsCount,
        note: 'Redeploy to activate short URLs - each redirect uses 307 status for flexibility'
      });
    }
    
    return NextResponse.json({ error: 'Failed to generate config' }, { status: 500 });
    
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({
      error: 'Failed to update vercel.json',
      details: error instanceof Error ? error.message : 'Unknown error'  
    }, { status: 500 });
  }
}

// Import data dari vercel.json ke database
export async function PUT() {
  try {
    // Read current vercel.json
    const vercelPath = path.join(process.cwd(), 'vercel.json');
    const vercelContent = await fs.readFile(vercelPath, 'utf-8');
    const vercelConfig = JSON.parse(vercelContent);
    
    if (!vercelConfig.redirects || !Array.isArray(vercelConfig.redirects)) {
      return NextResponse.json({ error: 'No redirects found in vercel.json' }, { status: 400 });
    }
    
    // Get existing links from database
    const existingLinks = await getAllLinks();
    const existingSources = existingLinks.map(link => link.source);
    
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    // Import each redirect that doesn't exist in database
    for (const redirect of vercelConfig.redirects) {
      if (!redirect.source || !redirect.destination) {
        errors.push(`Invalid redirect: missing source or destination`);
        continue;
      }
      
      // Skip if already exists in database
      if (existingSources.includes(redirect.source)) {
        skippedCount++;
        continue;
      }
      
      try {
        await createLink({
          source: redirect.source,
          destination: redirect.destination,
          title: `Imported from vercel.json: ${redirect.source}`,
          description: `Auto-imported redirect to ${redirect.destination}`
        });
        importedCount++;
      } catch (error) {
        errors.push(`Failed to import ${redirect.source}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return NextResponse.json({
      message: 'Import from vercel.json completed',
      imported: importedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      note: 'Existing links in database were preserved, only new ones were imported'
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({
      error: 'Failed to import from vercel.json',
      details: error instanceof Error ? error.message : 'Unknown error'  
    }, { status: 500 });
  }
}
