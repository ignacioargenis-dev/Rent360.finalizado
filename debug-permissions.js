#!/usr/bin/env node

const {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');

async function debugPermissions() {
  console.log('🔍 Diagnosticando permisos de DigitalOcean Spaces...\n');

  const config = {
    accessKey: 'DO801ALJNKLDGU2TXXF4',
    secretKey: 'h+UJCd6KoqCrw6ZzvTy0xBM7ueKO0DzdWS7Dy8muMGc',
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
    try {
      const listCommand = new ListBucketsCommand({});
      const response = await s3Client.send(listCommand);

      console.log('✅ Listado de buckets exitoso!');
      console.log('📦 Buckets disponibles:');
      response.Buckets?.forEach(bucket => {
        console.log(`   - ${bucket.Name} (creado: ${bucket.CreationDate})`);
      });
    } catch (error) {
      console.log('❌ Error listando buckets:', error.message);
    }

    console.log('\n🔗 Probando acceso directo al bucket...');
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: config.bucket,
        Key: 'test-file-that-does-not-exist.txt',
      });

      await s3Client.send(headCommand);
      console.log('✅ Acceso al bucket exitoso!');
    } catch (error) {
      if (error.name === 'NotFound') {
        console.log(
          '✅ Acceso al bucket exitoso! (archivo no existe, pero el bucket es accesible)'
        );
      } else {
        console.log('❌ Error accediendo al bucket:', error.message);
      }
    }

    console.log('\n🔗 Probando subida de archivo...');
    try {
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Test from Rent360';

      const uploadCommand = new PutObjectCommand({
        Bucket: config.bucket,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      });

      await s3Client.send(uploadCommand);
      console.log('✅ Subida de archivo exitosa!');
      console.log(
        `📁 URL: https://${config.bucket}.${config.region}.digitaloceanspaces.com/${testKey}`
      );

      // Limpiar
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: testKey,
      });

      await s3Client.send(deleteCommand);
      console.log('✅ Archivo eliminado');
    } catch (error) {
      console.log('❌ Error subiendo archivo:', error.message);
      console.log('🔍 Código de error:', error.$metadata?.httpStatusCode);
    }
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    console.error('🔍 Código de error:', error.$metadata?.httpStatusCode);

    if (error.message.includes('Access Denied')) {
      console.log('\n🔧 Problema de permisos detectado:');
      console.log('   1. Verifica que el access key tenga permisos de "Spaces"');
      console.log('   2. Verifica que tenga permisos "Read/Write/Delete"');
      console.log('   3. Verifica que esté asociado al bucket "rent360-images"');
      console.log('   4. Verifica que el bucket existe y está activo');
    }
  }
}

debugPermissions();
