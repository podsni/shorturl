const { createClient } = require('@libsql/client');

// Initialize client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const sampleData = [
  {
    source: '/github',
    destination: 'https://github.com',
    title: 'GitHub',
    description: 'The world\'s leading software development platform'
  },
  {
    source: '/vercel',
    destination: 'https://vercel.com',
    title: 'Vercel',
    description: 'Deploy web applications with zero configuration'
  },
  {
    source: '/nextjs',
    destination: 'https://nextjs.org',
    title: 'Next.js',
    description: 'The React framework for production'
  },
  {
    source: '/tailwind',
    destination: 'https://tailwindcss.com',
    title: 'Tailwind CSS',
    description: 'A utility-first CSS framework'
  },
  {
    source: '/turso',
    destination: 'https://turso.tech',
    title: 'Turso',
    description: 'SQLite for Production'
  }
];

async function seedData() {
  try {
    console.log('🌱 Seeding sample data...');
    
    // Create table if not exists
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
    
    // Insert sample data
    for (const link of sampleData) {
      try {
        await client.execute({
          sql: 'INSERT OR IGNORE INTO links (source, destination, title, description) VALUES (?, ?, ?, ?)',
          args: [link.source, link.destination, link.title, link.description]
        });
        console.log(`✅ Added: ${link.source} -> ${link.destination}`);
      } catch (error) {
        if (!error.message.includes('UNIQUE constraint')) {
          console.error(`❌ Error adding ${link.source}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Sample data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedData().then(() => process.exit(0));
}

module.exports = { seedData };
