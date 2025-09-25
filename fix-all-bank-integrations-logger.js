const fs = require('fs');
const path = require('path');

const integrationFiles = [
  'src/lib/bank-integrations/webpay-integration.ts',
  'src/lib/bank-integrations/paypal-integration.ts',
  'src/lib/bank-integrations/stripe-integration.ts',
  'src/lib/bank-integrations/base-bank-integration.ts',
  'src/lib/bank-integrations/bank-integration-factory.ts'
];

function fixLoggerCalls(filePath) {
  try {
    console.log(`Procesando: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`Archivo no encontrado: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Patrón para logger.error('mensaje:', error)
    const pattern1 = /logger\.error\(['"`]([^'"`]+)['"`]\s*,\s*([^)]+)\)/g;
    content = content.replace(pattern1, (match, message, errorVar) => {
      if (match.includes('{ error:') || match.includes('{error:')) {
        return match; // Ya está corregido
      }
      modified = true;
      return `logger.error('${message}', { error: ${errorVar} instanceof Error ? ${errorVar}.message : String(${errorVar}) })`;
    });

    // Patrón para logger.error('mensaje', error) sin comillas
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
    } else {
      console.log(`ℹ️  Sin cambios: ${filePath}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Corrigiendo llamadas al logger en integraciones bancarias...\n');

let totalFixed = 0;

for (const file of integrationFiles) {
  if (fixLoggerCalls(file)) {
    totalFixed++;
  }
}

console.log(`\n📊 Resumen:`);
console.log(`   Archivos procesados: ${integrationFiles.length}`);
console.log(`   Archivos corregidos: ${totalFixed}`);
console.log(`   Archivos sin cambios: ${integrationFiles.length - totalFixed}`);

console.log('\n✅ Corrección completada. Ahora haga commit y push de los cambios.');
