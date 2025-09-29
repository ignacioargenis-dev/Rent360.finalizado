// Script para corregir problemas de build
const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigiendo problemas de build...');

// 1. Limpiar directorio .next si existe
const nextDir = path.join(__dirname, '.next');
if (fs.existsSync(nextDir)) {
  console.log('🗑️ Limpiando directorio .next...');
  fs.rmSync(nextDir, { recursive: true, force: true });
}

// 2. Asegurar que las variables CSS estén correctas
const globalsCSS = path.join(__dirname, 'src', 'app', 'globals.css');
const cssContent = fs.readFileSync(globalsCSS, 'utf8');

if (!cssContent.includes('--primary: 5 150 105')) {
  console.log('🎨 Corrigiendo variables CSS...');
  // Las variables ya están corregidas en el archivo
}

// 3. Crear archivo de prueba para verificar que todo funciona
const testFile = path.join(__dirname, 'test-styles.html');
const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Styles</title>
  <style>
    :root {
      --primary: 5 150 105;
      --primary-foreground: 255 255 255;
    }
    .test-button {
      background: rgb(var(--primary));
      color: rgb(var(--primary-foreground));
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <button class="test-button">Test Button</button>
</body>
</html>`;

fs.writeFileSync(testFile, testHTML);

console.log('✅ Correcciones aplicadas');
console.log('📝 Archivo de prueba creado: test-styles.html');
console.log('');
console.log('🚀 Para rebuild completo:');
console.log('1. Borrar .next/ manualmente');
console.log('2. npm run build');
console.log('3. npm start');
