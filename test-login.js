// Probar el sistema de login
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
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

async function testLogin() {
  console.log('🔑 PROBANDO SISTEMA DE LOGIN');

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
      Referer: 'http://localhost:3003/login',
    },
  };

  try {
    // 1. Intentar login con credenciales de admin
    console.log('\n1. Intentando login con usuario admin...');
    const loginData = {
      email: 'admin@rent360.cl',
      password: '12345678', // Contraseña correcta según CREDENCIALES_USUARIOS.md
    };

    console.log(`Credenciales: ${loginData.email} / ${loginData.password}`);

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
    console.log(`Cookies recibidas: ${loginResponse.cookies?.length || 0}`);

    if (loginResponse.cookies && loginResponse.cookies.length > 0) {
      console.log('✅ Cookies de autenticación recibidas');

      // Extraer cookie de auth-token
      const authTokenCookie = loginResponse.cookies.find(cookie =>
        cookie.startsWith('auth-token=')
      );

      if (authTokenCookie) {
        console.log('✅ Cookie auth-token encontrada');
        const token = authTokenCookie.split(';')[0].split('=')[1];
        console.log(`Token: ${token.substring(0, 50)}...`);

        // 2. Probar acceso a API con el token
        console.log('\n2. Probando acceso a /api/users con token...');
        const usersResponse = await makeRequest({
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
            Cookie: `auth-token=${token}`,
          },
        });

        console.log(`Status: ${usersResponse.status}`);
        if (usersResponse.status === 200) {
          console.log('✅ ¡LOGIN FUNCIONA! Usuario autenticado correctamente');
          console.log(`Usuarios obtenidos: ${usersResponse.body.users?.length || 0}`);
        } else {
          console.log('❌ Login falló - no puede acceder a API protegida');
          console.log(`Respuesta: ${JSON.stringify(usersResponse.body)}`);
        }
      } else {
        console.log('❌ No se encontró cookie auth-token');
        console.log('Cookies:', loginResponse.cookies);
      }
    } else {
      console.log('❌ No se recibieron cookies de autenticación');
      console.log('Respuesta del login:', JSON.stringify(loginResponse.body, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
