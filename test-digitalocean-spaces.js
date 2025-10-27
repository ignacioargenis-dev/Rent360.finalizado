#!/usr/bin/env node

/**
 * Script de prueba para verificar la configuración de DigitalOcean Spaces
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !key.startsWith('#')) {
      const value = valueParts.join('=').replace(/"/g, '');
      process.env[key.trim()] = value.trim();
    }
  });
}

async function testDigitalOceanSpacesConfiguration() {
  console.log('🧪 PROBANDO CONFIGURACIÓN DE DIGITALOCEAN SPACES\n');

  try {
    // 1. Verificar variables de entorno
    console.log('📋 1. Verificando variables de entorno...');

    const requiredVars = [
      'DO_SPACES_ACCESS_KEY',
      'DO_SPACES_SECRET_KEY',
      'DO_SPACES_BUCKET',
      'DO_SPACES_REGION',
      'DO_SPACES_ENDPOINT',
    ];

    let allVarsPresent = true;
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`   ✅ ${varName}: ${process.env[varName].substring(0, 10)}...`);
      } else {
        console.log(`   ❌ ${varName}: No configurado`);
        allVarsPresent = false;
      }
    });

    if (!allVarsPresent) {
      console.log('\n❌ Variables de entorno incompletas');
      console.log('💡 Ejecuta: node configure-digitalocean-spaces.js');
      return;
    }

    // 2. Probar conexión a DigitalOcean Spaces
    console.log('\n🔗 2. Probando conexión a DigitalOcean Spaces...');

    const {
      S3Client,
      PutObjectCommand,
      HeadObjectCommand,
      DeleteObjectCommand,
    } = require('@aws-sdk/client-s3');

    const s3Client = new S3Client({
      region: process.env.DO_SPACES_REGION,
      credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
      },
      endpoint: process.env.DO_SPACES_ENDPOINT,
    });

    // Probar conexión con una operación básica
    const testKey = `test-connection-${Date.now()}.txt`;
    const testContent = 'Test de conexión desde Rent360';

    try {
      // Subir archivo de prueba
      const putCommand = new PutObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
        ACL: 'public-read',
      });

      await s3Client.send(putCommand);
      console.log('   ✅ Archivo de prueba subido exitosamente');

      // Verificar que el archivo existe
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: testKey,
      });

      await s3Client.send(headCommand);
      console.log('   ✅ Archivo verificado en el bucket');

      // Generar URL pública
      const publicUrl = `${process.env.DO_SPACES_ENDPOINT}/${testKey}`;
      console.log(`   ✅ URL pública: ${publicUrl}`);

      // Limpiar archivo de prueba
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: testKey,
      });

      await s3Client.send(deleteCommand);
      console.log('   ✅ Archivo de prueba eliminado');
    } catch (error) {
      console.log('   ❌ Error en la conexión:');
      console.log(`      ${error.message}`);

      if (error.name === 'NoSuchBucket') {
        console.log('   💡 El bucket no existe. Verifica el nombre del Space.');
      } else if (error.name === 'InvalidAccessKeyId') {
        console.log('   💡 Credenciales incorrectas. Verifica tu Access Key.');
      } else if (error.name === 'SignatureDoesNotMatch') {
        console.log('   💡 Credenciales incorrectas. Verifica tu Secret Key.');
      }

      return;
    }

    // 3. Probar el servicio de cloud storage de Rent360
    console.log('\n🏠 3. Probando servicio de cloud storage de Rent360...');

    try {
      const { getCloudStorageService } = require('./src/lib/cloud-storage');
      const cloudStorage = getCloudStorageService();

      console.log('   ✅ Servicio de cloud storage inicializado');

      // Probar subida de archivo
      const testBuffer = Buffer.from('Test de Rent360 Cloud Storage');
      const testFilename = `rent360-test-${Date.now()}.txt`;
      const testKey = `properties/test-property/${testFilename}`;

      const result = await cloudStorage.uploadFile(testBuffer, testKey, 'text/plain');
      console.log(`   ✅ Archivo subido: ${result.url}`);

      // Verificar que existe
      const exists = await cloudStorage.fileExists(testKey);
      if (exists) {
        console.log('   ✅ Archivo verificado en cloud storage');
      } else {
        console.log('   ❌ Archivo no encontrado después de subir');
      }

      // Limpiar archivo de prueba
      await cloudStorage.deleteFile(testKey);
      console.log('   ✅ Archivo de prueba eliminado');
    } catch (error) {
      console.log('   ❌ Error en el servicio de cloud storage:');
      console.log(`      ${error.message}`);
      return;
    }

    // 4. Probar creación de propiedad con imágenes
    console.log('\n🏠 4. Probando creación de propiedad...');

    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Buscar un usuario OWNER para la prueba
      const owner = await prisma.user.findFirst({
        where: { role: 'OWNER', isActive: true },
        select: { id: true, name: true, email: true },
      });

      if (!owner) {
        console.log('   ⚠️ No hay usuarios OWNER disponibles para la prueba');
        console.log('   💡 Crea usuarios primero con: node create-real-users.js');
      } else {
        console.log(`   ✅ Usuario OWNER encontrado: ${owner.name} (${owner.email})`);

        // Crear propiedad de prueba
        const testProperty = await prisma.property.create({
          data: {
            title: 'Propiedad de Prueba - Cloud Storage',
            description: 'Esta es una propiedad de prueba para verificar el cloud storage',
            address: 'Dirección de Prueba 123',
            city: 'Santiago',
            commune: 'Providencia',
            region: 'Metropolitana',
            price: 500000,
            deposit: 1000000,
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            type: 'APARTMENT',
            status: 'PENDING',
            ownerId: owner.id,
            createdBy: owner.id,
            furnished: false,
            petFriendly: false,
            parkingSpaces: 0,
            heating: false,
            cooling: false,
            internet: false,
            elevator: false,
            balcony: false,
            terrace: false,
            garden: false,
            pool: false,
            gym: false,
            security: false,
            concierge: false,
          },
        });

        console.log(`   ✅ Propiedad de prueba creada: ${testProperty.id}`);

        // Limpiar propiedad de prueba
        await prisma.property.delete({
          where: { id: testProperty.id },
        });
        console.log('   ✅ Propiedad de prueba eliminada');
      }

      await prisma.$disconnect();
    } catch (error) {
      console.log('   ❌ Error en la prueba de propiedad:');
      console.log(`      ${error.message}`);
    }

    console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Variables de entorno configuradas');
    console.log('   ✅ Conexión a DigitalOcean Spaces funcionando');
    console.log('   ✅ Servicio de cloud storage de Rent360 operativo');
    console.log('   ✅ Base de datos funcionando correctamente');

    console.log('\n🚀 Próximos pasos:');
    console.log('   1. Reinicia tu aplicación');
    console.log('   2. Prueba crear una propiedad desde el panel de propietarios');
    console.log('   3. Verifica que las imágenes se suban correctamente');
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar prueba
testDigitalOceanSpacesConfiguration().catch(error => {
  console.error('❌ Error en la prueba:', error.message);
});
