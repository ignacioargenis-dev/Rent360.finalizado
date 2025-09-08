const fs = require('fs');
const path = require('path');

function fixDoubleCommas(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix double commas in import statements
    const doubleCommaRegex = /,\s*,/g;
    content = content.replace(doubleCommaRegex, ',');
    
    if (content.includes(',,')) {
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
      if (fixDoubleCommas(fullPath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

// Start processing from src directory
const srcPath = path.join(__dirname, '..', 'src');
console.log('🔧 Fixing double commas...');
const totalFixed = processDirectory(srcPath);
console.log(`✅ Fixed ${totalFixed} files`);
