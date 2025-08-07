import { NextRequest, NextResponse } from 'next/server';
import { getAllLinks, createLink, initDatabase } from '@/lib/db';
import { triggerGitHubSync } from '@/lib/github';

// Initialize database on first load
initDatabase().catch(console.error);

export async function GET() {
  try {
    const links = await getAllLinks();
    
    // Transform to match the original API structure
    const response = {
      redirects: links.map(link => ({
        source: link.source,
        destination: link.destination,
        ...(link.title && { title: link.title }),
        ...(link.description && { description: link.description })
      }))
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, destination, title, description } = body;

    // Validation
    if (!source || !destination) {
      return NextResponse.json(
        { error: 'Source and destination are required' },
        { status: 400 }
      );
    }

    // Format source path
    const formattedSource = source.startsWith('/') ? source : `/${source}`;

    // Format destination URL
    let formattedDestination = destination;
    if (!destination.startsWith('http://') && !destination.startsWith('https://')) {
      formattedDestination = `https://${destination}`;
    }

    // Create new link
    const newLink = await createLink({
      source: formattedSource,
      destination: formattedDestination,
      title: title || undefined,
      description: description || undefined
    });

    // Trigger GitHub Action untuk sync ke vercel.json
    triggerGitHubSync().catch(error => {
      console.warn('Failed to trigger GitHub sync:', error);
    });

    return NextResponse.json(
      { 
        message: 'Link added successfully', 
        link: {
          source: newLink.source,
          destination: newLink.destination,
          ...(newLink.title && { title: newLink.title }),
          ...(newLink.description && { description: newLink.description })
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating link:', error);
    
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { error: 'A link with this source path already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
