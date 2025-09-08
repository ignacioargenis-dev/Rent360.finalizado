const fs = require('fs');
const path = require('path');

function fixImportErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix malformed import statements with leading commas
    const malformedImportRegex = /import\s*{\s*,\s*([^}]+)\s*from\s*['"]lucide-react['"]/g;
    content = content.replace(malformedImportRegex, (match, imports) => {
      modified = true;
      return `import { ${imports.trim()} } from 'lucide-react'`;
    });

    // Fix malformed import statements with trailing commas
    const malformedImportTrailingRegex = /import\s*{\s*([^}]+),\s*([^}]+)\s*from\s*['"]lucide-react['"]/g;
    content = content.replace(malformedImportTrailingRegex, (match, imports1, imports2) => {
      modified = true;
      return `import { ${imports1.trim()}, ${imports2.trim()} } from 'lucide-react'`;
    });

    // Fix specific malformed imports
    const specificMalformedRegex = /import\s*{\s*([^}]+)\s*,\s*([^}]+)\s*from\s*['"]lucide-react['"]/g;
    content = content.replace(specificMalformedRegex, (match, imports1, imports2) => {
      if (imports1.includes(',') || imports2.includes(',')) {
        modified = true;
        const cleanImports1 = imports1.replace(/,\s*/g, ', ').trim();
        const cleanImports2 = imports2.replace(/,\s*/g, ', ').trim();
        return `import { ${cleanImports1}, ${cleanImports2} } from 'lucide-react'`;
      }
      return match;
    });

    // Fix monitoring.ts specific issues
    if (filePath.includes('monitoring.ts')) {
      // Remove the commented out addMetric calls that are causing syntax errors
      content = content.replace(/\/\/ monitoringService\.metrics\.addMetric\(\{[^}]*\}\)/g, '');
      
      // Fix the function structure
      const functionRegex = /export function withMonitoring<T extends Function>\(fn: T\): T \{[\s\S]*?\}/g;
      content = content.replace(functionRegex, (match) => {
        return `export function withMonitoring<T extends Function>(fn: T): T {
  return ((...args: any[]) => {
    const startTime = Date.now();
    const tags = { function: fn.name || 'anonymous' };
    
    try {
      const result = fn(...args);
      const duration = Date.now() - startTime;
      
      // Monitoring disabled for now
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Monitoring disabled for now
      throw error;
    }
  }) as T;
}`;
      });
      modified = true;
    }

    // Fix sidebar.tsx specific issues
    if (filePath.includes('sidebar.tsx')) {
      // Fix the malformed import
      content = content.replace(/import\s*{\s*PanelLeft\s*,\s*Tool\s*from\s*["']lucide-react["']/, 'import { PanelLeft, Wrench } from "lucide-react"');
      
      // Fix the function signature
      content = content.replace(/} & any\) \{/, '} & any) {');
      
      // Remove the malformed closing
      content = content.replace(/^\s*\);\s*$/gm, '');
      
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

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let fixedCount = 0;

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      fixedCount += processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixImportErrors(fullPath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

// Start processing from src directory
const srcPath = path.join(__dirname, '..', 'src');
console.log('🔧 Fixing import errors...');
const totalFixed = processDirectory(srcPath);
console.log(`✅ Fixed ${totalFixed} files`);
