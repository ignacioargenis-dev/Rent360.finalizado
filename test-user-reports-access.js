/**
 * Script para probar acceso a user-reports con admin
 */

const fetch = require('node-fetch');

const BASE_URL = 'https://rent360management-2yxgz.ondigitalocean.app';

async function testUserReportsAccess() {
  console.log('🔍 Probando acceso a user-reports...\n');

  try {
    // 1. Login como admin
    console.log('1️⃣ Login como admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@rent360.cl',
        password: 'admin123',
      }),
    });

    if (!loginResponse.ok) {
      console.log('❌ Login falló');
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso:', loginData.user.email, 'Rol:', loginData.user.role);

    // 2. Extraer token de las cookies
    const cookies = loginResponse.headers.get('set-cookie');
    const tokenMatch = cookies?.match(/auth-token=([^;]+)/);
    if (!tokenMatch) {
      console.log('❌ No se encontró token');
      return;
    }

    const authToken = tokenMatch[1];
    console.log('✅ Token extraído');

    // 3. Probar /api/auth/me
    console.log('\n2️⃣ Probando /api/auth/me...');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `auth-token=${authToken}` },
    });

    console.log(`📊 /api/auth/me status: ${meResponse.status}`);

    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ /api/auth/me funciona:', meData.user.email, 'Rol:', meData.user.role);
    } else {
      console.log('❌ /api/auth/me falla');
      return;
    }

    // 4. Probar /api/admin/user-reports
    console.log('\n3️⃣ Probando /api/admin/user-reports...');
    const reportsResponse = await fetch(`${BASE_URL}/api/admin/user-reports`, {
      headers: { Cookie: `auth-token=${authToken}` },
    });

    console.log(`📊 /api/admin/user-reports status: ${reportsResponse.status}`);

    if (reportsResponse.ok) {
      const reportsData = await reportsResponse.json();
      console.log('✅ API user-reports funciona correctamente');
      console.log(`📋 Reportes encontrados: ${reportsData.reports?.length || 0}`);
    } else {
      const errorData = await reportsResponse.json();
      console.log('❌ API user-reports falla:', errorData);
    }

    console.log('\n🎯 DIAGNÓSTICO:');
    console.log('- Si todo funciona: El problema está en el frontend (página user-reports)');
    console.log('- Si API falla: El problema está en el backend');
    console.log('- Usuario admin existe y funciona correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUserReportsAccess();
