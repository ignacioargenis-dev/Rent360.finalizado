// Diagnóstico de autenticación detallado
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(`\n--- RESPONSE ${options.path} ---`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        try {
          const jsonBody = JSON.parse(body);
          console.log(`Body:`, JSON.stringify(jsonBody, null, 2));
          resolve({
            status: res.statusCode,
            body: jsonBody,
            headers: res.headers,
          });
        } catch (e) {
          console.log(`Body (raw):`, body);
          resolve({
            status: res.statusCode,
            body: body,
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

async function testAuth() {
  console.log('🔐 DIAGNÓSTICO DE AUTENTICACIÓN');

  const baseOptions = {
    hostname: 'localhost',
    port: 3003,
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
  };

  try {
    // 1. Test sin cookies
    console.log('\n1. Probando sin cookies...');
    const noCookiesResponse = await makeRequest({
      ...baseOptions,
      path: '/api/users',
    });

    // 2. Test con cookie inválida
    console.log('\n2. Probando con cookie inválida...');
    const invalidCookieOptions = {
      ...baseOptions,
      path: '/api/users',
      headers: {
        ...baseOptions.headers,
        Cookie: 'auth-token=invalid-token',
      },
    };
    const invalidCookieResponse = await makeRequest(invalidCookieOptions);

    // 3. Test con cookie de sesión vacía
    console.log('\n3. Probando con cookie de sesión vacía...');
    const emptySessionOptions = {
      ...baseOptions,
      path: '/api/users',
      headers: {
        ...baseOptions.headers,
        Cookie: 'next-auth.session-token=',
      },
    };
    const emptySessionResponse = await makeRequest(emptySessionOptions);

    // 4. Verificar endpoint de auth-status
    console.log('\n4. Verificando /api/auth-status...');
    const authStatusResponse = await makeRequest({
      ...baseOptions,
      path: '/api/auth-status',
    });

    console.log('\n📋 ANÁLISIS:');
    console.log(`Sin cookies: ${noCookiesResponse.status}`);
    console.log(`Cookie inválida: ${invalidCookieResponse.status}`);
    console.log(`Sesión vacía: ${emptySessionResponse.status}`);
    console.log(`Auth status: ${authStatusResponse.status}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth();
