// Script para probar las APIs que están fallando
const fetch = require('node-fetch');

async function testAPIs() {
  const baseUrl = 'http://localhost:3000';

  console.log('🧪 TESTING BROKER APIs...\n');

  try {
    // 1. Test auth
    console.log('1️⃣ Testing auth endpoint...');
    const authResponse = await fetch(`${baseUrl}/api/debug/auth-test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Nota: En desarrollo, las cookies pueden no enviarse correctamente desde Node.js
        // Esto simula una llamada sin autenticación
      },
    });

    const authData = await authResponse.json();
    console.log('Auth response:', authResponse.status, authData);

    // 2. Test broker properties (sin auth para ver si la API responde)
    console.log('\n2️⃣ Testing broker properties API...');
    const propsResponse = await fetch(`${baseUrl}/api/broker/properties?status=all&limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const propsData = await propsResponse.json();
    console.log('Properties response:', propsResponse.status);
    if (propsResponse.status === 401) {
      console.log('❌ Authentication required for broker properties');
    } else {
      console.log('Properties data:', propsData);
    }

    // 3. Test broker clients active
    console.log('\n3️⃣ Testing broker clients active API...');
    const clientsResponse = await fetch(`${baseUrl}/api/broker/clients/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const clientsData = await clientsResponse.json();
    console.log('Clients response:', clientsResponse.status);
    if (clientsResponse.status === 401) {
      console.log('❌ Authentication required for broker clients');
    } else {
      console.log('Clients data:', clientsData);
    }

    // 4. Test broker dashboard
    console.log('\n4️⃣ Testing broker dashboard API...');
    const dashboardResponse = await fetch(`${baseUrl}/api/broker/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard response:', dashboardResponse.status);
    if (dashboardResponse.status === 401) {
      console.log('❌ Authentication required for broker dashboard');
    } else {
      console.log('Dashboard data:', dashboardData);
    }

    // 5. Test specific client details (con ID conocido)
    console.log('\n5️⃣ Testing client details API...');
    const clientId = 'cmhdw0x0y0001jlr1eeui1c21';
    const clientResponse = await fetch(`${baseUrl}/api/broker/clients/${clientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const clientData = await clientResponse.json();
    console.log('Client details response:', clientResponse.status);
    if (clientResponse.status === 401) {
      console.log('❌ Authentication required for client details');
    } else if (clientResponse.status === 404) {
      console.log('❌ Client not found');
    } else {
      console.log('Client data:', clientData);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAPIs();
