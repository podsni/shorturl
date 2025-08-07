async function addTestLink() {
  try {
    // Tambah link baru dengan slug yang benar
    const response = await fetch('https://link.dwx.my.id/api/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: '/test123',
        destination: 'https://google.com',
        title: 'Test Link Baru',
        description: 'Link untuk testing yang baru'
      })
    });

    const result = await response.json();
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('✅ Link berhasil ditambahkan!');
      console.log('🔗 Test link: https://link.dwx.my.id/test123');
    } else {
      console.log('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

addTestLink();
