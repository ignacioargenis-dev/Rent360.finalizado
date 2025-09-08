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
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fixRemainingErrors(filePath);
    }
  });
}

// Función para corregir errores restantes
function fixRemainingErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 1. Remover eslint-disable directives no utilizadas
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Saltar líneas que son eslint-disable no utilizadas
      if (line.trim().startsWith('// eslint-disable-next-line @typescript-eslint/no-unused-vars') && 
          !lines[i + 1]?.includes('@typescript-eslint/no-unused-vars')) {
        continue;
      }
      
      // 2. Corregir imports faltantes de lucide-react
      if (line.includes('Bell') && !line.includes('import') && !content.includes('import { Bell }')) {
        // Agregar import si no existe
        if (!content.includes('import { Bell }')) {
          const importIndex = content.indexOf('import {');
          if (importIndex !== -1) {
            const importEnd = content.indexOf('}', importIndex);
            if (importEnd !== -1) {
              const importLine = content.substring(importIndex, importEnd + 1);
              if (!importLine.includes('Bell')) {
                const newImport = importLine.replace('}', ', Bell }');
                content = content.replace(importLine, newImport);
                modified = true;
              }
            }
          }
        }
      }
      
      // 3. Corregir imports faltantes de otros iconos
      const missingIcons = ['Settings', 'User', 'LogOut', 'LogIn', 'X', 'Menu', 'Building'];
      missingIcons.forEach(icon => {
        if (line.includes(icon) && !line.includes('import') && !content.includes(`import { ${icon} }`)) {
          if (!content.includes(`import { ${icon} }`)) {
            const importIndex = content.indexOf('import {');
            if (importIndex !== -1) {
              const importEnd = content.indexOf('}', importIndex);
              if (importEnd !== -1) {
                const importLine = content.substring(importIndex, importEnd + 1);
                if (!importLine.includes(icon)) {
                  const newImport = importLine.replace('}', `, ${icon} }`);
                  content = content.replace(importLine, newImport);
                  modified = true;
                }
              }
            }
          }
        }
      });
      
      newLines.push(line);
    }
    
    // 4. Corregir imports específicos para componentes UI
    if (filePath.includes('/ui/')) {
      const uiIcons = {
        'accordion.tsx': ['ChevronDownIcon'],
        'breadcrumb.tsx': ['ChevronRight', 'MoreHorizontal'],
        'carousel.tsx': ['ArrowLeft', 'ArrowRight'],
        'checkbox.tsx': ['CheckIcon'],
        'command.tsx': ['SearchIcon'],
        'context-menu.tsx': ['ChevronRightIcon', 'CheckIcon', 'CircleIcon'],
        'dialog.tsx': ['XIcon'],
        'dropdown-menu.tsx': ['CheckIcon', 'CircleIcon', 'ChevronRightIcon'],
        'input-otp.tsx': ['MinusIcon'],
        'LoadingStates.tsx': ['Loader2', 'XCircle', 'CheckCircle', 'AlertCircle'],
        'menubar.tsx': ['CheckIcon', 'CircleIcon', 'ChevronRightIcon'],
        'navigation-menu.tsx': ['ChevronDownIcon'],
        'radio-group.tsx': ['CircleIcon'],
        'resizable.tsx': ['GripVerticalIcon'],
        'select.tsx': ['ChevronDownIcon', 'CheckIcon', 'ChevronUpIcon'],
        'sheet.tsx': ['XIcon'],
        'sidebar.tsx': ['PanelLeftIcon'],
        'toast.tsx': ['X']
      };
      
      const fileName = path.basename(filePath);
      const icons = uiIcons[fileName];
      
      if (icons) {
        icons.forEach(icon => {
          if (!content.includes(`import { ${icon} }`)) {
            const importIndex = content.indexOf('import {');
            if (importIndex !== -1) {
              const importEnd = content.indexOf('}', importIndex);
              if (importEnd !== -1) {
                const importLine = content.substring(importIndex, importEnd + 1);
                if (!importLine.includes(icon)) {
                  const newImport = importLine.replace('}', `, ${icon} }`);
                  content = content.replace(importLine, newImport);
                  modified = true;
                }
              }
            }
          }
        });
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corregido: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

// Procesar el directorio src
console.log('🔧 Iniciando corrección de errores restantes...');
processDirectory('./src');
console.log('✅ Corrección de errores restantes completada.');
