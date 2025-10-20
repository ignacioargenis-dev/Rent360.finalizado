const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const {
  getCloudStorageService,
  extractKeyFromUrl,
  generateFileKey,
} = require('./src/lib/cloud-storage');

const prisma = new PrismaClient();

async function migrateImagesToCloud() {
  console.log('🚀 Iniciando migración de imágenes a cloud storage...\n');

  const cloudStorage = getCloudStorageService();
  let migratedCount = 0;
  let errorCount = 0;

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

      const images = Array.isArray(property.images) ? property.images : JSON.parse(property.images);

      const migratedImages = [];

      console.log(`\n🏠 Procesando propiedad: ${property.title} (${property.id})`);

      for (const imageUrl of images) {
        try {
          // Verificar si ya es una URL de cloud storage
          if (
            imageUrl.includes('digitaloceanspaces.com') ||
            imageUrl.includes('s3.') ||
            imageUrl.includes('cloudinary.com')
          ) {
            console.log(`  ⏭️  Ya en cloud: ${imageUrl.split('/').pop()}`);
            migratedImages.push(imageUrl);
            continue;
          }

          // Extraer la ruta local del archivo
          let localPath;
          if (imageUrl.startsWith('/api/uploads/')) {
            localPath = path.join(
              process.cwd(),
              'public',
              imageUrl.replace('/api/uploads/', 'uploads/')
            );
          } else if (imageUrl.startsWith('/uploads/')) {
            localPath = path.join(process.cwd(), 'public', imageUrl);
          } else {
            // Es solo el nombre del archivo
            localPath = path.join(
              process.cwd(),
              'public',
              'uploads',
              'properties',
              property.id,
              imageUrl
            );
          }

          // Verificar si el archivo existe localmente
          if (!fs.existsSync(localPath)) {
            console.log(`  ❌ Archivo no encontrado localmente: ${localPath}`);
            errorCount++;
            continue;
          }

          // Leer el archivo
          const fileBuffer = fs.readFileSync(localPath);
          const filename = path.basename(localPath);

          // Generar key para cloud storage
          const cloudKey = generateFileKey(property.id, filename);

          // Subir a cloud storage
          console.log(`  📤 Subiendo: ${filename} -> ${cloudKey}`);
          const result = await cloudStorage.uploadFile(fileBuffer, cloudKey, getMimeType(filename));

          migratedImages.push(result.url);
          migratedCount++;

          // Opcional: eliminar archivo local después de subir
          // fs.unlinkSync(localPath);
          // console.log(`  🗑️  Eliminado local: ${filename}`);
        } catch (error) {
          console.error(`  ❌ Error migrando imagen ${imageUrl}:`, error.message);
          errorCount++;
          // Mantener la URL original en caso de error
          migratedImages.push(imageUrl);
        }
      }

      // Actualizar la propiedad en la base de datos
      if (migratedImages.length > 0) {
        await prisma.property.update({
          where: { id: property.id },
          data: {
            images: JSON.stringify(migratedImages),
          },
        });
        console.log(`  ✅ Actualizada BD para propiedad ${property.id}`);
      }
    }

    console.log(`\n🎉 Migración completada!`);
    console.log(`📈 Imágenes migradas: ${migratedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Ejecutar migración
migrateImagesToCloud();
