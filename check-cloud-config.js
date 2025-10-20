#!/usr/bin/env node

console.log('🔍 Verificando configuración de cloud storage...\n');

// Verificar variables de entorno
const requiredVars = [
  'DO_SPACES_ACCESS_KEY',
  'DO_SPACES_SECRET_KEY',
  'DO_SPACES_BUCKET',
  'DO_SPACES_REGION',
];

console.log('📋 Variables de entorno requeridas:');
let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isConfigured = value && value.trim() !== '';
  console.log(
    `   ${varName}: ${isConfigured ? '✅' : '❌'} ${isConfigured ? value.substring(0, 10) + '...' : 'No configurada'}`
  );

  if (!isConfigured) {
    allConfigured = false;
  }
});

console.log('\n📊 Estado de configuración:');
if (allConfigured) {
  console.log('✅ Cloud storage configurado correctamente');
  console.log('💡 Usando: src/app/api/properties/[id]/images/route.ts (cloud storage)');
} else {
  console.log('❌ Cloud storage NO configurado');
  console.log(
    '💡 Usando: src/app/api/properties/[id]/images/route-fallback.ts (almacenamiento local)'
  );
}

console.log('\n🔧 Para configurar cloud storage en producción:');
console.log('1. Ve a tu panel de DigitalOcean App');
console.log('2. Navega a Settings > Environment Variables');
console.log('3. Agrega las siguientes variables:');
console.log('   DO_SPACES_ACCESS_KEY=DO801ALJNKLDGU2TXXF4');
console.log('   DO_SPACES_SECRET_KEY=h+UJCd6KoqCrw6ZzvTy0xBM7ueKO0DzdWS7Dy8muMGc');
console.log('   DO_SPACES_BUCKET=rent360-images');
console.log('   DO_SPACES_REGION=nyc3');
console.log('4. Reinicia la aplicación');

console.log('\n🌐 URLs de referencia:');
console.log('   - Panel DigitalOcean: https://cloud.digitalocean.com/');
console.log('   - Tu app: https://rent360management-2yxgz.ondigitalocean.app/');
