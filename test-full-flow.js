// Test completo del flujo de autenticación y APIs
const http = require('http');

function makeRequest(options, data = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const headers = { ...options.headers };
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const reqOptions = { ...options, headers };
    const req = http.request(reqOptions, res => {
      let body = '';
      let cookies = [];

      // Capturar cookies de la respuesta
      const setCookieHeader = res.headers['set-cookie'];
      if (setCookieHeader) {
        if (Array.isArray(setCookieHeader)) {
          cookies = setCookieHeader;
        } else {
          cookies = [setCookieHeader];
        }
      }

      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            body: jsonBody,
            cookies: cookies,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body,
            cookies: cookies,
            headers: res.headers,
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

async function testFullFlow() {
  console.log('🔄 TEST COMPLETO DEL FLUJO DE AUTENTICACIÓN');

  const baseOptions = {
    hostname: 'localhost',
    port: 3003,
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      Referer: 'http://localhost:3003/auth/login',
    },
  };

  try {
    // 1. Login
    console.log('\n1. 🔑 LOGIN...');
    const loginData = {
      email: 'admin@rent360.cl',
      password: '12345678',
    };

    const loginResponse = await makeRequest(
      {
        ...baseOptions,
        path: '/api/auth/login',
        headers: {
          ...baseOptions.headers,
          'Content-Length': Buffer.byteLength(JSON.stringify(loginData)),
        },
      },
      loginData
    );

    console.log(`Status: ${loginResponse.status}`);
    if (loginResponse.status !== 200) {
      console.log('❌ Login falló');
      console.log('Respuesta:', JSON.stringify(loginResponse.body, null, 2));
      return;
    }

    // Extraer cookie de auth-token
    const authTokenCookie = loginResponse.cookies.find(cookie => cookie.startsWith('auth-token='));

    if (!authTokenCookie) {
      console.log('❌ No se encontró cookie auth-token');
      console.log('Cookies:', loginResponse.cookies);
      return;
    }

    console.log('✅ Login exitoso, cookie obtenida');

    // 2. Verificar /api/auth/me
    console.log('\n2. 👤 VERIFICANDO /api/auth/me...');
    const authMeResponse = await makeRequest(
      {
        hostname: 'localhost',
        port: 3003,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          Referer: 'http://localhost:3003/admin/users',
        },
      },
      null,
      authTokenCookie
    );

    console.log(`Status: ${authMeResponse.status}`);
    if (authMeResponse.status === 200) {
      console.log('✅ /api/auth/me funciona correctamente');
      console.log(
        'Usuario:',
        authMeResponse.body.user.email,
        'Rol:',
        authMeResponse.body.user.role
      );
    } else {
      console.log('❌ /api/auth/me falló');
      console.log('Respuesta:', JSON.stringify(authMeResponse.body, null, 2));
      return;
    }

    // 3. Probar /api/users
    console.log('\n3. 👥 PROBANDO /api/users...');
    const usersResponse = await makeRequest(
      {
        hostname: 'localhost',
        port: 3003,
        path: '/api/users',
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          Referer: 'http://localhost:3003/admin/users',
        },
      },
      null,
      authTokenCookie
    );

    console.log(`Status: ${usersResponse.status}`);
    if (usersResponse.status === 200) {
      console.log('✅ /api/users funciona correctamente');
      console.log(`Usuarios obtenidos: ${usersResponse.body.users?.length || 0}`);
    } else {
      console.log('❌ /api/users falló');
      console.log('Respuesta:', JSON.stringify(usersResponse.body, null, 2));
    }

    // 4. Probar /api/settings
    console.log('\n4. ⚙️  PROBANDO /api/settings...');
    const settingsResponse = await makeRequest(
      {
        hostname: 'localhost',
        port: 3003,
        path: '/api/settings',
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          Referer: 'http://localhost:3003/admin/settings/enhanced',
        },
      },
      null,
      authTokenCookie
    );

    console.log(`Status: ${settingsResponse.status}`);
    if (settingsResponse.status === 200) {
      console.log('✅ /api/settings funciona correctamente');
    } else {
      console.log('❌ /api/settings falló');
      console.log('Respuesta:', JSON.stringify(settingsResponse.body, null, 2));
    }

    console.log('\n🎉 TEST COMPLETADO');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFullFlow();
