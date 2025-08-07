import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'reset') {
      // Delete all existing links
      await client.execute('DELETE FROM links');
      
      // Insert default links
      const defaultLinks = [
        {
          source: '/ujicoba',
          destination: 'https://google.com',
          title: 'Ujicoba Link',
          description: 'Default test link'
        },
        {
          source: '/google',
          destination: 'https://google.com',
          title: 'Google',
          description: 'Quick link to Google'
        },
        {
          source: '/github',
          destination: 'https://github.com',
          title: 'GitHub',
          description: 'Quick link to GitHub'
        }
      ];
      
      for (const link of defaultLinks) {
        await client.execute({
          sql: 'INSERT INTO links (source, destination, title, description) VALUES (?, ?, ?, ?)',
          args: [link.source, link.destination, link.title, link.description]
        });
      }
      
      return NextResponse.json({ 
        message: 'Database reset successfully',
        links: defaultLinks.length
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ 
      error: 'Reset failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
