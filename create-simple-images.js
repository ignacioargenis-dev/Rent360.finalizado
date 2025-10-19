const fs = require('fs');
const path = require('path');

// Crear imágenes simples usando base64
async function createSimpleImages() {
  console.log('🎨 Creando imágenes simples...');

  const properties = [
    { name: 'property1', color: '#3B82F6' },
    { name: 'property2', color: '#10B981' },
    { name: 'property3', color: '#F59E0B' },
    { name: 'property4', color: '#EF4444' },
    { name: 'property5', color: '#8B5CF6' },
  ];

  for (const prop of properties) {
    // Crear un PNG simple de 1x1 píxel usando base64
    // Este es un PNG válido de 1x1 píxel rojo
    const base64PNG =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    // Convertir base64 a buffer
    const imageBuffer = Buffer.from(base64PNG, 'base64');

    // Guardar como archivo PNG
    const pngPath = path.join('public', 'uploads', 'properties', `${prop.name}.png`);
    fs.writeFileSync(pngPath, imageBuffer);

    console.log(`✅ Creado: ${prop.name}.png (${imageBuffer.length} bytes)`);
  }

  console.log('🎉 Imágenes PNG simples creadas exitosamente');
}

createSimpleImages();
