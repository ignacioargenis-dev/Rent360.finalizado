#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugImageIssue() {
  console.log('🔍 Investigando problema de imágenes...\n');

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

    console.log('🏠 Propiedad encontrada:', property.title);
    console.log('📋 Imágenes en BD:', property.images);

    if (property.images) {
      let images;
      try {
        images = Array.isArray(property.images) ? property.images : JSON.parse(property.images);
        console.log('📊 Total de imágenes:', images.length);

        images.forEach((img, index) => {
          console.log(`   ${index + 1}. ${img}`);
        });

        // Verificar si son URLs locales o de cloud storage
        const localImages = images.filter(img => img.startsWith('/api/uploads/'));
        const cloudImages = images.filter(img => img.includes('digitaloceanspaces.com'));

        console.log('\n📊 Análisis:');
        console.log(`   🏠 URLs locales: ${localImages.length}`);
        console.log(`   ☁️  URLs de cloud: ${cloudImages.length}`);

        if (localImages.length > 0) {
          console.log('\n⚠️  PROBLEMA DETECTADO:');
          console.log(
            '   Las imágenes están guardadas como URLs locales pero los archivos no existen'
          );
          console.log('   Esto causa el error "Error loading image"');

          console.log('\n💡 SOLUCIONES:');
          console.log('   1. Subir nuevas imágenes (se guardarán localmente)');
          console.log('   2. Configurar cloud storage y migrar imágenes existentes');
          console.log('   3. Limpiar URLs rotas de la base de datos');
        }
      } catch (error) {
        console.log('❌ Error parseando imágenes:', error.message);
      }
    } else {
      console.log('📋 No hay imágenes en esta propiedad');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugImageIssue();
