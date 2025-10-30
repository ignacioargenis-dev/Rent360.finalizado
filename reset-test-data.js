const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetTestData() {
  try {
    console.log('🔄 RESETEANDO DATOS DE PRUEBA...\n');

    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
    });

    const owner = await prisma.user.findUnique({
      where: { email: 'ignacioargenis@gmail.com' },
    });

    if (!broker || !owner) {
      console.log('❌ Usuarios no encontrados');
      return;
    }

    // 1. Eliminar relaciones BrokerClient
    const deletedClients = await prisma.brokerClient.deleteMany({
      where: { brokerId: broker.id, userId: owner.id },
    });
    console.log(`✅ Eliminadas ${deletedClients.count} relaciones BrokerClient`);

    // 2. Eliminar registros brokerPropertyManagement
    const deletedManagement = await prisma.brokerPropertyManagement.deleteMany({
      where: { brokerId: broker.id },
    });
    console.log(`✅ Eliminados ${deletedManagement.count} registros brokerPropertyManagement`);

    // 3. Resetear status de propiedades
    const resetProperties = await prisma.property.updateMany({
      where: {
        OR: [
          { brokerId: broker.id },
          { title: { contains: 'propiedad' } }, // Resetear las propiedades de prueba
        ],
      },
      data: {
        brokerId: null,
        status: 'AVAILABLE',
      },
    });
    console.log(`✅ Reseteadas ${resetProperties.count} propiedades`);

    // 4. Resetear prospects
    const resetProspects = await prisma.brokerProspect.updateMany({
      where: { brokerId: broker.id, userId: owner.id },
      data: {
        status: 'CONTACTED',
        convertedAt: null,
        convertedToClientId: null,
        notes: 'Prospect reseteado para pruebas',
      },
    });
    console.log(`✅ Reseteados ${resetProspects.count} prospects`);

    // 5. Resetear invitaciones
    const resetInvitations = await prisma.brokerInvitation.updateMany({
      where: { brokerId: broker.id, userId: owner.id },
      data: { status: 'SENT' },
    });
    console.log(`✅ Reseteadas ${resetInvitations.count} invitaciones`);

    console.log('\n✅ RESET COMPLETADO - Los datos están listos para una nueva prueba');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestData();
