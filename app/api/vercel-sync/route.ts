import { NextRequest, NextResponse } from 'next/server';
import { getAllLinks } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Get all links from database
    const dbLinks = await getAllLinks();
    
    // Get current static redirects
    const redirectsPath = path.join(process.cwd(), 'redirects.json');
    const redirectsContent = await fs.readFile(redirectsPath, 'utf-8');
    const staticRedirects = JSON.parse(redirectsContent);
    
    // Combine database links with static redirects
    const allRedirects = [
      ...staticRedirects.redirects,
      ...dbLinks.map(link => ({
        source: link.source,
        destination: link.destination,
        permanent: false
      }))
    ];
    
    // Remove duplicates (static redirects take priority)
    const uniqueRedirects = allRedirects.filter((redirect, index, arr) => 
      arr.findIndex(r => r.source === redirect.source) === index
    );
    
    // Generate new vercel.json content
    const vercelConfig = {
      "buildCommand": "pnpm build",
      "devCommand": "pnpm dev", 
      "installCommand": "pnpm install",
      "framework": "nextjs",
      "redirects": uniqueRedirects
    };
    
    return NextResponse.json({
      message: 'Vercel config generated',
      redirectsCount: uniqueRedirects.length,
      vercelConfig,
      instructions: {
        step1: 'Copy the vercelConfig to your vercel.json file',
        step2: 'Deploy with: vercel --prod',
        step3: 'All redirects will work natively via Vercel'
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
        message: 'vercel.json updated successfully',
        redirectsCount: data.redirectsCount,
        note: 'Please redeploy to apply changes'
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
