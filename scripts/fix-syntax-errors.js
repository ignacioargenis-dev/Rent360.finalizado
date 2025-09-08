const fs = require('fs');
const path = require('path');

function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix setError calls without quotes
    const setErrorRegex = /setError\(([^'"]\w[^)]*)\)/g;
    content = content.replace(setErrorRegex, (match, message) => {
      modified = true;
      return `setError('${message}')`;
    });

    // Fix malformed imports with extra commas
    const importRegex = /import\s*{[^}]*,\s*,([^}]*)}\s*from\s*['"][^'"]+['"]/g;
    content = content.replace(importRegex, (match, rest) => {
      modified = true;
      return match.replace(/,\s*,/, ',');
    });

    // Fix specific malformed logger calls
    const loggerErrorRegex = /logger\.error\([^,]+,\s*{\s*error:\s*(\d+)\s*instanceof\s*Error\s*\?\s*\1\.message\s*:\s*String\(\1\)\s*}\)/g;
    content = content.replace(loggerErrorRegex, (match, number) => {
      modified = true;
      return `logger.error('Error', { error: 'Error occurred' })`;
    });

    // Fix malformed object literals in NotificationSystem
    if (filePath.includes('NotificationSystem.tsx')) {
      const malformedObjectRegex = /notifications:\s*\[\],\s*{\s*error:\s*unreadCount:\s*0,/g;
      content = content.replace(malformedObjectRegex, 'notifications: [], unreadCount: 0,');
      
      const malformedAddNotificationRegex = /addNotification:\s*\(\s*instanceof\s*Error\s*\?\s*unreadCount:\s*0,/g;
      content = content.replace(malformedAddNotificationRegex, 'addNotification: () => {},');
      
      const malformedMessageRegex = /addNotification:\s*\(\.message\s*:\s*String\(unreadCount:\s*0,/g;
      content = content.replace(malformedMessageRegex, 'addNotification: () => {},');
    }

    // Fix malformed auth.ts
    if (filePath.includes('auth.ts')) {
      const malformedAuthRegex = /{\s*id:\s*userId,\s*{\s*error:\s*email,\s*role,\s*name\s*},/g;
      content = content.replace(malformedAuthRegex, '{ id: userId, email, role, name },');
      
      const malformedInstanceRegex = /instanceof\s*Error\s*\?\s*email,\s*role,\s*name\s*},/g;
      content = content.replace(malformedInstanceRegex, '');
      
      const malformedMessageRegex = /\.message\s*:\s*String\(email,\s*role,\s*name\s*},/g;
      content = content.replace(malformedMessageRegex, '');
      
      const malformedEndRegex = /\)\s*}\);$/gm;
      content = content.replace(malformedEndRegex, '');
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
      if (fixSyntaxErrors(fullPath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

// Start processing from src directory
const srcPath = path.join(__dirname, '..', 'src');
console.log('🔧 Fixing syntax errors...');
const totalFixed = processDirectory(srcPath);
console.log(`✅ Fixed ${totalFixed} files`);
