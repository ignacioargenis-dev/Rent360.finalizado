const fs = require('fs');
const path = require('path');

// Función para procesar archivos recursivamente
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      processFile(filePath);
    }
  });
}

// Función para procesar un archivo
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Reemplazar console.error con logger.error
    const consoleErrorRegex = /console\.error\(/g;
    if (consoleErrorRegex.test(content)) {
      // Verificar si ya tiene import de logger
      const hasLoggerImport = /import.*logger.*from.*['"]@\/lib\/logger['"]/.test(content);
      
      if (!hasLoggerImport) {
        // Agregar import de logger al inicio del archivo
        const importStatement = "import { logger } from '@/lib/logger';\n";
        content = importStatement + content;
      }
      
      // Reemplazar console.error con logger.error
      content = content.replace(/console\.error\(/g, 'logger.error(');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Procesado: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

// Procesar el directorio src
console.log('🔧 Iniciando corrección de console.error...');
processDirectory('./src');
console.log('✅ Corrección completada!');
