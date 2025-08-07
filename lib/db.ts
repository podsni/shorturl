import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

export interface LinkData {
  id?: number;
  source: string;
  destination: string;
  title?: string;
  description?: string;
  status?: 'draft' | 'published' | 'synced';
  created_at?: string;
  updated_at?: string;
}

export async function initDatabase() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT UNIQUE NOT NULL,
        destination TEXT NOT NULL,
        title TEXT,
        description TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add status column if it doesn't exist (for existing databases)
    try {
      await client.execute(`
        ALTER TABLE links ADD COLUMN status TEXT DEFAULT 'draft'
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }
    
    console.log('Database initialized successfully');
    
    // Seed database with default links if empty
    await seedDefaultLinks();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

async function seedDefaultLinks() {
  try {
    const result = await client.execute('SELECT COUNT(*) as count FROM links');
    const count = result.rows[0].count as number;
    
    if (count === 0) {
      console.log('🌱 Seeding database with default links...');
      
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
        try {
          await client.execute({
            sql: 'INSERT INTO links (source, destination, title, description) VALUES (?, ?, ?, ?)',
            args: [link.source, link.destination, link.title, link.description]
          });
          console.log(`✅ Seeded link: ${link.source}`);
        } catch (error) {
          console.log(`⚠️ Failed to seed ${link.source}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }
  } catch (error) {
    console.error('Error seeding default links:', error);
  }
}

export async function getAllLinks(): Promise<LinkData[]> {
  try {
    const result = await client.execute('SELECT * FROM links ORDER BY created_at DESC');
    return result.rows.map(row => ({
      id: row.id as number,
      source: row.source as string,
      destination: row.destination as string,
      title: row.title as string | undefined,
      description: row.description as string | undefined,
      status: (row.status as 'draft' | 'published' | 'synced') || 'draft',
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    }));
  } catch (error) {
    console.error('Error fetching links:', error);
    throw error;
  }
}

// Get only published/synced links (for public display)
export async function getPublishedLinks(): Promise<LinkData[]> {
  try {
    const result = await client.execute("SELECT * FROM links WHERE status IN ('published', 'synced') ORDER BY created_at DESC");
    return result.rows.map(row => ({
      id: row.id as number,
      source: row.source as string,
      destination: row.destination as string,
      title: row.title as string | undefined,
      description: row.description as string | undefined,
      status: (row.status as 'draft' | 'published' | 'synced') || 'draft',
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    }));
  } catch (error) {
    console.error('Error fetching published links:', error);
    throw error;
  }
}

// Get draft links (for admin view)
export async function getDraftLinks(): Promise<LinkData[]> {
  try {
    const result = await client.execute("SELECT * FROM links WHERE status = 'draft' ORDER BY created_at DESC");
    return result.rows.map(row => ({
      id: row.id as number,
      source: row.source as string,
      destination: row.destination as string,
      title: row.title as string | undefined,
      description: row.description as string | undefined,
      status: (row.status as 'draft' | 'published' | 'synced') || 'draft',
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    }));
  } catch (error) {
    console.error('Error fetching draft links:', error);
    throw error;
  }
}

export async function createLink(linkData: Omit<LinkData, 'id' | 'created_at' | 'updated_at'>): Promise<LinkData> {
  try {
    const { source, destination, title, description, status = 'draft' } = linkData;
    
    const result = await client.execute({
      sql: 'INSERT INTO links (source, destination, title, description, status) VALUES (?, ?, ?, ?, ?) RETURNING *',
      args: [source, destination, title || null, description || null, status]
    });
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id as number,
        source: row.source as string,
        destination: row.destination as string,
        title: row.title as string | undefined,
        description: row.description as string | undefined,
        status: (row.status as 'draft' | 'published' | 'synced') || 'draft',
        created_at: row.created_at as string,
        updated_at: row.updated_at as string
      };
    }
    
    throw new Error('Failed to create link');
  } catch (error) {
    console.error('Error creating link:', error);
    throw error;
  }
}

export async function updateLink(id: number, linkData: Omit<LinkData, 'id' | 'created_at' | 'updated_at'>): Promise<LinkData> {
  try {
    const { source, destination, title, description, status } = linkData;
    
    const result = await client.execute({
      sql: 'UPDATE links SET source = ?, destination = ?, title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *',
      args: [source, destination, title || null, description || null, status || 'draft', id]
    });
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id as number,
        source: row.source as string,
        destination: row.destination as string,
        title: row.title as string | undefined,
        description: row.description as string | undefined,
        status: (row.status as 'draft' | 'published' | 'synced') || 'draft',
        created_at: row.created_at as string,
        updated_at: row.updated_at as string
      };
    }
    
    throw new Error('Link not found');
  } catch (error) {
    console.error('Error updating link:', error);
    throw error;
  }
}

// Update status of multiple links (used by sync process)
export async function updateLinksStatus(status: 'draft' | 'published' | 'synced'): Promise<void> {
  try {
    await client.execute({
      sql: 'UPDATE links SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE status != ?',
      args: [status, status]
    });
  } catch (error) {
    console.error('Error updating links status:', error);
    throw error;
  }
}

export async function deleteLink(id: number): Promise<boolean> {
  try {
    const result = await client.execute({
      sql: 'DELETE FROM links WHERE id = ?',
      args: [id]
    });
    
    return (result.rowsAffected || 0) > 0;
  } catch (error) {
    console.error('Error deleting link:', error);
    throw error;
  }
}

export async function getLinkBySource(source: string): Promise<LinkData | null> {
  try {
    console.log('Looking for link with source:', source);
    
    const result = await client.execute({
      sql: 'SELECT * FROM links WHERE source = ?',
      args: [source]
    });
    
    console.log('Database query result:', { 
      rowCount: result.rows.length, 
      searchedSource: source 
    });
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      const linkData = {
        id: row.id as number,
        source: row.source as string,
        destination: row.destination as string,
        title: row.title as string | undefined,
        description: row.description as string | undefined,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string
      };
      
      console.log('Found link:', linkData);
      return linkData;
    }
    
    console.log('No link found for source:', source);
    return null;
  } catch (error) {
    console.error('Error fetching link by source:', error, 'Source:', source);
    throw error;
  }
}

export default client;
