const fs = require('fs');
const path = require('path');

// Función para analizar si un archivo tiene llamadas incorrectas a logger.error
function analyzeLoggerErrors(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { file: filePath, status: 'not_found', errors: [] };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const errors = [];

    // Buscar patrones incorrectos
    const incorrectPatterns = [
      /logger\.error\(['"`]([^'"`]+)['"`]\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g, // logger.error('msg', error)
      /logger\.error\(['"`]([^'"`]+)['"`]\s*,\s*([^)]+)\)/g // logger.error('msg', cualquier cosa que no sea objeto)
    ];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      incorrectPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const [fullMatch, message, secondParam] = match;

          // Si ya está en formato correcto (contiene { error: o {error:), ignorar
          if (fullMatch.includes('{ error:') || fullMatch.includes('{error:')) {
            return;
          }

          // Si el segundo parámetro es un objeto literal, probablemente está bien
          if (secondParam.trim().startsWith('{')) {
            return;
          }

          // Si es una variable que parece ser un error (error, err, e, etc.), marcar como error
          if (['error', 'err', 'e', 'ex', 'exception'].includes(secondParam.trim()) ||
              secondParam.trim().match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
            errors.push({
              line: lineNumber,
              match: fullMatch.trim(),
              message: message,
              errorVar: secondParam.trim()
            });
          }
        }
      });
    });

    return {
      file: filePath,
      status: errors.length > 0 ? 'needs_fix' : 'ok',
      errors: errors
    };

  } catch (error) {
    return {
      file: filePath,
      status: 'error',
      errors: [],
      error: error.message
    };
  }
}

// Función para corregir un archivo
function fixLoggerErrors(filePath, errors) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    errors.forEach(error => {
      const oldPattern = new RegExp(error.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const newCall = `logger.error('${error.message}', { error: ${error.errorVar} instanceof Error ? ${error.errorVar}.message : String(${error.errorVar}) })`;

      if (oldPattern.test(content)) {
        content = content.replace(oldPattern, newCall);
        modified = true;
        console.log(`  ✅ Corregido: ${error.match} → ${newCall}`);
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error corrigiendo ${filePath}:`, error.message);
    return false;
  }
}

// Archivos a analizar (basado en el grep anterior)
const filesToAnalyze = [
  'src/lib/bank-account-service.ts',
  'src/lib/backup-manager.ts',
  'src/lib/audit.ts',
  'src/lib/ai-chatbot-service.ts',
  'src/components/pwa/PWAInstallPrompt.tsx',
  'src/components/legal/LegalCasesManagement.tsx',
  'src/components/layout/UnifiedSidebar.tsx',
  'src/app/broker/commissions/page.tsx',
  'src/app/broker/properties/page.tsx',
  'src/components/documents/DocumentUpload.tsx',
  'src/app/admin/reports/users/page.tsx',
  'src/app/admin/reports/properties/page.tsx',
  'src/app/runner/visits/new/page.tsx',
  'src/components/analytics/PredictiveAnalytics.tsx',
  'src/app/properties/search/page.tsx',
  'src/components/dashboard/EnhancedDashboardLayout.tsx',
  'src/components/documents/DigitalSignature.tsx',
  'src/app/documents/page.tsx',
  'src/lib/bank-integrations/banco-estado-integration.ts',
  'src/lib/bank-integrations/stripe-integration.ts',
  'src/lib/bank-integrations/paypal-integration.ts',
  'src/lib/bank-integrations/base-bank-integration.ts',
  'src/lib/bank-integrations/webpay-integration.ts',
  // Agregando algunos más de los archivos críticos
  'src/lib/validation/runtime-validators.ts',
  'src/lib/signature/providers/digitalsign.ts'
];

console.log('🔍 Analizando archivos con posibles problemas de logger.error...\n');

const results = [];
let filesNeedingFix = 0;
let totalErrors = 0;

for (const file of filesToAnalyze) {
  const result = analyzeLoggerErrors(file);

  if (result.status === 'needs_fix') {
    filesNeedingFix++;
    totalErrors += result.errors.length;
    console.log(`❌ ${file} - ${result.errors.length} errores`);
    result.errors.forEach(err => {
      console.log(`   Línea ${err.line}: ${err.match}`);
    });
  } else if (result.status === 'ok') {
    console.log(`✅ ${file} - OK`);
  } else {
    console.log(`⚠️  ${file} - ${result.status}`);
  }

  results.push(result);
}

console.log(`\n📊 Resumen del análisis:`);
console.log(`   Archivos analizados: ${filesToAnalyze.length}`);
console.log(`   Archivos que necesitan corrección: ${filesNeedingFix}`);
console.log(`   Total de errores encontrados: ${totalErrors}`);

if (filesNeedingFix > 0) {
  console.log('\n🔧 Aplicando correcciones...\n');

  let filesFixed = 0;
  for (const result of results) {
    if (result.status === 'needs_fix') {
      if (fixLoggerErrors(result.file, result.errors)) {
        filesFixed++;
      }
    }
  }

  console.log(`\n✅ Correcciones aplicadas a ${filesFixed} archivos.`);
} else {
  console.log('\n✅ No se encontraron errores que necesiten corrección.');
}
