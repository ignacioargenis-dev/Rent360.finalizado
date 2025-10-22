/**
 * Script para verificar qué usuarios existen en producción
 */

const fetch = require('node-fetch');

const BASE_URL = 'https://rent360management-2yxgz.ondigitalocean.app';

async function testProdUsers() {
  console.log('🔍 Verificando usuarios en producción...\n');

  const usersToTest = [
    { email: 'admin@rent360.cl', password: 'admin123', role: 'ADMIN' },
    { email: 'admin@rent360.cl', password: 'admin123456', role: 'ADMIN' },
    { email: 'support@rent360.cl', password: 'support123', role: 'SUPPORT' },
    { email: 'owner@rent360.cl', password: 'owner123', role: 'OWNER' },
    { email: 'tenant@rent360.cl', password: 'tenant123', role: 'TENANT' },
  ];

  for (const user of usersToTest) {
    try {
      console.log(`🔐 Probando login: ${user.email} / ${user.password} (${user.role})`);

      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ LOGIN EXITOSO: ${data.user?.email} - Rol: ${data.user?.role}`);

        // Probar /api/auth/me
        const cookies = response.headers.get('set-cookie');
        const tokenMatch = cookies?.match(/auth-token=([^;]+)/);
        if (tokenMatch) {
          const token = tokenMatch[1];
          const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
            headers: { Cookie: `auth-token=${token}` },
          });

          if (meResponse.ok) {
            const meData = await meResponse.json();
            console.log(
              `✅ /api/auth/me funciona: ${meData.user?.email} - Rol: ${meData.user?.role}`
            );
          } else {
            console.log(`❌ /api/auth/me falla: ${meResponse.status}`);
          }
        }
      } else {
        const errorData = await response.json();
        console.log(`❌ LOGIN FALLA: ${errorData.error || 'Error desconocido'}`);
      }

      console.log(''); // Línea en blanco
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log('');
    }
  }

  console.log('🎯 CONCLUSIÓN:');
  console.log('- Los usuarios que funcionan pueden acceder a user-reports');
  console.log('- Los que fallan necesitan ser creados en producción');
  console.log('- Posible solución: API temporal o consola de DO');
}

testProdUsers();
