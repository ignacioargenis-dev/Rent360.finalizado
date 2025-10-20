const fs = require('fs');
const path = require('path');

// Simular una subida de imagen como lo haría el API
async function testImageUpload() {
  const propertyId = 'cmgso8wv00003p5qwva17zrmn';
  const testImagePath = path.join(__dirname, 'public', 'uploads', 'properties', 'property1.png');

  console.log('Test image exists:', fs.existsSync(testImagePath));

  if (!fs.existsSync(testImagePath)) {
    console.log('Test image not found, skipping');
    return;
  }

  // Leer la imagen de prueba
  const imageBuffer = fs.readFileSync(testImagePath);
  console.log('Image buffer size:', imageBuffer.length);

  // Crear el directorio de destino
  const destDir = path.join(__dirname, 'public', 'uploads', 'properties', propertyId);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log('Created directory:', destDir);
  }

  // Crear nombre de archivo
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const filename = `test_upload_${timestamp}_${randomId}.png`;
  const filepath = path.join(destDir, filename);

  // Escribir el archivo
  fs.writeFileSync(filepath, imageBuffer);
  console.log('File written to:', filepath);
  console.log('File exists after write:', fs.existsSync(filepath));

  // Verificar que se puede leer
  const readBuffer = fs.readFileSync(filepath);
  console.log('Read back buffer size:', readBuffer.length);
}

testImageUpload().catch(console.error);
