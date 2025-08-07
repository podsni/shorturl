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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
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
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    }));
  } catch (error) {
    console.error('Error fetching links:', error);
    throw error;
  }
}

export async function createLink(linkData: Omit<LinkData, 'id' | 'created_at' | 'updated_at'>): Promise<LinkData> {
  try {
    const { source, destination, title, description } = linkData;
    
    const result = await client.execute({
      sql: 'INSERT INTO links (source, destination, title, description) VALUES (?, ?, ?, ?) RETURNING *',
      args: [source, destination, title || null, description || null]
    });
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id as number,
        source: row.source as string,
        destination: row.destination as string,
        title: row.title as string | undefined,
        description: row.description as string | undefined,
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
    const { source, destination, title, description } = linkData;
    
    const result = await client.execute({
      sql: 'UPDATE links SET source = ?, destination = ?, title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *',
      args: [source, destination, title || null, description || null, id]
    });
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id as number,
        source: row.source as string,
        destination: row.destination as string,
        title: row.title as string | undefined,
        description: row.description as string | undefined,
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
    const result = await client.execute({
      sql: 'SELECT * FROM links WHERE source = ?',
      args: [source]
    });
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id as number,
        source: row.source as string,
        destination: row.destination as string,
        title: row.title as string | undefined,
        description: row.description as string | undefined,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching link by source:', error);
    throw error;
  }
}

export default client;
