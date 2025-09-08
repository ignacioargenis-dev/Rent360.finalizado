const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function fixDefaultValues() {
  console.log('🔧 Corrigiendo valores por defecto en enums convertidos...');

  try {
    let content = fs.readFileSync(schemaPath, 'utf8');

    // Lista de valores por defecto que necesitan comillas
    const defaultValuesToFix = [
      'PENDING', 'SENT', 'MEDIUM', 'OPEN', 'SCHEDULED', 'INFO',
      'PENDING_VERIFICATION', 'PRE_JUDICIAL', 'INITIATED'
    ];

    // Corregir valores por defecto sin comillas
    defaultValuesToFix.forEach(value => {
      const regex = new RegExp(`@default\\(${value}\\)`, 'g');
      content = content.replace(regex, `@default("${value}")`);
    });

    fs.writeFileSync(schemaPath, content, 'utf8');

    console.log('✅ Valores por defecto corregidos');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDefaultValues();
