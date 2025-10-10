// Script para depurar las APIs problemáticas
const fetch = require('node-fetch');

async function testUsersAPI() {
  console.log('=== Probando API de usuarios ===');
  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'GET',
      headers: {
        Cookie:
          'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImFkbWluQHJlbnQzNjAuY2wiLCJyb2xlIjoiYWRtaW4iLCJuYW1lIjoiQ2FybG9zIFJvZHJpZ3VleiIsImlhdCI6MTczNTY4NzIwMCwiZXhwIjoxNzM1NzIzMjAwfQ.invalid',
      },
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('Data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
  }
}

async function testSettingsAPI() {
  console.log('\n=== Probando API de settings ===');
  try {
    // Primero GET
    const getResponse = await fetch('http://localhost:3000/api/settings', {
      method: 'GET',
      headers: {
        Cookie:
          'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImFkbWluQHJlbnQzNjAuY2wiLCJyb2xlIjoiYWRtaW4iLCJuYW1lIjoiQ2FybG9zIFJvZHJpZ3VleiIsImlhdCI6MTczNTY4NzIwMCwiZXhwIjoxNzM1NzIzMjAwfQ.invalid',
      },
    });

    console.log('GET Status:', getResponse.status);
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('GET Data:', JSON.stringify(getData, null, 2));
    } else {
      const errorText = await getResponse.text();
      console.log('GET Error:', errorText);
    }

    // Luego POST con datos de prueba
    const postResponse = await fetch('http://localhost:3000/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie:
          'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImFkbWluQHJlbnQzNjAuY2wiLCJyb2xlIjoiYWRtaW4iLCJuYW1lIjoiQ2FybG9zIFJvZHJpZ3VleiIsImlhdCI6MTczNTY4NzIwMCwiZXhwIjoxNzM1NzIzMjAwfQ.invalid',
      },
      body: JSON.stringify({
        settings: {
          general: {
            siteName: 'Rent360 Test',
            maintenanceMode: false,
          },
        },
      }),
    });

    console.log('POST Status:', postResponse.status);
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('POST Data:', JSON.stringify(postData, null, 2));
    } else {
      const errorText = await postResponse.text();
      console.log('POST Error:', errorText);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
  }
}

async function main() {
  await testUsersAPI();
  await testSettingsAPI();
}

main();
