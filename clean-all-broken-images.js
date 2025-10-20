#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanAllBrokenImages() {
  console.log('🧹 Limpiando URLs de imágenes rotas en todas las propiedades...\n');

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

    console.log(`📊 Propiedades con imágenes encontradas: ${properties.length}\n`);

    let totalCleaned = 0;
    let totalProperties = 0;

    for (const property of properties) {
      console.log(`🏠 Procesando: ${property.title} (${property.id})`);

      let images;
      try {
        images = Array.isArray(property.images) ? property.images : JSON.parse(property.images);
      } catch (error) {
        console.log('   ❌ Error parseando imágenes, saltando...');
        continue;
      }

      // Separar URLs locales (rotas) de URLs de cloud storage (funcionan)
      const localImages = images.filter(img => img.startsWith('/api/uploads/'));
      const cloudImages = images.filter(img => img.includes('digitaloceanspaces.com'));

      if (localImages.length > 0) {
        console.log(
          `   🧹 Limpiando ${localImages.length} URLs rotas, manteniendo ${cloudImages.length} válidas`
        );

        if (cloudImages.length === 0) {
          // Eliminar todas las imágenes si no hay válidas
          await prisma.property.update({
            where: { id: property.id },
            data: { images: null },
          });
          console.log('   ✅ Todas las imágenes eliminadas');
        } else {
          // Mantener solo las imágenes válidas
          await prisma.property.update({
            where: { id: property.id },
            data: { images: JSON.stringify(cloudImages) },
          });
          console.log('   ✅ Base de datos actualizada');
        }

        totalCleaned += localImages.length;
        totalProperties++;
      } else {
        console.log('   ✅ No hay URLs rotas');
      }
    }

    console.log('\n🎉 Limpieza completada!');
    console.log(`📊 Estadísticas:`);
    console.log(`   🏠 Propiedades procesadas: ${properties.length}`);
    console.log(`   🧹 Propiedades limpiadas: ${totalProperties}`);
    console.log(`   🗑️  URLs rotas eliminadas: ${totalCleaned}`);

    if (totalCleaned > 0) {
      console.log('\n💡 Beneficios:');
      console.log('   ✅ No más errores "Error loading image"');
      console.log('   ✅ Solo se muestran imágenes que funcionan');
      console.log('   ✅ Mejor experiencia de usuario');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAllBrokenImages();
