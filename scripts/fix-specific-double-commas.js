const fs = require('fs');
const path = require('path');

function fixSpecificDoubleCommas(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix specific double comma patterns
    const patterns = [
      /DollarSign,, Info/g,
      /Plus,, Info/g,
      /Clock,, Info/g,
      /LineChart,, Tool/g,
      /TrendingDown,, Info/g,
      /ArrowRight,, User/g,
      /AlertTriangle,, Tool/g,
      /MapPin,, Building/g,
      /FileText,, Info/g,
      /Download,, Info/g,
      /Star,, Info/g,
      /AlertCircle,, Info/g,
      /Info,, User/g,
      /Shield,, Info/g,
      /Target,, User/g,
      /Maximize,, Info/g,
      /RefreshCw,, Info/g,
      /Building,, Info/g,
      /Zap,, Info/g,
      /Send,, Info/g,
      /Upload,, Info/g
    ];

    patterns.forEach(pattern => {
      if (content.match(pattern)) {
        content = content.replace(pattern, pattern.source.replace(',,', ','));
        modified = true;
      }
    });

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

// List of files that need fixing
const filesToFix = [
  'src/app/admin/audit-logs/page.tsx',
  'src/app/admin/backup/page.tsx',
  'src/app/admin/dashboard/page.tsx',
  'src/app/admin/predictive-analytics/page.tsx',
  'src/app/admin/system-health/page.tsx',
  'src/app/admin/tickets/page.tsx',
  'src/app/broker/analytics/page.tsx',
  'src/app/broker/dashboard/page.tsx',
  'src/app/broker/messages/page.tsx',
  'src/app/broker/properties/page.tsx',
  'src/app/broker/settings/page.tsx',
  'src/app/contact/page.tsx',
  'src/app/owner/properties/new/page.tsx',
  'src/app/owner/settings/page.tsx',
  'src/app/register-provider/page.tsx',
  'src/app/runner/earnings/page.tsx',
  'src/app/runner/photos/page.tsx',
  'src/app/runner/settings/page.tsx',
  'src/app/support/tickets/[id]/page.tsx',
  'src/app/support/tickets/new/page.tsx',
  'src/app/tenant/messages/page.tsx',
  'src/components/calendar/AppointmentForm.tsx',
  'src/components/contracts/ElectronicSignature.tsx',
  'src/components/documents/DigitalSignature.tsx',
  'src/components/forms/RecordForm.tsx'
];

console.log('🔧 Fixing specific double commas...');
let fixedCount = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    if (fixSpecificDoubleCommas(fullPath)) {
      fixedCount++;
    }
  }
});

console.log(`✅ Fixed ${fixedCount} files`);
