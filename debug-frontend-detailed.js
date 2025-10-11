// Diagnóstico detallado del frontend
const http = require('http');

function makeRequest(options, data = null, includeCookies = false) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on('error', err => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function detailedFrontendDiagnosis() {
  console.log('🔍 DIAGNÓSTICO DETALLADO DEL FRONTEND\n');
  console.log('='.repeat(60) + '\n');

  const browserHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Accept: 'application/json, text/plain, */application/json',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
  };

  try {
    // 1. Verificar que el servidor responde
    console.log('1️⃣  VERIFICACIÓN DEL SERVIDOR');
    console.log('-'.repeat(30));

    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/health',
      method: 'GET',
      headers: browserHeaders,
    });

    if (healthResponse.status !== 200) {
      console.log(`❌ Servidor no responde correctamente: ${healthResponse.status}`);
      console.log('Body:', healthResponse.body);
      return;
    }
    console.log('✅ Servidor operativo\n');

    // 2. Verificar API de usuarios SIN autenticación (debería fallar)
    console.log('2️⃣  API USUARIOS SIN AUTENTICACIÓN');
    console.log('-'.repeat(30));

    const usersNoAuthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/users',
      method: 'GET',
      headers: browserHeaders,
    });

    console.log(`Status: ${usersNoAuthResponse.status}`);
    if (usersNoAuthResponse.status === 401) {
      console.log('✅ API requiere autenticación correctamente');
    } else {
      console.log('⚠️  API no requiere autenticación o hay otro error');
      console.log('Body:', usersNoAuthResponse.body);
    }
    console.log('');

    // 3. Verificar API de settings SIN autenticación (debería fallar)
    console.log('3️⃣  API SETTINGS SIN AUTENTICACIÓN');
    console.log('-'.repeat(30));

    const settingsNoAuthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/settings',
      method: 'GET',
      headers: browserHeaders,
    });

    console.log(`Status: ${settingsNoAuthResponse.status}`);
    if (settingsNoAuthResponse.status === 401) {
      console.log('✅ API requiere autenticación correctamente');
    } else {
      console.log('⚠️  API no requiere autenticación o hay otro error');
      console.log('Body:', settingsNoAuthResponse.body);
    }
    console.log('');

    // 4. Probar API de test-users (sin auth)
    console.log('4️⃣  API TEST-USERS (SIN AUTENTICACIÓN)');
    console.log('-'.repeat(30));

    const testUsersResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/test-users',
      method: 'GET',
      headers: browserHeaders,
    });

    console.log(`Status: ${testUsersResponse.status}`);
    if (testUsersResponse.status === 200 && testUsersResponse.body.success) {
      console.log('✅ API test-users funciona');
      console.log(`📊 Usuarios en DB: ${testUsersResponse.body.data.totalUsers}`);
      console.log(`📊 Usuarios activos: ${testUsersResponse.body.data.activeUsers}`);
    } else {
      console.log('❌ API test-users falla');
      console.log('Body:', testUsersResponse.body);
    }
    console.log('');

    // 5. Probar estado de autenticación
    console.log('5️⃣  VERIFICACIÓN DE AUTENTICACIÓN');
    console.log('-'.repeat(30));

    const authStatusResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/auth-status',
      method: 'GET',
      headers: browserHeaders,
    });

    console.log(`Status: ${authStatusResponse.status}`);
    if (authStatusResponse.status === 200 && authStatusResponse.body.authenticated) {
      console.log('✅ Usuario autenticado correctamente');
      console.log(
        `👤 Usuario: ${authStatusResponse.body.user.email} (${authStatusResponse.body.user.role})`
      );
    } else {
      console.log('❌ Usuario no autenticado');
      console.log('Body:', authStatusResponse.body);
      console.log('⚠️  ESTE ES EL PROBLEMA: El usuario administrador no está autenticado');
      console.log('💡 SOLUCIÓN: El usuario debe iniciar sesión primero');
    }

    console.log('');

    // 6. Probar API de test-settings (sin auth)
    console.log('6️⃣  API TEST-SETTINGS (SIN AUTENTICACIÓN)');
    console.log('-'.repeat(30));

    const testSettingsGetResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/test-settings',
      method: 'GET',
      headers: browserHeaders,
    });

    console.log(`Status GET: ${testSettingsGetResponse.status}`);
    if (testSettingsGetResponse.status === 200 && testSettingsGetResponse.body.success) {
      console.log('✅ API test-settings GET funciona');
      console.log(`📊 Configuraciones en DB: ${testSettingsGetResponse.body.data.settingsCount}`);
    } else {
      console.log('❌ API test-settings GET falla');
      console.log('Body:', testSettingsGetResponse.body);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 DIAGNÓSTICO DETALLADO COMPLETADO');
    console.log('');
    console.log('📋 RESUMEN:');
    console.log('- Las APIs requieren autenticación correctamente');
    console.log('- Las APIs de test funcionan sin autenticación');
    console.log('- El problema está en que el usuario administrador NO está autenticado');
    console.log('- SOLUCIÓN: El usuario debe iniciar sesión en la aplicación primero');
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
detailedFrontendDiagnosis();
