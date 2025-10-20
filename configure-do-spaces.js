#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function configureSpaces() {
  console.log('🚀 Configuración de DigitalOcean Spaces para Rent360\n');

  console.log('📋 Necesito la siguiente información de tu panel de DigitalOcean:\n');

  const spaceName = await question('🌐 Nombre del Space (ej: rent360-images): ');
  const region = await question('🌍 Región del Space (ej: nyc3, fra1, sfo3): ');
  const accessKey = await question('🔑 Access Key: ');
  const secretKey = await question('🔐 Secret Key: ');

  console.log('\n📝 Configuración capturada:');
  console.log(`   Space: ${spaceName}`);
  console.log(`   Región: ${region}`);
  console.log(`   Access Key: ${accessKey.substring(0, 10)}...`);
  console.log(`   Secret Key: ${secretKey.substring(0, 10)}...`);

  const confirm = await question('\n✅ ¿Es correcta esta información? (y/n): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Configuración cancelada');
    rl.close();
    return;
  }

  // Crear archivo de configuración temporal
  const config = {
    DO_SPACES_ACCESS_KEY: accessKey,
    DO_SPACES_SECRET_KEY: secretKey,
    DO_SPACES_BUCKET: spaceName,
    DO_SPACES_REGION: region,
  };

  console.log('\n🧪 Probando conexión...');

  // Configurar variables de entorno
  process.env.DO_SPACES_ACCESS_KEY = accessKey;
  process.env.DO_SPACES_SECRET_KEY = secretKey;
  process.env.DO_SPACES_BUCKET = spaceName;
  process.env.DO_SPACES_REGION = region;

  // Probar conexión
  try {
    const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

    const s3Client = new S3Client({
      endpoint: `https://${region}.digitaloceanspaces.com`,
      region: region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    const testKey = `test-${Date.now()}.txt`;
    const testContent = 'Test connection from Rent360';

    // Subir archivo de prueba
    const uploadCommand = new PutObjectCommand({
      Bucket: spaceName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });

    await s3Client.send(uploadCommand);
    console.log('✅ Archivo de prueba subido exitosamente');

    // Eliminar archivo de prueba
    const deleteCommand = new DeleteObjectCommand({
      Bucket: spaceName,
      Key: testKey,
    });

    await s3Client.send(deleteCommand);
    console.log('✅ Archivo de prueba eliminado');

    console.log('\n🎉 ¡Conexión exitosa!');
    console.log('\n📋 Para usar esta configuración en tu aplicación:');
    console.log('1. Agrega estas variables a tu archivo .env:');
    console.log(`   DO_SPACES_ACCESS_KEY=${accessKey}`);
    console.log(`   DO_SPACES_SECRET_KEY=${secretKey}`);
    console.log(`   DO_SPACES_BUCKET=${spaceName}`);
    console.log(`   DO_SPACES_REGION=${region}`);

    console.log('\n2. Ejecuta la migración de imágenes:');
    console.log('   node migrate-images-to-cloud.js');

    console.log('\n3. Actualiza tu aplicación para usar cloud storage');
  } catch (error) {
    console.error('\n❌ Error en la conexión:', error.message);
    console.log('\n🔧 Verifica:');
    console.log('1. Que el Space existe y tiene el nombre correcto');
    console.log('2. Que las credenciales tienen permisos de Spaces');
    console.log('3. Que la región es correcta');
    console.log('4. Que no hay problemas de red/firewall');
  }

  rl.close();
}

configureSpaces();
