import { NextResponse } from 'next/server';
import { getAllLinks } from '@/lib/db';

export async function GET() {
  try {
    const links = await getAllLinks();
    
    return NextResponse.json({
      status: 'Database connected',
      totalLinks: links.length,
      links: links.map(link => ({
        id: link.id,
        source: link.source,
        destination: link.destination,
        title: link.title
      })),
      environment: {
        hasDbUrl: !!process.env.TURSO_DATABASE_URL,
        hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      status: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        hasDbUrl: !!process.env.TURSO_DATABASE_URL,
        hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}
