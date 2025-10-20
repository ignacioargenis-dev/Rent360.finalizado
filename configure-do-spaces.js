#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Configuración Rápida de DigitalOcean Spaces para Rent360\n');

// Valores de ejemplo - el usuario debe reemplazarlos
const config = {
  DO_SPACES_ACCESS_KEY: process.env.DO_SPACES_ACCESS_KEY || 'REEMPLAZA_CON_TU_ACCESS_KEY',
  DO_SPACES_SECRET_KEY: process.env.DO_SPACES_SECRET_KEY || 'REEMPLAZA_CON_TU_SECRET_KEY',
  DO_SPACES_BUCKET: 'rent360-images',
  DO_SPACES_REGION: 'nyc3',
  DO_SPACES_ENDPOINT: 'https://nyc3.digitaloceanspaces.com',
  CLOUD_STORAGE_PROVIDER: 'digitalocean_spaces',
};

console.log('📋 PASOS PARA CONFIGURAR DIGITALOCEAN SPACES:');
console.log('=============================================\n');

console.log('1. 🏗️  CREAR DIGITALOCEAN SPACE:');
console.log('   • Ve a: https://cloud.digitalocean.com/spaces');
console.log('   • Haz clic: "Create" → "Spaces"');
console.log('   • Nombre: rent360-images');
console.log('   • Región: NYC3 (o más cercana)');
console.log('   • File listing: Private');
console.log('   • CDN: Enabled (opcional - mejora velocidad)\n');

console.log('2. 🔑 GENERAR ACCESS KEYS:');
console.log('   • Ve a: https://cloud.digitalocean.com/account/api/spaces');
console.log('   • Haz clic: "Generate New Key"');
console.log('   • Nombre: "rent360-spaces-key"');
console.log('   • Copia Access Key y Secret Key\n');

console.log('3. ⚙️  CONFIGURAR CORS (IMPORTANTE):');
console.log('   • Ve al Space creado → Settings → CORS Policies');
console.log('   • Agrega esta política:');
console.log(
  JSON.stringify(
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
      AllowedOrigins: ['*'],
      ExposeHeaders: [],
      MaxAgeSeconds: 3000,
    },
    null,
    2
  )
);
console.log('');

console.log('4. 📝 CONFIGURAR VARIABLES DE ENTORNO:');
console.log('   Reemplaza estas líneas en tu archivo .env:');

// Mostrar configuración
console.log('\n# DigitalOcean Spaces Configuration');
Object.entries(config).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n5. 🧪 PROBAR CONEXIÓN:');
console.log('   node test-cloud-connection.js');

console.log('\n6. 🚀 MIGRAR IMÁGENES EXISTENTES:');
console.log('   node migrate-images-to-cloud.js');

console.log('\n7. 📦 ACTUALIZAR CÓDIGO DE PRODUCCIÓN:');
console.log('   • Reemplazar: src/app/api/properties/[id]/images/route.ts');
console.log('   • Con: src/app/api/properties/[id]/images/route-cloud.ts');

console.log('\n💰 COSTO ESTIMADO: ~$1.25/mes');
console.log('⚡ BENEFICIO: 99.9% disponibilidad + escalabilidad infinita');

console.log('\n📋 VERIFICACIÓN FINAL:');
console.log('   ✅ Space creado en DigitalOcean');
console.log('   ✅ Access Keys generadas');
console.log('   ✅ CORS configurado');
console.log('   ✅ Variables de entorno actualizadas');
console.log('   ✅ Conexión probada exitosamente');
console.log('   ✅ Imágenes migradas');
console.log('   ✅ Código actualizado en producción');

console.log('\n🎯 ¡CONFIGURACIÓN COMPLETA!');

// Crear archivo de configuración de ejemplo
const exampleConfig = `# Configuración de DigitalOcean Spaces
# Reemplaza con tus valores reales

${Object.entries(config)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')}

# Instrucciones:
# 1. Obtén tus credenciales de https://cloud.digitalocean.com/account/api/spaces
# 2. Reemplaza los valores arriba
# 3. Ejecuta: node test-cloud-connection.js
# 4. Migra imágenes: node migrate-images-to-cloud.js
`;

fs.writeFileSync('digitalocean-spaces-setup.txt', exampleConfig);
console.log('\n📄 Archivo de configuración creado: digitalocean-spaces-setup.txt');
