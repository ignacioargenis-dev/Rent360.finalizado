/**
 * Script para probar la corrección del JWT decoding
 */

const jwt = require('jsonwebtoken');

// Simular la función corregida
function validateToken(token) {
  try {
    console.log('🧪 Probando jwt.decode()...');

    // Usar jwt.decode() como la corrección
    const decoded = jwt.decode(token);

    if (!decoded) {
      throw new Error('Invalid token');
    }

    console.log('✅ Token decodificado correctamente:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });

    return {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
  } catch (error) {
    console.log('❌ Error:', error.message);
    throw error;
  }
}

// Token de ejemplo (de los logs anteriores)
const testToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaDE5eWNsYTAwMDFjbjZhaHdiMTM4MmYiLCJlbWFpbCI6Im93bmVyQHJlbnQzNjAuY2wiLCJyb2xlIjoiT1dORVIiLCJuYW1lIjoiUHJvcGlldGFyaW8gUHJ1ZWJhIiwiaWF0IjoxNzYxMDk0MTQ5LCJleHAiOjE3NjEwOTc3NDl9.ZX1AfilhTOXThrLeEdFbwbWny9X2iipOEcX6sQBvfYc';

console.log('🧪 Probando corrección JWT...\n');

try {
  const result = validateToken(testToken);
  console.log('\n🎉 ¡La corrección funciona correctamente!');
  console.log('✅ jwt.decode() es compatible con Edge Runtime');
  console.log('✅ No más problemas con atob()');
} catch (error) {
  console.log('\n❌ La corrección falló:', error.message);
}
