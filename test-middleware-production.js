/**
 * Script para probar el middleware en producción
 */

const fetch = require('node-fetch');

const BASE_URL = 'https://rent360management-2yxgz.ondigitalocean.app';

async function testMiddleware() {
  console.log('🧪 Probando middleware en producción...\n');

  try {
    // 1. Probar ruta pública (debería funcionar sin autenticación)
    console.log('1️⃣ Probando ruta pública /api/health...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    console.log(`✅ Health: ${healthResponse.status}`);

    // 2. Probar ruta de login (debería funcionar sin autenticación)
    console.log('\n2️⃣ Probando login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@rent360.cl',
        password: 'owner123',
      }),
    });

    if (!loginResponse.ok) {
      console.log(`❌ Login falló: ${loginResponse.status}`);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso');

    // Extraer token
    const cookies = loginResponse.headers.get('set-cookie');
    const authTokenMatch = cookies?.match(/auth-token=([^;]+)/);
    if (!authTokenMatch) {
      console.log('❌ No se encontró token de autenticación');
      return;
    }

    const authToken = authTokenMatch[1];
    console.log('✅ Token extraído');

    // 3. Probar endpoint protegido
    console.log('\n3️⃣ Probando endpoint protegido /api/messages...');
    const messagesResponse = await fetch(`${BASE_URL}/api/messages`, {
      headers: {
        Cookie: `auth-token=${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Messages status: ${messagesResponse.status}`);

    if (messagesResponse.ok) {
      const data = await messagesResponse.json();
      console.log('✅ Mensajes funcionando correctamente!');
      console.log(`📨 Total mensajes: ${data.messages?.length || 0}`);
    } else {
      const errorData = await messagesResponse.json();
      console.log('❌ Error en mensajes:', errorData);
    }

    // 4. Probar endpoint /api/auth/me (debería funcionar)
    console.log('\n4️⃣ Probando /api/auth/me...');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: `auth-token=${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Auth/me status: ${meResponse.status}`);

    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ Auth/me funcionando:', meData.user?.email);
    } else {
      console.log('❌ Error en auth/me');
    }
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  }
}

testMiddleware();
