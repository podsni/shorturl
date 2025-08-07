#!/usr/bin/env node

/**
 * Script untuk sync database ke vercel.json
 * Digunakan oleh GitHub Actions
 */

const fs = require('fs');
const path = require('path');

// Import database functions
const { createClient } = require('@libsql/client');

async function syncDatabaseToVercel() {
  try {
    console.log('🔄 Starting database to vercel.json sync...');
    
    // Initialize database connection
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Get all links from database
    const result = await client.execute('SELECT source, destination FROM links ORDER BY source');
    const dbLinks = result.rows;
    
    console.log(`📊 Found ${dbLinks.length} links in database`);

    // Read current vercel.json
    const vercelPath = path.join(process.cwd(), 'vercel.json');
    
    // Transform database links to Vercel redirect format
    // Simple URL shortener: /short-path -> destination
    const newRedirects = dbLinks.map(link => ({
      source: link.source, // e.g., "/gh", "/react-suspense"
      destination: link.destination, // e.g., "https://github.com/username"
      permanent: false // Use 307 temporary redirects for flexibility
    }));
    
    // Simple Vercel config for URL shortener
    const vercelConfig = {
      "redirects": newRedirects
    };
    
    // Write updated vercel.json
    fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2) + '\n');
    
    console.log('✅ Successfully synced database to vercel.json');
    console.log(`📝 Updated ${newRedirects.length} redirects`);
    
    // Log the redirects for debugging
    console.log('\n📋 Current redirects:');
    newRedirects.forEach(redirect => {
      console.log(`  ${redirect.source} → ${redirect.destination}`);
    });
    
  } catch (error) {
    console.error('❌ Error syncing database to vercel.json:', error);
    process.exit(1);
  }
}

// Run the sync
syncDatabaseToVercel();
