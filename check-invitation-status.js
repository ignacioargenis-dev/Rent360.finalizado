const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInvitationStatus() {
  try {
    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
    });

    if (!broker) {
      console.log('❌ Corredor no encontrado');
      return;
    }

    const invitations = await prisma.brokerInvitation.findMany({
      where: { brokerId: broker.id },
      select: {
        id: true,
        status: true,
        user: { select: { name: true } },
      },
    });

    console.log('Invitations status:', invitations);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvitationStatus();
