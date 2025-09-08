const fs = require('fs');
const path = require('path');

/**
 * Script para convertir enums de Prisma a strings para compatibilidad con SQLite
 */

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function convertEnumsToStrings() {
  console.log('🔄 Convirtiendo enums de Prisma a strings para SQLite...');

  try {
    // Leer el archivo del esquema
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Patrón para encontrar enums
    const enumPattern = /enum\s+(\w+)\s*\{([^}]+)\}/g;

    // Mapa para almacenar las conversiones
    const enumConversions = new Map();

    // Encontrar todos los enums y sus valores
    let match;
    while ((match = enumPattern.exec(schemaContent)) !== null) {
      const enumName = match[1];
      const enumValues = match[2]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'))
        .map(line => line.replace(/,$/, '').trim())
        .filter(line => line);

      console.log(`📝 Encontrado enum: ${enumName} con valores: ${enumValues.join(', ')}`);
      enumConversions.set(enumName, enumValues);
    }

    // Convertir enums a campos String con validación
    enumConversions.forEach((values, enumName) => {
      // Patrón para encontrar usos del enum en modelos
      const usagePattern = new RegExp(`\\b${enumName}\\b`, 'g');

      // Reemplazar el enum con String y agregar comentario con valores válidos
      schemaContent = schemaContent.replace(
        usagePattern,
        (match, offset, string) => {
          // Solo reemplazar si es un tipo de campo, no el enum en sí
          if (string.substring(offset - 10, offset).includes('  ') ||
              string.substring(offset - 10, offset).includes('\n')) {
            return `String // Enum: ${values.join(', ')}`;
          }
          return match;
        }
      );
    });

    // Eliminar todas las definiciones de enum
    schemaContent = schemaContent.replace(enumPattern, '');

    // Limpiar líneas vacías extras
    schemaContent = schemaContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Escribir el archivo modificado
    fs.writeFileSync(schemaPath, schemaContent, 'utf8');

    console.log('✅ Conversión completada exitosamente!');
    console.log('📋 Enums convertidos:', Array.from(enumConversions.keys()).join(', '));
    console.log('🔧 Recuerda actualizar tu código TypeScript para usar strings en lugar de enums.');

  } catch (error) {
    console.error('❌ Error durante la conversión:', error.message);
    process.exit(1);
  }
}

// Ejecutar la conversión
convertEnumsToStrings();
