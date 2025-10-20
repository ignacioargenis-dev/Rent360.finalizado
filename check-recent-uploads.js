#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentUploads() {
  console.log('🔍 Verificando subidas recientes de imágenes...\n');

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
      console.log('📋 No hay imágenes en esta propiedad');
      return;
    }

    let images;
    try {
      images = Array.isArray(property.images) ? property.images : JSON.parse(property.images);
    } catch (error) {
      console.log('❌ Error parseando imágenes:', error.message);
      return;
    }

    console.log('📊 Total de imágenes:', images.length);
    console.log('📋 Todas las imágenes:');

    images.forEach((img, index) => {
      const isLocal = img.startsWith('/api/uploads/');
      const isCloud = img.includes('digitaloceanspaces.com');
      const type = isLocal ? '🏠 LOCAL' : isCloud ? '☁️  CLOUD' : '❓ DESCONOCIDO';
      console.log(`   ${index + 1}. ${type} - ${img}`);
    });

    // Analizar tipos de URLs
    const localImages = images.filter(img => img.startsWith('/api/uploads/'));
    const cloudImages = images.filter(img => img.includes('digitaloceanspaces.com'));
    const unknownImages = images.filter(
      img => !img.startsWith('/api/uploads/') && !img.includes('digitaloceanspaces.com')
    );

    console.log('\n📊 Análisis:');
    console.log(`   🏠 URLs locales: ${localImages.length}`);
    console.log(`   ☁️  URLs de cloud: ${cloudImages.length}`);
    console.log(`   ❓ URLs desconocidas: ${unknownImages.length}`);

    if (localImages.length > 0) {
      console.log('\n⚠️  PROBLEMA DETECTADO:');
      console.log('   Las nuevas imágenes se están guardando como URLs locales');
      console.log('   Pero el servidor de archivos locales no está funcionando correctamente');

      console.log('\n💡 SOLUCIONES:');
      console.log('   1. Configurar las variables de entorno de cloud storage');
      console.log('   2. Verificar que el servidor de archivos locales funcione');
      console.log('   3. Migrar las URLs locales a cloud storage');
    }

    // Verificar si hay imágenes muy recientes (últimos 10 minutos)
    const now = Date.now();
    const recentImages = images.filter(img => {
      // Buscar timestamp en el nombre del archivo
      const timestampMatch = img.match(/(\d{13})/);
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1]);
        const ageMinutes = (now - timestamp) / (1000 * 60);
        return ageMinutes <= 10; // Últimos 10 minutos
      }
      return false;
    });

    if (recentImages.length > 0) {
      console.log('\n🕐 Imágenes recientes (últimos 10 minutos):');
      recentImages.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentUploads();
