const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log('🔍 Buscando relaciones corruptas...');

    // Buscar la relación BrokerClient corrupta
    const corrupted = await prisma.brokerClient.findFirst({
      where: {
        userId: 'cmhccw0di00005c4wmk8ai086',
        brokerId: 'cmhcdc6ix0002ha27d133q2ty',
      },
    });

    if (corrupted) {
      console.log('🗑️ Eliminando relación corrupta:', corrupted.id);
      await prisma.brokerClient.delete({
        where: { id: corrupted.id },
      });
      console.log('✅ Relación corrupta eliminada');
    } else {
      console.log('ℹ️ No se encontró relación corrupta');
    }

    // Verificar que no queden relaciones
    const remaining = await prisma.brokerClient.findMany({
      where: {
        userId: 'cmhccw0di00005c4wmk8ai086',
      },
    });

    console.log('📊 Relaciones restantes para el usuario:', remaining.length);

    // Verificar invitaciones pendientes
    const pendingInvitations = await prisma.brokerInvitation.findMany({
      where: {
        userId: 'cmhccw0di00005c4wmk8ai086',
        status: 'SENT',
      },
    });

    console.log('📧 Invitaciones pendientes:', pendingInvitations.length);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
