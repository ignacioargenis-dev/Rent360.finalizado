const fs = require('fs');
const path = require('path');

// Function to read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.log(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// Function to write file content
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.log(`Error writing file ${filePath}:`, error.message);
    return false;
  }
}

// Function to fix import syntax issues
function fixImportSyntax(content, filePath) {
  let modified = false;
  let newContent = content;

  // Fix leading commas in import statements
  newContent = newContent.replace(/,\s*([A-Z][a-zA-Z]*)\s*from\s*['"]lucide-react['"];?\s*\n/g, (match, iconName) => {
    modified = true;
    return `, ${iconName} } from 'lucide-react';\n`;
  });

  // Fix trailing commas before closing brace
  newContent = newContent.replace(/,\s*([A-Z][a-zA-Z]*)\s*}\s*from\s*['"]lucide-react['"];?\s*\n/g, (match, iconName) => {
    modified = true;
    return `, ${iconName} } from 'lucide-react';\n`;
  });

  // Fix duplicate imports in the same line
  newContent = newContent.replace(/([A-Z][a-zA-Z]*),\s*\1\s*from\s*['"]lucide-react['"]/g, (match, iconName) => {
    modified = true;
    return `${iconName} from 'lucide-react'`;
  });

  // Fix malformed import statements with extra commas
  newContent = newContent.replace(/,\s*,\s*([A-Z][a-zA-Z]*)/g, (match, iconName) => {
    modified = true;
    return `, ${iconName}`;
  });

  // Fix import statements that start with comma
  newContent = newContent.replace(/import\s*{\s*,/g, 'import {');

  // Fix specific patterns like ", Building from 'lucide-react';"
  newContent = newContent.replace(/,\s*([A-Z][a-zA-Z]*)\s*from\s*['"]lucide-react['"];?\s*\n/g, (match, iconName) => {
    modified = true;
    return `, ${iconName} } from 'lucide-react';\n`;
  });

  // Fix lines that are just ", IconName from 'lucide-react';"
  newContent = newContent.replace(/^\s*,\s*([A-Z][a-zA-Z]*)\s*from\s*['"]lucide-react['"];?\s*$/gm, (match, iconName) => {
    modified = true;
    return `  ${iconName},`;
  });

  // Fix specific problematic patterns
  const problematicPatterns = [
    /,\s*Building\s*from\s*['"]lucide-react['"];?\s*\n/g,
    /,\s*Eye\s*from\s*['"]lucide-react['"];?\s*\n/g,
    /,\s*Info\s*from\s*['"]lucide-react['"];?\s*\n/g,
    /,\s*UserPlus\s*from\s*['"]lucide-react['"];?\s*\n/g,
    /,\s*Tool\s*from\s*['"]lucide-react['"];?\s*\n/g,
  ];

  problematicPatterns.forEach(pattern => {
    newContent = newContent.replace(pattern, (match) => {
      modified = true;
      const iconName = match.match(/,\s*([A-Z][a-zA-Z]*)/)[1];
      return `, ${iconName} } from 'lucide-react';\n`;
    });
  });

  // Fix specific cases where we have ", IconName from 'lucide-react';" on its own line
  newContent = newContent.replace(/^\s*,\s*([A-Z][a-zA-Z]*)\s*from\s*['"]lucide-react['"];?\s*$/gm, (match, iconName) => {
    modified = true;
    return `  ${iconName},`;
  });

  // Fix cases where we have trailing comma before closing brace
  newContent = newContent.replace(/,\s*}\s*from\s*['"]lucide-react['"]/g, ' } from \'lucide-react\'');

  // Fix specific problematic import statements
  newContent = newContent.replace(/import\s*{\s*([^}]*),\s*,\s*([^}]*)\s*}\s*from\s*['"]lucide-react['"]/g, (match, before, after) => {
    modified = true;
    return `import { ${before}, ${after} } from 'lucide-react'`;
  });

  return { content: newContent, modified };
}

// Main function to process files
function processFiles() {
  const srcDir = path.join(__dirname, '..', 'src');
  let totalFixed = 0;

  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = readFile(filePath);
        if (content) {
          const { content: newContent, modified } = fixImportSyntax(content, filePath);
          if (modified) {
            if (writeFile(filePath, newContent)) {
              console.log(`Fixed import syntax: ${filePath}`);
              totalFixed++;
            }
          }
        }
      }
    });
  }

  processDirectory(srcDir);
  console.log(`\nTotal files with import syntax fixed: ${totalFixed}`);
}

// Run the script
processFiles();
