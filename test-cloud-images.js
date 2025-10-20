#!/usr/bin/env node

const https = require('https');

async function testCloudImages() {
  console.log('🔍 Probando acceso a imágenes de cloud storage...\n');

  const images = [
    'https://rent360-images.nyc3.digitaloceanspaces.com/properties/cmgso8wv00003p5qwva17zrmn/1760991051320_ngnean7ktui_image_1_1760991051319_vyxfm7u1w5.png',
    'https://rent360-images.nyc3.digitaloceanspaces.com/properties/cmgso8wv00003p5qwva17zrmn/1760991052514_qlk8oxdkwvj_image_1_1760991052514_vknnt9t2059.png',
    'https://rent360-images.nyc3.digitaloceanspaces.com/properties/cmgso8wv00003p5qwva17zrmn/1760991054170_z720p79y2f_image_1_1760991054170_6ajbsq4c4du.png',
  ];

  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    console.log(`📸 Probando imagen ${i + 1}:`);
    console.log(`   URL: ${url}`);

    try {
      const result = await testImageUrl(url);
      if (result.success) {
        console.log(`   ✅ Accesible - Status: ${result.status} - Tamaño: ${result.size} bytes`);
      } else {
        console.log(`   ❌ No accesible - Status: ${result.status} - Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

function testImageUrl(url) {
  return new Promise(resolve => {
    const request = https.get(url, response => {
      let data = '';

      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        resolve({
          success: response.statusCode === 200,
          status: response.statusCode,
          size: data.length,
          error: response.statusCode !== 200 ? `HTTP ${response.statusCode}` : null,
        });
      });
    });

    request.on('error', error => {
      resolve({
        success: false,
        status: 0,
        size: 0,
        error: error.message,
      });
    });

    request.setTimeout(10000, () => {
      request.destroy();
      resolve({
        success: false,
        status: 0,
        size: 0,
        error: 'Timeout',
      });
    });
  });
}

testCloudImages();
