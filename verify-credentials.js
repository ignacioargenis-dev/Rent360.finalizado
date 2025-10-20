#!/usr/bin/env node

console.log('🔍 Verificación de credenciales de DigitalOcean Spaces\n');

console.log('📋 Después de regenerar el key, necesito que me proporciones:\n');

console.log('1. 🔑 **Access Key ID** (nuevo):');
console.log('   - Debe ser una cadena que comience con "DO"');
console.log('   - Ejemplo: "DO00ABC123DEF456GHI789"');
console.log('   - NO es el nombre del token ("key-1760981663136")\n');

console.log('2. 🔐 **Secret Key** (nuevo):');
console.log('   - Debe ser una cadena larga');
console.log('   - Ejemplo: "xyz789abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"');
console.log('   - Ya me diste: "h+UJCd6KoqCrw6ZzvTy0xBM7ueKO0DzdWS7Dy8muMGc"\n');

console.log('💡 **Para obtener el Access Key ID correcto:**');
console.log('   1. Ve a DigitalOcean > Spaces > Access Keys');
console.log('   2. En la tabla, busca la columna "Access Key ID"');
console.log('   3. Copia el valor completo (no el nombre del token)\n');

console.log('🔗 **Una vez que tengas ambos valores:**');
console.log('   - Ejecuta: node quick-setup.js');
console.log('   - O proporciona ambos valores y yo los configuro\n');

console.log('📸 **En la tabla deberías ver algo como:**');
console.log('   Access Key Name: key-1760981663136');
console.log('   Access Key ID: DO801H6NY6HTM8RMM4Y2  ← Este es el que necesito');
console.log('   Secret Key: h+UJCd6KoqCrw6ZzvTy0xBM7ueKO0DzdWS7Dy8muMGc  ← Este ya lo tienes');
