import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface VercelRedirect {
  source: string;
  destination: string;
  permanent?: boolean;
}

interface VercelConfig {
  redirects?: VercelRedirect[];
}

interface AddRedirectRequest {
  source: string;
  destination: string;
  permanent?: boolean;
}

export async function GET() {
  try {
    // Read vercel.json directly
    const vercelPath = path.join(process.cwd(), 'vercel.json');
    const vercelContent = await fs.readFile(vercelPath, 'utf-8');
    const vercelConfig: VercelConfig = JSON.parse(vercelContent);
    
    // Return redirects from vercel.json
    const redirects = vercelConfig.redirects || [];
    
    return NextResponse.json({
      redirects: redirects.map((redirect: VercelRedirect, index: number) => ({
        id: index + 1,
        source: redirect.source,
        destination: redirect.destination,
        permanent: redirect.permanent || false,
        title: `Redirect ${redirect.source}`,
        description: `Vercel native redirect to ${redirect.destination}`
      }))
    });
    
  } catch (error) {
    console.error('Error reading vercel.json:', error);
    return NextResponse.json({
      error: 'Failed to read vercel.json',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: AddRedirectRequest = await request.json();
    const { source, destination, permanent = false } = body;
    
    if (!source || !destination) {
      return NextResponse.json(
        { error: 'Source and destination are required' },
        { status: 400 }
      );
    }
    
    // Read current vercel.json
    const vercelPath = path.join(process.cwd(), 'vercel.json');
    const vercelContent = await fs.readFile(vercelPath, 'utf-8');
    const vercelConfig = JSON.parse(vercelContent);
    
    // Add new redirect
    if (!vercelConfig.redirects) {
      vercelConfig.redirects = [];
    }
    
    // Format source path
    const formattedSource = source.startsWith('/') ? source : `/${source}`;
    
    // Check if source already exists
    const existingIndex = vercelConfig.redirects.findIndex(
      (redirect: any) => redirect.source === formattedSource
    );
    
    if (existingIndex !== -1) {
      return NextResponse.json(
        { error: 'A redirect with this source path already exists' },
        { status: 409 }
      );
    }
    
    // Add new redirect
    vercelConfig.redirects.push({
      source: formattedSource,
      destination,
      permanent
    });
    
    // Write back to vercel.json
    await fs.writeFile(vercelPath, JSON.stringify(vercelConfig, null, 2));
    
    return NextResponse.json({
      message: 'Redirect added to vercel.json successfully',
      redirect: {
        source: formattedSource,
        destination,
        permanent
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error updating vercel.json:', error);
    return NextResponse.json({
      error: 'Failed to update vercel.json',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
