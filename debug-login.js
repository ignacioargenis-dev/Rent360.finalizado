// Script de debug para verificar problemas de login
console.log('🔍 Debug: Verificando configuración de login...');

// Verificar variables de entorno críticas
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NEXTAUTH_SECRET'
];

console.log('📋 Variables de entorno requeridas:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ Configurada' : '❌ No configurada';
  const displayValue = value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'No definida';
  console.log(`  ${varName}: ${status} (${displayValue})`);
});

// Verificar si la base de datos está accesible
console.log('\n🔌 Verificando conexión a base de datos...');

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL configurada');
  console.log('📍 URL:', process.env.DATABASE_URL.split('@')[1] || 'No se puede mostrar por seguridad');
} else {
  console.log('❌ DATABASE_URL no configurada');
}

console.log('\n🔐 Verificando configuración JWT...');

if (process.env.JWT_SECRET) {
  const length = process.env.JWT_SECRET.length;
  console.log(`✅ JWT_SECRET configurado (${length} caracteres)`);
  console.log(length >= 32 ? '✅ Longitud adecuada' : '⚠️ Longitud menor a 32 caracteres');
} else {
  console.log('❌ JWT_SECRET no configurado');
}

if (process.env.JWT_REFRESH_SECRET) {
  const length = process.env.JWT_REFRESH_SECRET.length;
  console.log(`✅ JWT_REFRESH_SECRET configurado (${length} caracteres)`);
  console.log(length >= 32 ? '✅ Longitud adecuada' : '⚠️ Longitud menor a 32 caracteres');
} else {
  console.log('❌ JWT_REFRESH_SECRET no configurado');
}

if (process.env.NEXTAUTH_SECRET) {
  const length = process.env.NEXTAUTH_SECRET.length;
  console.log(`✅ NEXTAUTH_SECRET configurado (${length} caracteres)`);
  console.log(length >= 32 ? '✅ Longitud adecuada' : '⚠️ Longitud menor a 32 caracteres');
} else {
  console.log('❌ NEXTAUTH_SECRET no configurado');
}

console.log('\n📊 Resumen:');
console.log('Para que el login funcione correctamente necesitas:');
console.log('1. ✅ DATABASE_URL configurada y apuntando a PostgreSQL');
console.log('2. ✅ JWT_SECRET con al menos 32 caracteres');
console.log('3. ✅ JWT_REFRESH_SECRET con al menos 32 caracteres');
console.log('4. ✅ NEXTAUTH_SECRET con al menos 32 caracteres');
console.log('5. ✅ Base de datos PostgreSQL accesible');
console.log('6. ✅ Usuario de prueba creado en la base de datos');

console.log('\n🔧 Si tienes problemas:');
console.log('1. Verifica las variables de entorno en DigitalOcean');
console.log('2. Asegúrate de que la base de datos esté funcionando');
console.log('3. Revisa los logs de la aplicación en DigitalOcean');
console.log('4. Verifica que el usuario de prueba existe en la BD');
