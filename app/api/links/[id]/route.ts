import { NextRequest, NextResponse } from 'next/server';
import { updateLink, deleteLink, getAllLinks } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid link ID' },
        { status: 400 }
      );
    }

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

    // Update link
    const updatedLink = await updateLink(id, {
      source: formattedSource,
      destination: formattedDestination,
      title: title || undefined,
      description: description || undefined
    });

    return NextResponse.json({
      message: 'Link updated successfully',
      link: {
        source: updatedLink.source,
        destination: updatedLink.destination,
        ...(updatedLink.title && { title: updatedLink.title }),
        ...(updatedLink.description && { description: updatedLink.description })
      }
    });
  } catch (error) {
    console.error('Error updating link:', error);
    
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { error: 'A link with this source path already exists' },
        { status: 409 }
      );
    }
    
    // Check for not found
    if (error instanceof Error && error.message.includes('Link not found')) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid link ID' },
        { status: 400 }
      );
    }

    const success = await deleteLink(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// For backward compatibility with the original API that used array indices
export async function GET() {
  try {
    const links = await getAllLinks();
    
    // Transform to match the original API structure
    const response = {
      redirects: links.map(link => ({
        id: link.id,
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
