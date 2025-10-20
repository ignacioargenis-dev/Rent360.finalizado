#!/usr/bin/env node

console.log('🚀 Configuración de variables de entorno para producción\n');

console.log('📋 **PASO 1: Ve a tu panel de DigitalOcean**');
console.log('   🌐 https://cloud.digitalocean.com/\n');

console.log('📋 **PASO 2: Navega a tu aplicación**');
console.log('   - Busca "rent360-finalizado" en la lista de apps');
console.log('   - Haz clic en el nombre de la app\n');

console.log('📋 **PASO 3: Ve a Settings > Environment Variables**');
console.log('   - En el menú lateral, busca "Settings"');
console.log('   - Haz clic en "Environment Variables"\n');

console.log('📋 **PASO 4: Agrega las siguientes variables**');
console.log('   Haz clic en "Add Variable" para cada una:\n');

console.log('   🔑 **Variable 1:**');
console.log('   Name: DO_SPACES_ACCESS_KEY');
console.log('   Value: DO801ALJNKLDGU2TXXF4\n');

console.log('   🔐 **Variable 2:**');
console.log('   Name: DO_SPACES_SECRET_KEY');
console.log('   Value: h+UJCd6KoqCrw6ZzvTy0xBM7ueKO0DzdWS7Dy8muMGc\n');

console.log('   🪣 **Variable 3:**');
console.log('   Name: DO_SPACES_BUCKET');
console.log('   Value: rent360-images\n');

console.log('   🌍 **Variable 4:**');
console.log('   Name: DO_SPACES_REGION');
console.log('   Value: nyc3\n');

console.log('📋 **PASO 5: Guardar y reiniciar**');
console.log('   - Haz clic en "Save"');
console.log('   - Ve a la pestaña "Runtime"');
console.log('   - Haz clic en "Restart App"\n');

console.log('📋 **PASO 6: Verificar funcionamiento**');
console.log('   - Espera a que la app se reinicie (2-3 minutos)');
console.log('   - Prueba subir una imagen');
console.log('   - Debería funcionar sin errores 500\n');

console.log('💡 **Una vez configurado, podrás:**');
console.log('   ✅ Subir imágenes sin errores');
console.log('   ✅ Las imágenes se guardarán en DigitalOcean Spaces');
console.log('   ✅ URLs públicas accesibles globalmente');
console.log('   ✅ Escalabilidad ilimitada\n');

console.log('🔗 **Enlaces útiles:**');
console.log('   - Panel DigitalOcean: https://cloud.digitalocean.com/');
console.log('   - Tu app: https://rent360management-2yxgz.ondigitalocean.app/');
console.log('   - Spaces: https://cloud.digitalocean.com/spaces\n');

console.log('⚠️  **IMPORTANTE:**');
console.log('   - Las variables son sensibles, no las compartas');
console.log('   - Una vez configuradas, las imágenes se subirán automáticamente a cloud storage');
console.log(
  '   - El sistema detectará automáticamente si usar cloud storage o almacenamiento local'
);
