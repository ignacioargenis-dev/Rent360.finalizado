const fs = require('fs');
const path = require('path');

// Función para corregir errores de logger en un archivo
function fixLoggerErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Corregir logger.error con error unknown
    const loggerErrorRegex = /logger\.error\(([^,]+),\s*([^)]+)\)/g;
    content = content.replace(loggerErrorRegex, (match, message, error) => {
      modified = true;
      return `logger.error(${message}, { error: ${error} instanceof Error ? ${error}.message : String(${error}) })`;
    });

    // Corregir setError con string
    const setErrorRegex = /setError\('([^']+)'\)/g;
    content = content.replace(setErrorRegex, (match, message) => {
      modified = true;
      return `setError(${message})`;
    });

    // Corregir importaciones faltantes
    if (content.includes('Settings') && !content.includes("import { Settings } from 'lucide-react'")) {
      const importRegex = /import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/;
      const importMatch = content.match(importRegex);
      if (importMatch) {
        const imports = importMatch[1].split(',').map(i => i.trim());
        if (!imports.includes('Settings')) {
          imports.push('Settings');
          content = content.replace(importRegex, `import { ${imports.join(', ')} } from 'lucide-react'`);
          modified = true;
        }
      }
    }

    // Corregir Tool por Wrench
    if (content.includes('Tool') && !content.includes('Wrench')) {
      content = content.replace(/import\s*{\s*([^}]*Tool[^}]*)\s*}\s*from\s*['"]lucide-react['"]/g, (match, imports) => {
        const newImports = imports.replace(/\bTool\b/g, 'Wrench');
        return `import { ${newImports} } from 'lucide-react'`;
      });
      content = content.replace(/\bTool\b/g, 'Wrench');
      modified = true;
    }

    // Corregir validateRut import
    if (content.includes('validateRut') && content.includes('@/lib/validation')) {
      content = content.replace(
        /import\s*{\s*([^}]*validateRut[^}]*)\s*}\s*from\s*['"]@\/lib\/validation['"]/g,
        (match, imports) => {
          const newImports = imports.replace(/\bvalidateRut\b/g, 'validateRut');
          return `import { ${newImports} } from '@/lib/validations'`;
        }
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Función para procesar directorio recursivamente
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let fixedCount = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      fixedCount += processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixLoggerErrors(filePath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

// Ejecutar el script
console.log('🔧 Starting logger error fixes...');
const startTime = Date.now();

const srcPath = path.join(__dirname, '..', 'src');
const fixedCount = processDirectory(srcPath);

const endTime = Date.now();
console.log(`\n✅ Completed! Fixed ${fixedCount} files in ${endTime - startTime}ms`);
