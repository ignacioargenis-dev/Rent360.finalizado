const fs = require('fs');
const path = require('path');

function fixLoggerErrorInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Patrón 1: logger.error('mensaje:', error) -> logger.error('mensaje', { error: ... })
    const pattern1 = /logger\.error\(['"`]([^'"`]+)['"`]\s*,\s*([^)]+)\)/g;
    content = content.replace(pattern1, (match, message, errorVar) => {
      if (match.includes('{ error:') || match.includes('{error:')) {
        return match; // Ya está corregido
      }
      modified = true;
      return `logger.error('${message}', { error: ${errorVar} instanceof Error ? ${errorVar}.message : String(${errorVar}) })`;
    });

    // Patrón 2: logger.error('mensaje', error) sin comillas en error
    const pattern2 = /logger\.error\(['"`]([^'"`]+)['"`]\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g;
    content = content.replace(pattern2, (match, message, errorVar) => {
      if (match.includes('{ error:') || match.includes('{error:')) {
        return match; // Ya está corregido
      }
      modified = true;
      return `logger.error('${message}', { error: ${errorVar} instanceof Error ? ${errorVar}.message : String(${errorVar}) })`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corregido: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Procesar archivos por lotes para evitar problemas de memoria
const filesBatch1 = [
  'src/lib/validation/runtime-validators.ts',
  'src/lib/signature/providers/digitalsign.ts',
  'src/lib/backup-manager.ts',
  'src/lib/audit.ts',
  'src/lib/ai-chatbot-service.ts'
];

const filesBatch2 = [
  'src/components/pwa/PWAInstallPrompt.tsx',
  'src/components/legal/LegalCasesManagement.tsx',
  'src/components/layout/UnifiedSidebar.tsx',
  'src/app/broker/properties/page.tsx',
  'src/app/broker/commissions/page.tsx'
];

const filesBatch3 = [
  'src/components/forms/RecordForm.tsx',
  'src/components/documents/DocumentUpload.tsx',
  'src/components/error/ErrorBoundary.tsx',
  'src/app/admin/reports/users/page.tsx',
  'src/app/admin/reports/properties/page.tsx'
];

console.log('🔧 Iniciando corrección de logger.error - Lote 1...\n');

let totalFixed = 0;
for (const file of filesBatch1) {
  if (fixLoggerErrorInFile(file)) totalFixed++;
}

console.log(`\n📊 Lote 1 completado. Archivos corregidos: ${totalFixed}\n`);

console.log('🔧 Procesando Lote 2...\n');

totalFixed = 0;
for (const file of filesBatch2) {
  if (fixLoggerErrorInFile(file)) totalFixed++;
}

console.log(`\n📊 Lote 2 completado. Archivos corregidos: ${totalFixed}\n`);

console.log('🔧 Procesando Lote 3...\n');

totalFixed = 0;
for (const file of filesBatch3) {
  if (fixLoggerErrorInFile(file)) totalFixed++;
}

console.log(`\n📊 Lote 3 completado. Archivos corregidos: ${totalFixed}\n`);

console.log('✅ Corrección por lotes completada. Ejecuta el siguiente lote cuando estés listo.');
