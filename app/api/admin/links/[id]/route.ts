import { NextRequest, NextResponse } from 'next/server';
import { triggerGitHubSync } from '@/lib/github';

// Delete link by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const linkId = params.id;

    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!
    });

    // First, get the link to return it in the response
    const getResult = await client.execute({
      sql: 'SELECT * FROM links WHERE id = ?',
      args: [linkId]
    });

    if (getResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    // Delete the link
    const deleteResult = await client.execute({
      sql: 'DELETE FROM links WHERE id = ?',
      args: [linkId]
    });

    if (deleteResult.rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Failed to delete link' },
        { status: 500 }
      );
    }

    const deletedRow = getResult.rows[0];
    const deletedLink = {
      id: deletedRow.id as number,
      source: deletedRow.source as string,
      destination: deletedRow.destination as string,
      title: deletedRow.title as string | undefined,
      description: deletedRow.description as string | undefined,
      status: deletedRow.status as 'draft' | 'published' | 'synced',
      created_at: deletedRow.created_at as string,
      updated_at: deletedRow.updated_at as string
    };

    return NextResponse.json({
      message: 'Link deleted successfully',
      link: deletedLink
    });
    
    // Auto-trigger GitHub sync after deletion if it was a published/synced link
    if (deletedLink.status === 'published' || deletedLink.status === 'synced') {
      try {
        console.log('🔄 Auto-triggering GitHub sync after link deletion...');
        await triggerGitHubSync();
        console.log('✅ GitHub sync triggered successfully');
      } catch (syncError) {
        console.error('⚠️ Failed to auto-trigger GitHub sync:', syncError);
        // Don't fail the deletion if sync fails
      }
    }
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Update link by ID
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const linkId = params.id;
    const body = await request.json();
    const { source, destination, title, description } = body;

    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    if (!source || !destination) {
      return NextResponse.json(
        { error: 'Source and destination are required' },
        { status: 400 }
      );
    }

    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!
    });

    // Check if link exists
    const checkResult = await client.execute({
      sql: 'SELECT id FROM links WHERE id = ?',
      args: [linkId]
    });

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    // Check if source path is already used by another link
    const duplicateResult = await client.execute({
      sql: 'SELECT id FROM links WHERE source = ? AND id != ?',
      args: [source, linkId]
    });

    if (duplicateResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Source path already exists for another link' },
        { status: 409 }
      );
    }

    // Update the link
    const updateResult = await client.execute({
      sql: 'UPDATE links SET source = ?, destination = ?, title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *',
      args: [source, destination, title || null, description || null, linkId]
    });

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update link' },
        { status: 500 }
      );
    }

    const updatedRow = updateResult.rows[0];
    const updatedLink = {
      id: updatedRow.id as number,
      source: updatedRow.source as string,
      destination: updatedRow.destination as string,
      title: updatedRow.title as string | undefined,
      description: updatedRow.description as string | undefined,
      status: updatedRow.status as 'draft' | 'published' | 'synced',
      created_at: updatedRow.created_at as string,
      updated_at: updatedRow.updated_at as string
    };

    return NextResponse.json({
      message: 'Link updated successfully',
      link: updatedLink
    });
    
    // Auto-trigger GitHub sync after update if it's published/synced
    if (updatedLink.status === 'published' || updatedLink.status === 'synced') {
      try {
        console.log('🔄 Auto-triggering GitHub sync after link update...');
        await triggerGitHubSync();
        console.log('✅ GitHub sync triggered successfully');
      } catch (syncError) {
        console.error('⚠️ Failed to auto-trigger GitHub sync:', syncError);
        // Don't fail the update if sync fails
      }
    }
  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
