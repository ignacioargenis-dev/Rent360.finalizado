// Script para probar la API de prospects directamente
const fetch = require('node-fetch');

async function testProspectsAPI() {
  console.log('🔍 Probando API de prospects...');

  try {
    // Simular una llamada sin autenticación (debería fallar)
    console.log('📡 Intentando llamada sin autenticación...');
    const response = await fetch('http://localhost:3000/api/broker/clients/prospects');

    console.log('📊 Respuesta:', response.status, response.statusText);

    if (response.status === 401) {
      console.log('✅ API responde correctamente: requiere autenticación');
    } else {
      const data = await response.json();
      console.log('📋 Datos de respuesta:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('💡 El servidor podría no estar ejecutándose en localhost:3000');
  }
}

testProspectsAPI();
