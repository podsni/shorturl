import { NextRequest, NextResponse } from 'next/server';
import { getAllLinks, getDraftLinks, createLink, updateLink, deleteLink, initDatabase } from '@/lib/db';

// Initialize database on first load
initDatabase().catch(console.error);

// Admin endpoint - returns all links including drafts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let links;
    if (status === 'draft') {
      links = await getDraftLinks();
    } else {
      links = await getAllLinks();
    }
    
    // Transform to match the original API structure
    const response = {
      redirects: links.map(link => ({
        id: link.id,
        source: link.source,
        destination: link.destination,
        status: link.status,
        created_at: link.created_at,
        ...(link.title && { title: link.title }),
        ...(link.description && { description: link.description })
      }))
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching admin links:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Admin endpoint - create new link as draft
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

    // Create new link as draft (admin approval required)
    const newLink = await createLink({
      source: formattedSource,
      destination: formattedDestination,
      title: title || undefined,
      description: description || undefined,
      status: 'draft' // Always create as draft for admin review
    });

    return NextResponse.json(
      { 
        message: 'Link saved as draft - awaiting admin approval for sync', 
        link: {
          id: newLink.id,
          source: newLink.source,
          destination: newLink.destination,
          status: newLink.status,
          ...(newLink.title && { title: newLink.title }),
          ...(newLink.description && { description: newLink.description })
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating admin link:', error);
    
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

// Admin endpoint - approve draft for sync
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: 'ID and action are required' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Update status to published (ready for sync)
      const updatedLink = await updateLink(id, {
        source: '', // Will be fetched from existing record
        destination: '',
        status: 'published'
      });

      return NextResponse.json({
        message: 'Link approved for sync',
        link: updatedLink
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating admin link:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
