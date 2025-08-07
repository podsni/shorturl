import { initDatabase, createLink, getAllLinks } from './db.js';

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');
    
    // Initialize database first
    await initDatabase();
    
    // Check if links already exist
    const existingLinks = await getAllLinks();
    console.log('Existing links:', existingLinks.length);
    
    // Default links to create
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
    
    // Add default links if database is empty
    if (existingLinks.length === 0) {
      console.log('📝 Adding default links...');
      
      for (const linkData of defaultLinks) {
        try {
          await createLink(linkData);
          console.log(`✅ Added link: ${linkData.source}`);
        } catch (error) {
          console.log(`⚠️ Skipped ${linkData.source}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    } else {
      console.log('✅ Database already has links, skipping seed.');
    }
    
    console.log('🌱 Database seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}
