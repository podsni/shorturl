import { NextRequest, NextResponse } from 'next/server';
import { getAllLinks, getDraftLinks, createLink, updateLink, deleteLink, initDatabase } from '@/lib/db';
import { triggerGitHubSync } from '@/lib/github';

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
      // Simply update status to published (ready for sync)
      try {
        const { createClient } = await import('@libsql/client');
        const client = createClient({
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN!
        });

        const result = await client.execute({
          sql: 'UPDATE links SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *',
          args: ['published', id]
        });

        if (result.rows.length > 0) {
          const row = result.rows[0];
          const updatedLink = {
            id: row.id as number,
            source: row.source as string,
            destination: row.destination as string,
            title: row.title as string | undefined,
            description: row.description as string | undefined,
            status: row.status as 'draft' | 'published' | 'synced',
            created_at: row.created_at as string,
            updated_at: row.updated_at as string
          };

          return NextResponse.json({
            message: 'Link approved for sync',
            link: updatedLink
          });
          
          // Auto-trigger GitHub sync after approval
          try {
            console.log('🔄 Auto-triggering GitHub sync after link approval...');
            await triggerGitHubSync();
            console.log('✅ GitHub sync triggered successfully');
          } catch (syncError) {
            console.error('⚠️ Failed to auto-trigger GitHub sync:', syncError);
            // Don't fail the approval if sync fails
          }
        } else {
          return NextResponse.json(
            { error: 'Link not found' },
            { status: 404 }
          );
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json(
          { error: 'Database error', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
          { status: 500 }
        );
      }
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
