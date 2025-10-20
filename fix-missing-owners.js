const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMissingOwners() {
  console.log('🔍 Buscando propiedades sin ownerId válido...');

  try {
    // Encontrar propiedades que no tienen ownerId o que el owner no existe
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        ownerId: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const propertiesWithoutValidOwner = properties.filter(property => {
      return !property.ownerId || !property.owner;
    });

    console.log(
      `📊 Encontradas ${propertiesWithoutValidOwner.length} propiedades sin owner válido`
    );

    if (propertiesWithoutValidOwner.length === 0) {
      console.log('✅ Todas las propiedades tienen owner válido');
      return;
    }

    // Mostrar las propiedades problemáticas
    console.log('\n❌ Propiedades sin owner válido:');
    propertiesWithoutValidOwner.forEach(property => {
      console.log(
        `  - ID: ${property.id}, Título: ${property.title}, ownerId: ${property.ownerId}`
      );
    });

    // Aquí podríamos implementar lógica para asignar owners por defecto o pedir intervención manual
    // Por ahora, solo reportamos el problema

    console.log(
      '\n⚠️  Estas propiedades necesitan ownerId válido asignado manualmente en la base de datos'
    );
  } catch (error) {
    console.error('❌ Error al verificar owners:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingOwners();
