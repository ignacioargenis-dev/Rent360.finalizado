#!/usr/bin/env node

const {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

async function quickSetup() {
  console.log('🚀 Configuración rápida de DigitalOcean Spaces para Rent360\n');

  // Configuración basada en lo que sabemos
  const config = {
    accessKey: 'DO801ALJNKLDGU2TXXF4', // Access Key correcto
    secretKey: 'h+UJCd6KoqCrw6ZzvTy0xBM7ueKO0DzdWS7Dy8muMGc', // Secret Key real
    bucket: 'rent360-images',
    region: 'nyc3',
  };

  console.log('📋 Configuración actual:');
  console.log(`   Access Key: ${config.accessKey}`);
  console.log(`   Secret Key: ${config.secretKey}`);
  console.log(`   Bucket: ${config.bucket}`);
  console.log(`   Region: ${config.region}`);

  if (config.secretKey === 'TU_SECRET_KEY_AQUI') {
    console.log('\n❌ Necesitas configurar el Secret Key correcto.');
    console.log('\n📋 Pasos:');
    console.log('   1. Ve a DigitalOcean > Spaces > Access Keys');
    console.log('   2. Haz clic en los tres puntos (...) de tu access key');
    console.log('   3. Selecciona "Regenerate key"');
    console.log('   4. Copia el nuevo Secret Key');
    console.log('   5. Reemplaza "TU_SECRET_KEY_AQUI" en este archivo');
    console.log('   6. Ejecuta: node quick-setup.js');
    return;
  }

  try {
    const s3Client = new S3Client({
      endpoint: `https://${config.region}.digitaloceanspaces.com`,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: false,
    });

    console.log('\n🔗 Probando conexión...');
    const listCommand = new ListBucketsCommand({});
    const response = await s3Client.send(listCommand);

    console.log('✅ Conexión exitosa!');
    console.log('📦 Buckets disponibles:');
    response.Buckets?.forEach(bucket => {
      console.log(`   - ${bucket.Name} (creado: ${bucket.CreationDate})`);
    });

    // Probar subida
    console.log('\n📤 Probando subida de archivo...');
    const testKey = `test-${Date.now()}.txt`;
    const testContent = 'Rent360 Cloud Storage Test';

    const uploadCommand = new PutObjectCommand({
      Bucket: config.bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });

    await s3Client.send(uploadCommand);
    console.log('✅ Archivo subido exitosamente!');

    // Limpiar
    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: testKey,
    });

    await s3Client.send(deleteCommand);
    console.log('✅ Archivo eliminado');

    console.log('\n🎉 ¡CONFIGURACIÓN COMPLETA!');
    console.log('\n📋 Variables de entorno para tu .env:');
    console.log(`DO_SPACES_ACCESS_KEY=${config.accessKey}`);
    console.log(`DO_SPACES_SECRET_KEY=${config.secretKey}`);
    console.log(`DO_SPACES_BUCKET=${config.bucket}`);
    console.log(`DO_SPACES_REGION=${config.region}`);

    console.log('\n🚀 Próximos pasos:');
    console.log('   1. ✅ Conexión verificada');
    console.log('   2. 🔄 Ejecutar: node migrate-images-to-cloud.js');
    console.log('   3. 🚀 Actualizar código para producción');
  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('SignatureDoesNotMatch')) {
      console.log('\n🔧 El Secret Key es incorrecto.');
      console.log('   Verifica que copiaste el Secret Key correcto.');
    } else {
      console.log('\n🔧 Error:', error.message);
    }
  }
}

quickSetup();
