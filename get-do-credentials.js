#!/usr/bin/env node

console.log('🔑 Cómo obtener las credenciales correctas de DigitalOcean Spaces\n');

console.log('📋 **PASO 1: Ve a tu panel de DigitalOcean**');
console.log('   🌐 https://cloud.digitalocean.com/\n');

console.log('📋 **PASO 2: Navega a API > Tokens**');
console.log('   - En el menú lateral, busca "API"');
console.log('   - Haz clic en "Tokens" o "API Tokens"\n');

console.log('📋 **PASO 3: Encuentra tu token "key-1760981663136"**');
console.log('   - Busca el token que creaste');
console.log('   - Haz clic en "View" o "Show" para ver los detalles\n');

console.log('📋 **PASO 4: Copia las credenciales correctas**');
console.log('   - **Access Key**: Una cadena larga (ej: "DO00ABC123DEF456GHI789")');
console.log(
  '   - **Secret Key**: Una cadena larga (ej: "xyz789abc123def456ghi789jkl012mno345pqr678stu901vwx234yz")'
);
console.log('   - **NO** uses el nombre del token ("key-1760981663136")\n');

console.log('📋 **PASO 5: Verifica los permisos**');
console.log('   - El token debe tener permisos de "Spaces"');
console.log('   - Debe tener acceso a "Read/Write/Delete"');
console.log('   - Debe estar asociado al Space "rent360-images"\n');

console.log('💡 **Una vez que tengas las credenciales correctas:**');
console.log('   1. Ejecuta: node configure-do-spaces.js');
console.log('   2. O configura las variables de entorno manualmente');
console.log('   3. Luego ejecuta: node test-do-credentials.js\n');

console.log('🔗 **Enlaces útiles:**');
console.log('   - Panel DigitalOcean: https://cloud.digitalocean.com/');
console.log('   - API Tokens: https://cloud.digitalocean.com/account/api/tokens');
console.log('   - Spaces: https://cloud.digitalocean.com/spaces');
