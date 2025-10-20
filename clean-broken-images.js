#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanBrokenImages() {
  console.log('🧹 Limpiando URLs de imágenes rotas...\n');

  try {
    // Buscar la propiedad específica
    const propertyId = 'cmgso8wv00003p5qwva17zrmn';

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        images: true,
      },
    });

    if (!property) {
      console.log('❌ Propiedad no encontrada');
      return;
    }

    console.log('🏠 Propiedad:', property.title);

    if (!property.images) {
      console.log('📋 No hay imágenes para limpiar');
      return;
    }

    let images;
    try {
      images = Array.isArray(property.images) ? property.images : JSON.parse(property.images);
    } catch (error) {
      console.log('❌ Error parseando imágenes:', error.message);
      return;
    }

    console.log('📊 Imágenes antes de limpiar:', images.length);

    // Separar URLs locales (rotas) de URLs de cloud storage (funcionan)
    const localImages = images.filter(img => img.startsWith('/api/uploads/'));
    const cloudImages = images.filter(img => img.includes('digitaloceanspaces.com'));

    console.log('🏠 URLs locales (rotas):', localImages.length);
    console.log('☁️  URLs de cloud (funcionan):', cloudImages.length);

    // Mantener solo las URLs de cloud storage
    const cleanImages = cloudImages;

    console.log('🧹 Imágenes después de limpiar:', cleanImages.length);

    if (cleanImages.length === 0) {
      console.log('⚠️  No hay imágenes válidas. ¿Deseas eliminar todas las imágenes?');
      console.log('   Esto mostrará la propiedad sin imágenes hasta que subas nuevas.');

      // Eliminar todas las imágenes
      await prisma.property.update({
        where: { id: propertyId },
        data: { images: null },
      });

      console.log('✅ Todas las imágenes eliminadas de la base de datos');
    } else {
      // Actualizar con solo las imágenes válidas
      await prisma.property.update({
        where: { id: propertyId },
        data: { images: JSON.stringify(cleanImages) },
      });

      console.log('✅ Base de datos actualizada con imágenes válidas:');
      cleanImages.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img}`);
      });
    }

    console.log('\n🎉 Limpieza completada!');
    console.log('💡 Ahora las imágenes deberían mostrarse correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanBrokenImages();
