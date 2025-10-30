const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testClientDetails() {
  try {
    const brokerClientId = 'cmhdw0x0y0001jlr1eeui1c21';

    console.log('Testing client details API for BrokerClient ID:', brokerClientId);

    const brokerClient = await prisma.brokerClient.findUnique({
      where: { id: brokerClientId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true, role: true },
        },
        managedProperties: {
          include: {
            property: {
              select: { id: true, title: true, address: true, status: true, images: true },
            },
          },
        },
      },
    });

    if (!brokerClient) {
      console.log('❌ BrokerClient not found');
      return;
    }

    console.log('✅ BrokerClient found:');
    console.log('  - ID:', brokerClient.id);
    console.log('  - User:', brokerClient.user.name, '(' + brokerClient.user.id + ')');
    console.log('  - Managed Properties:', brokerClient.managedProperties.length);

    brokerClient.managedProperties.forEach((mp, i) => {
      console.log(`    ${i + 1}. ${mp.property.title}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testClientDetails();
