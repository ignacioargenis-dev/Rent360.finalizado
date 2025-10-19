const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateToPNG() {
  console.log('🔄 Actualizando base de datos para usar imágenes PNG...');

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

    console.log(`📊 Encontradas ${properties.length} propiedades con imágenes`);

    for (const property of properties) {
      console.log(`\n🏠 Propiedad: ${property.title} (${property.id})`);

      try {
        const images = JSON.parse(property.images);
        console.log(`📸 Imágenes originales:`, images);

        const updatedImages = images.map(imgUrl => {
          // Reemplazar .jpg con .png
          if (imgUrl.includes('.jpg')) {
            const newUrl = imgUrl.replace('.jpg', '.png');
            console.log(`🔄 Actualizando: ${imgUrl} → ${newUrl}`);
            return newUrl;
          }
          return imgUrl;
        });

        if (JSON.stringify(images) !== JSON.stringify(updatedImages)) {
          // Actualizar en la base de datos
          await prisma.property.update({
            where: { id: property.id },
            data: { images: JSON.stringify(updatedImages) },
          });
          console.log(`✅ Actualizada en BD:`, updatedImages);
        } else {
          console.log(`ℹ️ No se requieren cambios`);
        }
      } catch (error) {
        console.log(`❌ Error procesando propiedad ${property.id}:`, error.message);
      }
    }

    console.log('\n🎉 Proceso completado');
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateToPNG();
