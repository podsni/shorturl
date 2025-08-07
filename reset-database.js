async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    const response = await fetch('https://link.dwx.my.id/api/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'reset'
      })
    });

    const result = await response.json();
    console.log('Reset response:', result);
    
    if (response.ok) {
      console.log('✅ Database reset successfully!');
      console.log(`📊 Added ${result.links} default links`);
      
      // Verify the reset
      const verifyResponse = await fetch('https://link.dwx.my.id/api/debug');
      const dbStatus = await verifyResponse.json();
      console.log('🔍 Verification:', dbStatus);
      
    } else {
      console.log('❌ Reset failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetDatabase();
