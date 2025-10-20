#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const prisma = new PrismaClient();

async function testMigration() {
  console.log('🧪 Probando migración de imagen específica...\n');

  // Configuración de DigitalOcean Spaces
  const config = {
    accessKey: 'DO801ALJNKLDGU2TXXF4',
    secretKey: 'h+UJCd6KoqCrw6ZzvTy0xBM7ueKO0DzdWS7Dy8muMGc',
    bucket: 'rent360-images',
    region: 'nyc3',
  };

  // Crear cliente S3
  const s3Client = new S3Client({
    endpoint: `https://${config.region}.digitaloceanspaces.com`,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: false,
  });

  try {
    // Imagen de prueba que sabemos que existe
    const propertyId = 'cmgso8wv00003p5qwva17zrmn';
    const fileName = 'test_image_1760914771491.png';
    const localPath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'properties',
      propertyId,
      fileName
    );

    console.log(`📁 Ruta local: ${localPath}`);

    if (!fs.existsSync(localPath)) {
      console.log('❌ Archivo no encontrado');
      return;
    }

    console.log('✅ Archivo encontrado localmente');

    // Leer archivo
    const fileBuffer = fs.readFileSync(localPath);
    console.log(`📊 Tamaño del archivo: ${fileBuffer.length} bytes`);

    // Generar key para cloud storage
    const cloudKey = `properties/${propertyId}/${fileName}`;
    console.log(`☁️  Cloud key: ${cloudKey}`);

    // Subir a DigitalOcean Spaces
    console.log('📤 Subiendo a DigitalOcean Spaces...');
    const uploadCommand = new PutObjectCommand({
      Bucket: config.bucket,
      Key: cloudKey,
      Body: fileBuffer,
      ContentType: 'image/png',
      ACL: 'public-read',
    });

    await s3Client.send(uploadCommand);
    console.log('✅ Archivo subido exitosamente!');

    // Generar URL pública
    const publicUrl = `https://${config.bucket}.${config.region}.digitaloceanspaces.com/${cloudKey}`;
    console.log(`🌐 URL pública: ${publicUrl}`);

    // Actualizar base de datos
    console.log('💾 Actualizando base de datos...');
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { images: true },
    });

    if (property) {
      let images = [];
      if (property.images) {
        try {
          images = Array.isArray(property.images) ? property.images : JSON.parse(property.images);
        } catch (error) {
          console.log('⚠️  Error parseando imágenes existentes, creando nueva lista');
          images = [];
        }
      }

      // Reemplazar URLs locales con la nueva URL de cloud
      const updatedImages = images.map(img => {
        if (img.includes(fileName)) {
          return publicUrl;
        }
        return img;
      });

      // Si no se encontró la imagen en la lista, agregarla
      if (!updatedImages.some(img => img.includes(fileName))) {
        updatedImages.push(publicUrl);
      }

      await prisma.property.update({
        where: { id: propertyId },
        data: { images: JSON.stringify(updatedImages) },
      });

      console.log('✅ Base de datos actualizada');
      console.log(`📋 Imágenes actualizadas: ${updatedImages.length}`);
    }

    console.log('\n🎉 ¡Migración de prueba exitosa!');
    console.log(`🌐 Puedes ver la imagen en: ${publicUrl}`);
  } catch (error) {
    console.error('❌ Error en migración de prueba:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMigration();
