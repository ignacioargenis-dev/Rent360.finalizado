#!/usr/bin/env node

const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

async function debugConnection() {
  console.log('🔍 Diagnosticando conexión con DigitalOcean Spaces...\n');

  const accessKey = process.env.DO_SPACES_ACCESS_KEY || 'key-1760981663136';
  const secretKey = process.env.DO_SPACES_SECRET_KEY || 'DO801H6NY6HTM8RMM4Y2';
  const region = process.env.DO_SPACES_REGION || 'nyc3';

  console.log('📋 Configuración:');
  console.log(`   Access Key: ${accessKey.substring(0, 10)}...`);
  console.log(`   Secret Key: ${secretKey.substring(0, 10)}...`);
  console.log(`   Region: ${region}`);

  try {
    // Probar diferentes endpoints
    const endpoints = [
      `https://${region}.digitaloceanspaces.com`,
      `https://nyc3.digitaloceanspaces.com`,
      `https://fra1.digitaloceanspaces.com`,
      `https://sfo3.digitaloceanspaces.com`,
      `https://sgp1.digitaloceanspaces.com`,
    ];

    for (const endpoint of endpoints) {
      console.log(`\n🔗 Probando endpoint: ${endpoint}`);

      try {
        const s3Client = new S3Client({
          endpoint: endpoint,
          region: region,
          credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
          },
          forcePathStyle: false,
        });

        // Intentar listar buckets
        const listCommand = new ListBucketsCommand({});
        const response = await s3Client.send(listCommand);

        console.log('✅ Conexión exitosa!');
        console.log('📦 Buckets disponibles:');
        response.Buckets?.forEach(bucket => {
          console.log(`   - ${bucket.Name} (creado: ${bucket.CreationDate})`);
        });

        // Si llegamos aquí, este endpoint funciona
        console.log(`\n🎉 Endpoint funcional: ${endpoint}`);
        return;
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    console.log('\n❌ No se pudo conectar con ningún endpoint');
    console.log('\n🔧 Posibles problemas:');
    console.log('1. Las credenciales son incorrectas');
    console.log('2. El Space no existe o no tienes permisos');
    console.log('3. La región es incorrecta');
    console.log('4. Problemas de red/firewall');
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

debugConnection();
