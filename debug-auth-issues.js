const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBrokerAuth() {
  try {
    // Verificar si el corredor existe y tiene rol BROKER
    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
      select: { id: true, name: true, email: true, role: true },
    });

    console.log('👤 Broker user:', broker);

    if (!broker || broker.role !== 'BROKER') {
      console.log('❌ Broker not found or wrong role');
      return;
    }

    // Verificar BrokerClient específico
    const brokerClientId = 'cmhdw0x0y0001jlr1eeui1c21';
    const brokerClient = await prisma.brokerClient.findUnique({
      where: { id: brokerClientId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        managedProperties: {
          include: {
            property: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    console.log('\n📋 BrokerClient details:');
    if (brokerClient) {
      console.log('  - ID:', brokerClient.id);
      console.log('  - Broker ID:', brokerClient.brokerId);
      console.log('  - User ID:', brokerClient.userId);
      console.log('  - User:', brokerClient.user.name);
      console.log('  - Status:', brokerClient.status);
      console.log('  - Managed Properties:', brokerClient.managedProperties.length);

      // Verificar que el brokerId del BrokerClient coincide con el broker actual
      const isOwner = brokerClient.brokerId === broker.id;
      console.log('  - Broker is owner:', isOwner);
    } else {
      console.log('  ❌ BrokerClient not found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrokerAuth();
