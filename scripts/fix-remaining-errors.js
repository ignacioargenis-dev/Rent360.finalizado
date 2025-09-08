const fs = require('fs');
const path = require('path');

// Function to fix duplicate imports
function fixDuplicateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix duplicate Building imports
    if (content.includes('Building,') && content.includes('RefreshCw, Building')) {
      content = content.replace(/RefreshCw, Building/g, 'RefreshCw');
      modified = true;
    }

    // Fix duplicate Eye imports
    if (content.includes('Eye,') && content.includes('Eye , Eye')) {
      content = content.replace(/Eye , Eye/g, 'Eye');
      modified = true;
    }

    // Fix setError type issues
    if (content.includes('useState(null)') && content.includes('setError(')) {
      content = content.replace(/useState\(null\)/g, 'useState<string | null>(null)');
      modified = true;
    }

    // Fix QuickActionCard count prop
    if (content.includes('count={') && content.includes('QuickActionCard')) {
      content = content.replace(/count=\{.*?\},?\s*/g, '');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
  return false;
}

// Files to fix
const filesToFix = [
  'src/app/admin/maintenance/page.tsx',
  'src/app/admin/integrations/page.tsx',
  'src/app/admin/dashboard/page.tsx',
  'src/app/admin/notifications-enhanced/page.tsx',
  'src/app/admin/notifications/page.tsx',
  'src/app/admin/payments/page.tsx',
  'src/app/admin/properties/page.tsx'
];

let fixedCount = 0;

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    if (fixDuplicateImports(file)) {
      fixedCount++;
    }
  }
});

console.log(`\nFixed ${fixedCount} files.`);
