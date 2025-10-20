#!/usr/bin/env node

const {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

async function testFinalConnection() {
  console.log('🔍 Probando conexión final con DigitalOcean Spaces...\n');

  // Usar el Access Key que me proporcionaste
  const accessKey = 'DO801H6NY6HTM8RMM4Y2';
  const secretKey = 'DO801H6NY6HTM8RMM4Y2'; // Intentar con el mismo valor
  const bucket = 'rent360-images';
  const region = 'nyc3';

  console.log('📋 Configuración:');
  console.log(`   Access Key: ${accessKey}`);
  console.log(`   Secret Key: ${secretKey.substring(0, 10)}...`);
  console.log(`   Bucket: ${bucket}`);
  console.log(`   Region: ${region}`);

  try {
    const s3Client = new S3Client({
      endpoint: `https://${region}.digitaloceanspaces.com`,
      region: region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: false,
    });

    console.log('\n🔗 Probando listado de buckets...');
    const listCommand = new ListBucketsCommand({});
    const response = await s3Client.send(listCommand);

    console.log('✅ Conexión exitosa!');
    console.log('📦 Buckets disponibles:');
    response.Buckets?.forEach(bucket => {
      console.log(`   - ${bucket.Name} (creado: ${bucket.CreationDate})`);
    });

    // Probar subida de archivo
    console.log('\n📤 Probando subida de archivo...');
    const testKey = `test-${Date.now()}.txt`;
    const testContent = 'Test from Rent360 - Cloud Storage Working!';

    const uploadCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });

    await s3Client.send(uploadCommand);
    console.log('✅ Archivo subido exitosamente!');
    console.log(`📁 URL: https://${bucket}.${region}.digitaloceanspaces.com/${testKey}`);

    // Limpiar archivo de prueba
    console.log('\n🧹 Eliminando archivo de prueba...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: testKey,
    });

    await s3Client.send(deleteCommand);
    console.log('✅ Archivo eliminado');

    console.log('\n🎉 ¡CONEXIÓN EXITOSA!');
    console.log('\n💡 Cloud storage está funcionando correctamente.');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. ✅ Conexión verificada');
    console.log('   2. 🔄 Migrar imágenes existentes');
    console.log('   3. 🚀 Actualizar código para producción');

    return true;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('🔍 Código de error:', error.$metadata?.httpStatusCode);

    if (error.message.includes('SignatureDoesNotMatch')) {
      console.log('\n🔧 El Secret Key es incorrecto.');
      console.log('\n📋 Para obtener el Secret Key correcto:');
      console.log('   1. En la tabla de Access Keys, haz clic en los tres puntos (...)');
      console.log('   2. Selecciona "Regenerate key"');
      console.log('   3. Copia el nuevo Access Key y Secret Key');
      console.log('   4. Ejecuta este script de nuevo');
    } else {
      console.log('\n🔧 Error:', error.message);
    }

    return false;
  }
}

testFinalConnection().then(success => {
  if (success) {
    console.log('\n🚀 Ejecutando migración de imágenes...');
    // Aquí podríamos ejecutar la migración automáticamente
  }
});
