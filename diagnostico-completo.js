const http = require('http');

// Función para hacer requests HTTP
function makeRequest(options, data = null) {
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

async function runCompleteDiagnostics() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA RENT360\n');
  console.log('='.repeat(60) + '\n');

  // Headers para simular requests del navegador
  const browserHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
  };

  try {
    // 0. Test ultra simple sin imports
    console.log('🔌 Test 0: Endpoint ultra simple (sin imports)');
    console.log('-'.repeat(40));

    const pingResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/ping',
      method: 'GET',
      headers: browserHeaders,
    });

    console.log('Status:', pingResponse.status);
    if (pingResponse.status === 200) {
      console.log('✅ Endpoint ping funciona - servidor operativo\n');

      // Test 0.5: Probar endpoint de debug simple
      console.log('🔧 Test 0.5: Endpoint debug simple');
      console.log('-'.repeat(40));

      const debugSimpleResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/debug-simple',
        method: 'GET',
        headers: browserHeaders,
      });

      console.log('Status:', debugSimpleResponse.status);
      if (debugSimpleResponse.status === 200) {
        console.log('✅ Endpoint debug-simple funciona\n');
      } else {
        console.log('❌ Endpoint debug-simple falla');
        console.log('Body:', debugSimpleResponse.body);
        console.log('🔍 Problema específico en endpoints complejos\n');
        return;
      }
    } else {
      console.log('❌ Endpoint ping falla - problema fundamental');
      console.log('Body:', pingResponse.body);
      console.log('🔍 El problema está en middleware o configuración\n');
      return;
    }

    // 1. Verificar conexión básica con el servidor
    console.log('1️⃣  VERIFICANDO CONEXIÓN AL SERVIDOR');
    console.log('-'.repeat(40));

    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      headers: browserHeaders,
    });

    console.log(`Estado del servidor: ${healthResponse.status}`);
    if (healthResponse.status === 200) {
      console.log('✅ Servidor responde correctamente\n');
    } else {
      console.log('❌ Servidor no responde correctamente\n');
      return;
    }

    // 2. Verificar base de datos con endpoint de test
    console.log('2️⃣  VERIFICANDO BASE DE DATOS');
    console.log('-'.repeat(40));

    const dbTestResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/test-users',
      method: 'GET',
      headers: browserHeaders,
    });

    console.log(`Endpoint test-users: ${dbTestResponse.status}`);
    if (dbTestResponse.status === 200 && dbTestResponse.body.success) {
      console.log(`✅ Base de datos operativa: ${dbTestResponse.body.data.totalUsers} usuarios`);
      console.log(`📊 Usuarios activos: ${dbTestResponse.body.data.activeUsers}`);

      // Mostrar algunos usuarios de ejemplo
      const sampleUsers = dbTestResponse.body.data.allUsers.slice(0, 3);
      sampleUsers.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ${user.email} (${user.role}) - ${user.isActive ? 'Activo' : 'Inactivo'}`
        );
      });
      console.log('');
    } else {
      console.log('❌ Error en base de datos');
      console.log('Respuesta:', dbTestResponse.body);
      console.log('');
    }

    // 3. Probar autenticación
    console.log('3️⃣  PROBANDO AUTENTICACIÓN');
    console.log('-'.repeat(40));

    const authTestResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/test-auth',
      method: 'GET',
      headers: browserHeaders,
    });

    console.log(`Endpoint test-auth: ${authTestResponse.status}`);
    if (authTestResponse.status === 401) {
      console.log('✅ Autenticación funciona: Rechaza requests sin token correctamente');
      console.log('Mensaje:', authTestResponse.body.error);
      console.log('');
    } else {
      console.log('❌ Problema con autenticación');
      console.log('Respuesta:', authTestResponse.body);
      console.log('');
    }

    // 4. Probar API de usuarios (debería requerir auth)
    console.log('4️⃣  PROBANDO API DE USUARIOS');
    console.log('-'.repeat(40));

    const usersApiResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'GET',
      headers: browserHeaders,
    });

    console.log(`API /api/users: ${usersApiResponse.status}`);
    if (usersApiResponse.status === 401) {
      console.log('✅ API de usuarios requiere autenticación correctamente');
    } else if (usersApiResponse.status === 200) {
      console.log('✅ API de usuarios funciona con autenticación');
      if (usersApiResponse.body.users) {
        console.log(`📊 Usuarios devueltos: ${usersApiResponse.body.users.length}`);
      } else {
        console.log('⚠️  Respuesta sin campo "users"');
        console.log('Respuesta:', usersApiResponse.body);
      }
    } else {
      console.log('❌ Error en API de usuarios');
      console.log('Respuesta:', usersApiResponse.body);
    }
    console.log('');

    // 5. Probar API de settings
    console.log('5️⃣  PROBANDO API DE SETTINGS');
    console.log('-'.repeat(40));

    // GET settings
    const settingsGetResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/settings',
      method: 'GET',
      headers: browserHeaders,
    });

    console.log(`API /api/settings (GET): ${settingsGetResponse.status}`);
    if (settingsGetResponse.status === 401) {
      console.log('✅ API de settings requiere autenticación correctamente');
    } else if (settingsGetResponse.status === 200) {
      console.log('✅ API de settings GET funciona');
      if (settingsGetResponse.body.settings) {
        const categories = Object.keys(settingsGetResponse.body.settings);
        console.log(`📊 Categorías de settings: ${categories.length} (${categories.join(', ')})`);
      } else {
        console.log('⚠️  Respuesta sin campo "settings"');
      }
    } else {
      console.log('❌ Error en API de settings GET');
      console.log('Respuesta:', settingsGetResponse.body);
    }
    console.log('');

    // POST settings (debería fallar sin auth)
    const testSettings = {
      general: {
        siteName: { value: 'Test Site', isActive: true, description: 'Test' },
      },
    };

    const settingsPostResponse = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/settings',
        method: 'POST',
        headers: browserHeaders,
      },
      { settings: testSettings }
    );

    console.log(`API /api/settings (POST): ${settingsPostResponse.status}`);
    if (settingsPostResponse.status === 401) {
      console.log('✅ API de settings POST requiere autenticación correctamente');
    } else {
      console.log('❌ API de settings POST no requiere autenticación');
      console.log('Respuesta:', settingsPostResponse.body);
    }

    // 6. Probar endpoint de test-settings
    console.log('6️⃣  PROBANDO ENDPOINT DE TEST-SETTINGS');
    console.log('-'.repeat(40));

    const testSettingsPostResponse = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/test-settings',
        method: 'POST',
        headers: browserHeaders,
      },
      { settings: testSettings }
    );

    console.log(`Endpoint test-settings (POST): ${testSettingsPostResponse.status}`);
    if (testSettingsPostResponse.status === 200 && testSettingsPostResponse.body.success) {
      console.log('✅ Endpoint test-settings funciona correctamente');
      console.log(
        `📊 Configuraciones procesadas: ${testSettingsPostResponse.body.data.processedCount}`
      );
    } else {
      console.log('❌ Error en endpoint test-settings');
      console.log('Respuesta:', testSettingsPostResponse.body);
    }
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔍 DIAGNÓSTICO COMPLETADO');
}

// Ejecutar diagnóstico
runCompleteDiagnostics();
