async function cleanAndFixDatabase() {
  try {
    console.log('🧹 Membersihkan database...');
    
    // Hapus semua link yang ada
    const deleteResponse = await fetch('https://link.dwx.my.id/api/links/2', {
      method: 'DELETE',
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Link lama berhasil dihapus');
    } else {
      console.log('⚠️ Tidak ada link untuk dihapus atau sudah terhapus');
    }
    
    // Tunggu sebentar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tambah link ujicoba yang benar
    console.log('➕ Menambahkan link /ujicoba...');
    const addResponse1 = await fetch('https://link.dwx.my.id/api/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: '/ujicoba',
        destination: 'https://google.com',
        title: 'Ujicoba Link',
        description: 'Link test untuk ujicoba'
      })
    });

    const result1 = await addResponse1.json();
    console.log('Response ujicoba:', result1);
    
    // Tambah link test lainnya
    console.log('➕ Menambahkan link /google...');
    const addResponse2 = await fetch('https://link.dwx.my.id/api/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: '/google',
        destination: 'https://google.com',
        title: 'Google',
        description: 'Shortlink ke Google'
      })
    });

    const result2 = await addResponse2.json();
    console.log('Response google:', result2);
    
    // Verifikasi database
    console.log('🔍 Verifikasi database...');
    const verifyResponse = await fetch('https://link.dwx.my.id/api/debug');
    const dbStatus = await verifyResponse.json();
    console.log('📊 Status database:', dbStatus);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanAndFixDatabase();
