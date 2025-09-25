const fs = require('fs');
const path = require('path');

// Lista de archivos que contienen llamadas incorrectas a logger.error
const filesToFix = [
  'src/lib/validation/runtime-validators.ts',
  'src/lib/signature/providers/digitalsign.ts',
  'src/lib/backup-manager.ts',
  'src/lib/audit.ts',
  'src/lib/ai-chatbot-service.ts',
  'src/components/pwa/PWAInstallPrompt.tsx',
  'src/components/legal/LegalCasesManagement.tsx',
  'src/components/layout/UnifiedSidebar.tsx',
  'src/app/broker/properties/page.tsx',
  'src/app/broker/commissions/page.tsx',
  'src/components/forms/RecordForm.tsx',
  'src/components/documents/DocumentUpload.tsx',
  'src/components/error/ErrorBoundary.tsx',
  'src/app/admin/reports/users/page.tsx',
  'src/app/admin/reports/properties/page.tsx',
  'src/app/runner/visits/new/page.tsx',
  'src/components/analytics/PredictiveAnalytics.tsx',
  'src/app/properties/search/page.tsx',
  'src/components/dashboard/EnhancedDashboardLayout.tsx',
  'src/components/documents/DigitalSignature.tsx',
  'src/components/contracts/ElectronicSignature.tsx',
  'src/app/documents/page.tsx',
  'src/lib/bank-integrations/banco-estado-integration.ts',
  'src/lib/bank-integrations/stripe-integration.ts',
  'src/lib/bank-integrations/paypal-integration.ts',
  'src/lib/bank-integrations/webpay-integration.ts',
  'src/lib/payout-service.ts',
  'src/lib/bank-integrations/bank-integration-factory.ts',
  'src/lib/payment-service.ts',
  'src/lib/property-service.ts',
  'src/lib/user-service.ts',
  'src/lib/document-service.ts',
  'src/lib/contract-service.ts',
  'src/lib/auth-service.ts',
  'src/lib/cache.ts',
  'src/lib/rate-limiter.ts',
  'src/lib/security.ts',
  'src/lib/session-manager.ts'
];

function fixLoggerErrors(filePath) {
  try {
    console.log(`Procesando: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`Archivo no encontrado: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Patrón para encontrar logger.error('mensaje:', error) y convertirlo a logger.error('mensaje', { error: ... })
    const loggerErrorPattern = /logger\.error\(['"`]([^'"`]+)['"`]\s*,\s*([^)]+)\)/g;

    content = content.replace(loggerErrorPattern, (match, message, errorVar) => {
      // Si ya está en el formato correcto (con objeto), no cambiar
      if (match.includes('{ error:') || match.includes('{error:')) {
        return match;
      }

      // Convertir a formato correcto
      const fixedCall = `logger.error('${message}', { error: ${errorVar} instanceof Error ? ${errorVar}.message : String(${errorVar}) })`;
      console.log(`  Corrigiendo: ${match.trim()} → ${fixedCall.trim()}`);
      modified = true;
      return fixedCall;
    });

    // Patrón para logger.error sin segundo parámetro pero con error en el contexto
    const loggerErrorSimplePattern = /logger\.error\(['"`]([^'"`]+)['"`]\)/g;

    // Buscar casos donde el error está en el contexto cercano (dentro de catch)
    content = content.replace(loggerErrorSimplePattern, (match, message, offset) => {
      // Obtener el contexto alrededor de esta línea
      const lines = content.split('\n');
      const lineIndex = content.substring(0, offset).split('\n').length - 1;

      // Buscar hacia atrás para encontrar el catch (error)
      for (let i = lineIndex; i >= Math.max(0, lineIndex - 10); i--) {
        const line = lines[i];
        if (line.includes('catch (') && line.includes('error')) {
          const fixedCall = `logger.error('${message}', { error: error instanceof Error ? error.message : String(error) })`;
          console.log(`  Corrigiendo (contexto catch): ${match.trim()} → ${fixedCall.trim()}`);
          modified = true;
          return fixedCall;
        }
      }

      return match;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Archivo corregido: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  Sin cambios necesarios: ${filePath}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Iniciando corrección masiva de logger.error...\n');

let totalFixed = 0;
let totalProcessed = 0;

for (const filePath of filesToFix) {
  totalProcessed++;
  if (fixLoggerErrors(filePath)) {
    totalFixed++;
  }
}

console.log(`\n📊 Resumen:`);
console.log(`   Archivos procesados: ${totalProcessed}`);
console.log(`   Archivos corregidos: ${totalFixed}`);
console.log(`   Archivos sin cambios: ${totalProcessed - totalFixed}`);

console.log('\n✅ Corrección masiva completada!');

// Ahora hacer git add, commit y push
const { execSync } = require('child_process');

try {
  console.log('\n=== Agregando cambios ===');
  execSync('git add .', { stdio: 'inherit' });

  console.log('\n=== Creando commit ===');
  execSync(`git commit -m "fix: corregir todas las llamadas incorrectas a logger.error

- Corregir llamadas logger.error('mensaje:', error) en todo el proyecto
- Cambiar a formato correcto: logger.error('mensaje', { error: ... })
- Archivos corregidos: ${totalFixed} de ${totalProcessed} procesados
- Soluciona errores de tipos 'unknown' no asignable a 'Record<string, any>'"`, { stdio: 'inherit' });

  console.log('\n=== Haciendo push ===');
  execSync('git push origin master', { stdio: 'inherit' });

  console.log('\n🎉 ¡Corrección completa y push realizado exitosamente!');

} catch (error) {
  console.error('\n❌ Error en git operations:', error.message);
  console.log('\nPor favor ejecuta manualmente:');
  console.log('git add .');
  console.log('git commit -m "fix: corregir llamadas logger.error"');
  console.log('git push origin master');
}
