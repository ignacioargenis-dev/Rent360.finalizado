#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const prisma = new PrismaClient();

async function migrateImagesToCloud() {
  console.log('🚀 Iniciando migración de imágenes a DigitalOcean Spaces...\n');

  // Configuración de DigitalOcean Spaces
  const config = {
    accessKey: process.env.DO_SPACES_ACCESS_KEY || 'DO801ALJNKLDGU2TXXF4',
    secretKey: process.env.DO_SPACES_SECRET_KEY || 'h+UJCd6KoqCrw6ZzvTy0xBM7ueKO0DzdWS7Dy8muMGc',
    bucket: process.env.DO_SPACES_BUCKET || 'rent360-images',
    region: process.env.DO_SPACES_REGION || 'nyc3',
  };

  console.log('📋 Configuración:');
  console.log(`   Access Key: ${config.accessKey}`);
  console.log(`   Secret Key: ${config.secretKey.substring(0, 10)}...`);
  console.log(`   Bucket: ${config.bucket}`);
  console.log(`   Region: ${config.region}\n`);

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

  let migratedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  try {
    // Obtener todas las propiedades con imágenes
    const properties = await prisma.property.findMany({
      where: {
        images: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        images: true,
      },
    });

    console.log(`📊 Encontradas ${properties.length} propiedades con imágenes\n`);

    for (const property of properties) {
      if (!property.images) {
        continue;
      }

      let images;
      try {
        images = Array.isArray(property.images) ? property.images : JSON.parse(property.images);
      } catch (error) {
        console.log(`❌ Error parseando imágenes de propiedad ${property.id}: ${error.message}`);
        continue;
      }

      const migratedImages = [];

      console.log(`\n🏠 Procesando propiedad: ${property.title} (${property.id})`);

      for (const imageUrl of images) {
        try {
          // Verificar si ya es una URL de cloud storage
          if (imageUrl.includes('digitaloceanspaces.com') || imageUrl.includes('amazonaws.com')) {
            console.log(`   ⏭️  Ya en cloud: ${path.basename(imageUrl)}`);
            migratedImages.push(imageUrl);
            skippedCount++;
            continue;
          }

          // Extraer información del archivo local
          const urlParts = imageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const propertyId = urlParts[urlParts.length - 2];

          // Ruta local del archivo
          const localPath = path.join(
            process.cwd(),
            'public',
            'uploads',
            'properties',
            propertyId,
            fileName
          );

          // Verificar si el archivo existe localmente
          if (!fs.existsSync(localPath)) {
            console.log(`   ❌ Archivo no encontrado: ${fileName}`);
            errorCount++;
            continue;
          }

          // Leer archivo local
          const fileBuffer = fs.readFileSync(localPath);
          const fileExtension = path.extname(fileName);
          const mimeType = getMimeType(fileExtension);

          // Generar key para cloud storage
          const cloudKey = `properties/${propertyId}/${fileName}`;

          // Subir a DigitalOcean Spaces
          const uploadCommand = new PutObjectCommand({
            Bucket: config.bucket,
            Key: cloudKey,
            Body: fileBuffer,
            ContentType: mimeType,
            ACL: 'public-read',
          });

          await s3Client.send(uploadCommand);

          // Generar URL pública
          const publicUrl = `https://${config.bucket}.${config.region}.digitaloceanspaces.com/${cloudKey}`;
          migratedImages.push(publicUrl);

          console.log(`   ✅ Migrado: ${fileName} → ${publicUrl}`);
          migratedCount++;
        } catch (error) {
          console.log(`   ❌ Error migrando ${imageUrl}: ${error.message}`);
          errorCount++;
        }
      }

      // Actualizar base de datos con las nuevas URLs
      if (migratedImages.length > 0) {
        try {
          await prisma.property.update({
            where: { id: property.id },
            data: { images: migratedImages },
          });
          console.log(`   💾 Base de datos actualizada para ${property.title}`);
        } catch (error) {
          console.log(`   ❌ Error actualizando BD: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Migración completada!');
    console.log(`📊 Estadísticas:`);
    console.log(`   ✅ Imágenes migradas: ${migratedCount}`);
    console.log(`   ⏭️  Imágenes ya en cloud: ${skippedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

    if (migratedCount > 0) {
      console.log('\n💡 Próximos pasos:');
      console.log('   1. ✅ Imágenes migradas a cloud storage');
      console.log('   2. 🔄 Actualizar código para usar cloud storage');
      console.log('   3. 🚀 Desplegar a producción');
    }
  } catch (error) {
    console.error('❌ Error general en migración:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

function getMimeType(extension) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

migrateImagesToCloud();
