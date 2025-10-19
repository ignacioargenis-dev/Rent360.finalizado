const fs = require('fs');
const path = require('path');

// Crear imágenes PNG válidas que funcionen en el navegador
async function createWorkingImages() {
  console.log('🎨 Creando imágenes PNG válidas...');

  const properties = [
    { name: 'property1', color: '#3B82F6', text: 'Casa 1' },
    { name: 'property2', color: '#10B981', text: 'Casa 2' },
    { name: 'property3', color: '#F59E0B', text: 'Casa 3' },
    { name: 'property4', color: '#EF4444', text: 'Casa 4' },
    { name: 'property5', color: '#8B5CF6', text: 'Casa 5' },
  ];

  for (const prop of properties) {
    // Crear un PNG válido de 400x300 píxeles
    // PNG header + IHDR + IDAT + IEND
    const width = 400;
    const height = 300;

    // PNG signature
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0); // width
    ihdrData.writeUInt32BE(height, 4); // height
    ihdrData[8] = 8; // bit depth
    ihdrData[9] = 2; // color type (RGB)
    ihdrData[10] = 0; // compression
    ihdrData[11] = 0; // filter
    ihdrData[12] = 0; // interlace

    const ihdrCrc = require('crypto').createHash('crc32').update('IHDR').update(ihdrData).digest();
    const ihdrChunk = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x0d]), // length
      Buffer.from('IHDR'),
      ihdrData,
      ihdrCrc,
    ]);

    // Crear datos de imagen simples (rectángulo de color sólido)
    const rowBytes = width * 3; // RGB
    const imageData = Buffer.alloc(height * (rowBytes + 1)); // +1 for filter byte

    // Llenar con color sólido
    const colorR = parseInt(prop.color.slice(1, 3), 16);
    const colorG = parseInt(prop.color.slice(3, 5), 16);
    const colorB = parseInt(prop.color.slice(5, 7), 16);

    for (let y = 0; y < height; y++) {
      const rowStart = y * (rowBytes + 1);
      imageData[rowStart] = 0; // filter type (none)

      for (let x = 0; x < width; x++) {
        const pixelStart = rowStart + 1 + x * 3;
        imageData[pixelStart] = colorR;
        imageData[pixelStart + 1] = colorG;
        imageData[pixelStart + 2] = colorB;
      }
    }

    // Comprimir con zlib (simplificado)
    const zlib = require('zlib');
    const compressedData = zlib.deflateSync(imageData);

    // IDAT chunk
    const idatCrc = require('crypto')
      .createHash('crc32')
      .update('IDAT')
      .update(compressedData)
      .digest();
    const idatLength = Buffer.alloc(4);
    idatLength.writeUInt32BE(compressedData.length, 0);
    const idatChunk = Buffer.concat([idatLength, Buffer.from('IDAT'), compressedData, idatCrc]);

    // IEND chunk
    const iendCrc = require('crypto').createHash('crc32').update('IEND').digest();
    const iendChunk = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x00]), // length
      Buffer.from('IEND'),
      iendCrc,
    ]);

    // Combinar todo
    const pngData = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);

    // Guardar como archivo PNG
    const pngPath = path.join('public', 'uploads', 'properties', `${prop.name}.png`);
    fs.writeFileSync(pngPath, pngData);

    console.log(`✅ Creado: ${prop.name}.png (${pngData.length} bytes)`);
  }

  console.log('🎉 Imágenes PNG válidas creadas exitosamente');
}

createWorkingImages();
