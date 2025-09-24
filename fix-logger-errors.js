const fs = require('fs');
const path = require('path');

function fixLoggerErrors(dirPath) {
  const files = fs.readdirSync(dirPath, { recursive: true });

  files.forEach(file => {
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const filePath = path.join(dirPath, file);
      let content = fs.readFileSync(filePath, 'utf8');

      // Buscar y reemplazar el patrón logger.error('mensaje:', error)
      const regex = /logger\.error\('([^']+)', error\)/g;
      const newContent = content.replace(regex, "logger.error('$1', { error })");

      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Fixed: ${filePath}`);
      }
    }
  });
}

fixLoggerErrors('./src');
