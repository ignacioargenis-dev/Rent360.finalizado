const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando reemplazo masivo de useUserState por useAuth...');

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && file !== 'node_modules') {
      walkDir(filePath, callback);
    } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
      callback(filePath);
    }
  });
}

let updatedFiles = 0;

walkDir('./src', (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('useUserState')) {
    console.log(`📝 Procesando: ${filePath}`);

    let newContent = content;

    // Reemplazar import
    newContent = newContent.replace(
      /import\s*\{\s*useUserState\s*\}\s*from\s*['"`][^'"`]*useUserState['"`];?/g,
      "import { useAuth } from '@/components/auth/AuthProvider';"
    );

    // Reemplazar uso
    newContent = newContent.replace(
      /useUserState\(\)/g,
      'useAuth()'
    );

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      updatedFiles++;
      console.log(`✅ Actualizado: ${path.basename(filePath)}`);
    }
  }
});

console.log(`🎉 Proceso completado. Archivos actualizados: ${updatedFiles}`);
