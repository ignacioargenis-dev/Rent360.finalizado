#!/usr/bin/env node

console.log('🔍 Verificación de configuración de DigitalOcean Spaces\n');

console.log('📋 Para verificar tu configuración, necesito que confirmes:\n');

console.log('1. 🌐 **Nombre del Space**:');
console.log('   - Ve a tu panel de DigitalOcean');
console.log('   - Navega a "Spaces" en el menú lateral');
console.log('   - Copia el nombre exacto del Space (ej: "rent360-images")\n');

console.log('2. 🌍 **Región del Space**:');
console.log('   - En la misma página, verifica la región');
console.log('   - Opciones comunes: nyc3, fra1, sfo3, sgp1\n');

console.log('3. 🔑 **Credenciales API**:');
console.log('   - Ve a "API" en el menú lateral');
console.log('   - Crea un nuevo token si es necesario');
console.log('   - Verifica que tenga permisos de "Spaces" (Read/Write)\n');

console.log('4. 🔧 **Configuración CORS** (importante para web):');
console.log('   - En tu Space, ve a "Settings"');
console.log('   - En "CORS", agrega esta configuración:');
console.log(`
   {
     "AllowedHeaders": ["*"],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
     "AllowedOrigins": ["*"],
     "ExposeHeaders": ["ETag"],
     "MaxAgeSeconds": 3000
   }
`);

console.log('5. 📁 **Estructura de carpetas**:');
console.log('   - El Space debe estar vacío o tener la estructura:');
console.log('   - /properties/[propertyId]/[imageName]');
console.log('   - /users/[userId]/[imageName]\n');

console.log('💡 **Una vez que tengas esta información, ejecuta:**');
console.log('   node test-cloud-connection.js\n');

console.log('🔗 **Enlaces útiles:**');
console.log('   - Panel DigitalOcean: https://cloud.digitalocean.com/');
console.log('   - Documentación Spaces: https://docs.digitalocean.com/products/spaces/');
