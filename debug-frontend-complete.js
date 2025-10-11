// Diagnóstico completo del frontend - Simulación exacta del comportamiento del navegador
const http = require('http');

function makeRequest(options, data = null, includeCookies = false, cookies = []) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      let responseCookies = [];

      // Capturar cookies de la respuesta
      if (res.headers['set-cookie']) {
        responseCookies = res.headers['set-cookie'];
      }

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
            cookies: responseCookies,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            cookies: responseCookies,
          });
        }
      });
    });

    req.on('error', err => {
      reject(err);
    });

    // Incluir cookies en la petición si se especifican
    if (includeCookies && cookies.length > 0) {
      req.setHeader('Cookie', cookies.join('; '));
    }

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function completeFrontendDiagnosis() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL FRONTEND - SIMULACIÓN REAL\n');
  console.log('='.repeat(70) + '\n');

  const browserHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Accept: 'application/json, text/plain, */application/json',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    Referer: 'http://localhost:3003/admin/users',
  };

  let cookies = [];

  try {
    // PASO 1: Verificar que el servidor responde
    console.log('🚀 PASO 1: Verificación básica del servidor');
    console.log('-'.repeat(50));

    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/api/health',
      method: 'GET',
      headers: browserHeaders,
    });

    if (healthResponse.status !== 200) {
      console.log(`❌ Servidor no responde: ${healthResponse.status}`);
      console.log('Body:', healthResponse.body);
      return;
    }
    console.log('✅ Servidor operativo');

    // Capturar cookies iniciales si las hay
    if (healthResponse.cookies && healthResponse.cookies.length > 0) {
      cookies = cookies.concat(healthResponse.cookies);
      console.log('🍪 Cookies iniciales capturadas:', cookies.length);
    }
    console.log('');

    // PASO 2: Intentar login (simular)
    console.log('🔐 PASO 2: Simulación de autenticación');
    console.log('-'.repeat(50));

    // Primero verificar si ya hay una sesión activa
    const authCheckResponse = await makeRequest(
      {
        hostname: 'localhost',
        port: 3003,
        path: '/api/auth/me',
        method: 'GET',
        headers: browserHeaders,
      },
      null,
      true,
      cookies
    );

    console.log(`Verificación de sesión: ${authCheckResponse.status}`);

    if (authCheckResponse.status === 200) {
      console.log('✅ Usuario ya autenticado');
      if (authCheckResponse.cookies && authCheckResponse.cookies.length > 0) {
        cookies = cookies.concat(authCheckResponse.cookies);
      }
    } else {
      console.log('❌ Usuario no autenticado o sesión expirada');
      console.log('Para probar completamente necesitas iniciar sesión primero');
      console.log('Body:', authCheckResponse.body);
    }
    console.log('');

    // PASO 3: Probar API de usuarios con autenticación
    console.log('👥 PASO 3: Prueba API de usuarios con autenticación');
    console.log('-'.repeat(50));

    const usersResponse = await makeRequest(
      {
        hostname: 'localhost',
        port: 3003,
        path: '/api/users',
        method: 'GET',
        headers: browserHeaders,
      },
      null,
      true,
      cookies
    );

    console.log(`API /api/users: ${usersResponse.status}`);

    if (usersResponse.status === 200) {
      console.log('✅ API de usuarios responde correctamente');
      if (usersResponse.body && usersResponse.body.users) {
        console.log(`📊 Usuarios encontrados: ${usersResponse.body.users.length}`);
        if (usersResponse.body.users.length > 0) {
          console.log('Primeros usuarios:');
          usersResponse.body.users.slice(0, 2).forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} (${user.role})`);
          });
        } else {
          console.log('⚠️  Lista de usuarios vacía');
        }
      } else {
        console.log('❌ Respuesta sin campo "users"');
        console.log('Estructura:', Object.keys(usersResponse.body || {}));
      }
    } else if (usersResponse.status === 401) {
      console.log('❌ API requiere autenticación (401 Unauthorized)');
      console.log('Body:', usersResponse.body);
      console.log('💡 SOLUCIÓN: El usuario debe iniciar sesión en la aplicación');
    } else {
      console.log('❌ Error en API de usuarios');
      console.log('Body:', usersResponse.body);
    }
    console.log('');

    // PASO 4: Probar API de configuraciones
    console.log('⚙️  PASO 4: Prueba API de configuraciones');
    console.log('-'.repeat(50));

    // GET settings
    const settingsGetResponse = await makeRequest(
      {
        hostname: 'localhost',
        port: 3003,
        path: '/api/settings',
        method: 'GET',
        headers: browserHeaders,
      },
      null,
      true,
      cookies
    );

    console.log(`API /api/settings (GET): ${settingsGetResponse.status}`);

    if (settingsGetResponse.status === 200) {
      console.log('✅ API settings GET funciona');
      if (settingsGetResponse.body && settingsGetResponse.body.settings) {
        const categories = Object.keys(settingsGetResponse.body.settings);
        console.log(`📊 Categorías de configuración: ${categories.length}`);
        console.log('Categorías:', categories.join(', '));
      } else {
        console.log('❌ Respuesta sin campo "settings"');
      }
    } else if (settingsGetResponse.status === 401) {
      console.log('❌ API requiere autenticación (401 Unauthorized)');
      console.log('Body:', settingsGetResponse.body);
      console.log('💡 SOLUCIÓN: El usuario debe iniciar sesión en la aplicación');
    } else {
      console.log('❌ Error en API settings GET');
      console.log('Body:', settingsGetResponse.body);
    }

    // POST settings (simular guardado)
    if (settingsGetResponse.status === 200) {
      console.log('\n💾 Probando guardado de configuración...');

      const testSettings = {
        general: {
          siteName: {
            value: 'Test desde diagnóstico completo',
            isActive: true,
            description: 'Prueba de guardado',
          },
        },
      };

      const settingsPostResponse = await makeRequest(
        {
          hostname: 'localhost',
          port: 3003,
          path: '/api/settings',
          method: 'POST',
          headers: browserHeaders,
        },
        { settings: testSettings },
        true,
        cookies
      );

      console.log(`API /api/settings (POST): ${settingsPostResponse.status}`);

      if (settingsPostResponse.status === 200) {
        console.log('✅ Configuración guardada correctamente');

        // Verificar que se guardó
        const verifyResponse = await makeRequest(
          {
            hostname: 'localhost',
            port: 3003,
            path: '/api/settings',
            method: 'GET',
            headers: browserHeaders,
          },
          null,
          true,
          cookies
        );

        if (verifyResponse.status === 200) {
          const settings = verifyResponse.body.settings;
          const siteName = settings?.general?.siteName?.value;
          if (siteName === 'Test desde diagnóstico completo') {
            console.log('✅ Verificación: Configuración persistió correctamente');
          } else {
            console.log('⚠️  Configuración no se actualizó correctamente');
            console.log('Valor actual:', siteName);
          }
        }
      } else {
        console.log('❌ Error al guardar configuración');
        console.log('Body:', settingsPostResponse.body);
      }
    }
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔍 DIAGNÓSTICO COMPLETADO');
  console.log('');
  console.log('📋 ANÁLISIS:');
  console.log('- Si ves 401 en las APIs, el problema es que el usuario no está autenticado');
  console.log('- Si ves 200 pero datos vacíos, hay un problema en la lógica del backend');
  console.log('- Si el guardado falla, hay un problema en la persistencia de datos');
  console.log('');
  console.log(
    '🎯 SOLUCIÓN: Asegúrate de que el usuario esté LOGUEADO en la aplicación antes de probar'
  );
}
