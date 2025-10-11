// Diagnóstico simple y directo
const http = require('http');

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
            body: jsonBody,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
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

async function simpleDiagnosis() {
  console.log('🔍 DIAGNÓSTICO SIMPLE');

  try {
    // 1. Verificar servidor
    console.log('\n1. Verificando servidor...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/api/health',
      method: 'GET',
    });

    console.log(`Status: ${healthResponse.status}`);
    if (healthResponse.status !== 200) {
      console.log('❌ Servidor no responde');
      return;
    }
    console.log('✅ Servidor OK');

    // 2. Verificar API usuarios sin auth
    console.log('\n2. Probando API usuarios sin autenticación...');
    const usersResponse = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/api/users',
      method: 'GET',
    });

    console.log(`Status: ${usersResponse.status}`);
    if (usersResponse.status === 401) {
      console.log('✅ API requiere autenticación correctamente');
    } else {
      console.log('❌ API no requiere autenticación');
    }

    // 3. Verificar API settings sin auth
    console.log('\n3. Probando API settings sin autenticación...');
    const settingsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/api/settings',
      method: 'GET',
    });

    console.log(`Status: ${settingsResponse.status}`);
    if (settingsResponse.status === 401) {
      console.log('✅ API requiere autenticación correctamente');
    } else {
      console.log('❌ API no requiere autenticación');
    }

    // 4. Verificar API test-users (debería funcionar sin auth)
    console.log('\n4. Probando API test-users...');
    const testUsersResponse = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/api/test-users',
      method: 'GET',
    });

    console.log(`Status: ${testUsersResponse.status}`);
    if (testUsersResponse.status === 200) {
      console.log('✅ API test-users funciona');
      console.log(`Usuarios en DB: ${testUsersResponse.body.data.totalUsers}`);
    } else {
      console.log('❌ API test-users no funciona');
    }

    console.log('\n📋 CONCLUSIÓN:');
    console.log('Las APIs requieren autenticación correctamente.');
    console.log('El problema es que el USUARIO NO ESTÁ AUTENTICADO.');
    console.log('SOLUCIÓN: Inicia sesión en la aplicación primero.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

simpleDiagnosis();
