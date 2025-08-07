async function fixUjicobaLink() {
  try {
    console.log('🔧 Memperbaiki link /ujicoba...');
    
    // 1. Hapus link lama yang typo (/ujicob)
    const deleteResponse = await fetch('https://link.dwx.my.id/api/links/2', {
      method: 'DELETE',
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Link lama /ujicob berhasil dihapus');
    }
    
    // 2. Tambah link baru yang benar (/ujicoba)
    const addResponse = await fetch('https://link.dwx.my.id/api/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: '/ujicoba',
        destination: 'https://google.com', // Ganti dengan URL tujuan yang diinginkan
        title: 'Ujicoba Link',
        description: 'Link ujicoba yang sudah diperbaiki'
      })
    });

    const result = await addResponse.json();
    
    if (addResponse.ok) {
      console.log('✅ Link baru /ujicoba berhasil ditambahkan!');
      console.log('🔗 Link yang diperbaiki: https://link.dwx.my.id/ujicoba');
      console.log('📊 Detail:', result.link);
    } else {
      console.log('❌ Error adding new link:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixUjicobaLink();
