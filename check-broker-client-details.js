const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBrokerClientDetails() {
  try {
    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
    });

    if (!broker) {
      console.log('❌ Corredor no encontrado');
      return;
    }

    const brokerClient = await prisma.brokerClient.findFirst({
      where: { brokerId: broker.id },
      include: {
        user: { select: { name: true } },
        managedProperties: {
          include: {
            property: { select: { title: true } },
          },
        },
      },
    });

    console.log('BrokerClient details:', {
      id: brokerClient.id,
      userName: brokerClient.user.name,
      managedPropertiesCount: brokerClient.managedProperties.length,
      managedProperties: brokerClient.managedProperties.map(mp => mp.property.title),
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrokerClientDetails();
