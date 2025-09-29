// Script de debug para verificar archivos CSS
const fs = require('fs');
const path = require('path');

console.log('🔍 Debug: Verificando archivos CSS...');

const nextStaticDir = path.join(__dirname, '.next', 'static');
const cssDir = path.join(nextStaticDir, 'css');

console.log('📁 Verificando directorios...');

// Verificar si existe .next/static
if (fs.existsSync(nextStaticDir)) {
  console.log('✅ .next/static existe');

  // Verificar si existe .next/static/css
  if (fs.existsSync(cssDir)) {
    console.log('✅ .next/static/css existe');

    // Listar archivos CSS
    const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
    console.log('📄 Archivos CSS encontrados:', cssFiles.length);
    cssFiles.forEach(file => {
      const filePath = path.join(cssDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
    });
  } else {
    console.log('❌ .next/static/css NO existe');
  }
} else {
  console.log('❌ .next/static NO existe');
}

console.log('');
console.log('🔧 Para corregir problemas de CSS:');
console.log('1. Borrar .next/ manualmente');
console.log('2. npm run build');
console.log('3. Verificar que se generen los archivos CSS');
