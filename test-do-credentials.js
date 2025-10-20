#!/usr/bin/env node

const { S3Client, ListBucketsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

async function testCredentials() {
  console.log('🔍 Probando credenciales de DigitalOcean Spaces...\n');

  // Configuración basada en las capturas de pantalla
  const config = {
    accessKey: 'key-1760981663136',
    secretKey: 'DO801H6NY6HTM8RMM4Y2', // Este podría ser incorrecto
    bucket: 'rent360-images',
    region: 'nyc3',
  };

  console.log('📋 Configuración:');
  console.log(`   Access Key: ${config.accessKey}`);
  console.log(`   Secret Key: ${config.secretKey.substring(0, 10)}...`);
  console.log(`   Bucket: ${config.bucket}`);
  console.log(`   Region: ${config.region}`);

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
    const testContent = 'Test from Rent360';

    const uploadCommand = new PutObjectCommand({
      Bucket: config.bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });

    await s3Client.send(uploadCommand);
    console.log('✅ Archivo subido exitosamente!');
    console.log(
      `📁 URL: https://${config.bucket}.${config.region}.digitaloceanspaces.com/${testKey}`
    );

    console.log('\n🎉 ¡Todas las pruebas pasaron!');
    console.log('\n💡 Las credenciales son correctas. Puedes proceder con la migración.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('🔍 Código de error:', error.$metadata?.httpStatusCode);
    console.error('🔍 Request ID:', error.$metadata?.requestId);

    if (error.message.includes('InvalidAccessKeyId')) {
      console.log('\n🔧 El Access Key es incorrecto. Verifica en DigitalOcean:');
      console.log('   1. Ve a API > Tokens');
      console.log('   2. Verifica que el token tenga permisos de Spaces');
      console.log('   3. Copia el Access Key correcto');
    } else if (error.message.includes('SignatureDoesNotMatch')) {
      console.log('\n🔧 El Secret Key es incorrecto. Verifica en DigitalOcean:');
      console.log('   1. Ve a API > Tokens');
      console.log('   2. Copia el Secret Key correcto');
      console.log('   3. Asegúrate de que no haya espacios extra');
    } else if (error.message.includes('NoSuchBucket')) {
      console.log('\n🔧 El bucket no existe o no tienes permisos:');
      console.log('   1. Verifica que el Space se llame exactamente "rent360-images"');
      console.log('   2. Verifica que esté en la región "nyc3"');
      console.log('   3. Verifica que el token tenga permisos en este Space');
    } else {
      console.log('\n🔧 Error desconocido. Verifica:');
      console.log('   1. Que el Space existe y está activo');
      console.log('   2. Que las credenciales son correctas');
      console.log('   3. Que no hay problemas de red');
    }
  }
}

testCredentials();
