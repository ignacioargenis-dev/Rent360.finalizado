const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBrokerClientId() {
  try {
    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
    });

    if (!broker) {
      console.log('❌ Corredor no encontrado');
      return;
    }

    const brokerClients = await prisma.brokerClient.findMany({
      where: { brokerId: broker.id },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    console.log('BrokerClient IDs:', brokerClients);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrokerClientId();
