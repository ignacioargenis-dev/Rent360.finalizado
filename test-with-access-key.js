#!/usr/bin/env node

const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

async function testWithAccessKey() {
  console.log('🔍 Probando con el Access Key correcto...\n');

  const accessKey = 'DO801H6NY6HTM8RMM4Y2';
  const secretKey = 'DO801H6NY6HTM8RMM4Y2'; // Temporal - necesitamos el real
  const bucket = 'rent360-images';
  const region = 'nyc3';

  console.log('📋 Configuración:');
  console.log(`   Access Key: ${accessKey}`);
  console.log(`   Secret Key: ${secretKey} (temporal)`);
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
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('🔍 Código de error:', error.$metadata?.httpStatusCode);

    if (error.message.includes('InvalidAccessKeyId')) {
      console.log('\n🔧 El Access Key es incorrecto.');
    } else if (error.message.includes('SignatureDoesNotMatch')) {
      console.log('\n🔧 El Secret Key es incorrecto.');
      console.log('\n📋 Para obtener el Secret Key correcto:');
      console.log('   1. En la tabla de Access Keys, haz clic en los tres puntos (...)');
      console.log('   2. Selecciona "View" o "Show"');
      console.log('   3. Copia el Secret Key (cadena larga)');
      console.log('   4. Ejecuta: node configure-do-spaces.js');
    } else {
      console.log('\n🔧 Error:', error.message);
    }
  }
}

testWithAccessKey();
