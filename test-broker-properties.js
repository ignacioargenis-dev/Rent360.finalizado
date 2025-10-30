const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBrokerPropertiesAPI() {
  try {
    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
    });

    if (!broker) {
      console.log('❌ Corredor no encontrado');
      return;
    }

    console.log('Broker ID:', broker.id);

    // Simular la query de la API broker/properties
    const managedPropertyRecords = await prisma.brokerPropertyManagement.findMany({
      where: {
        brokerId: broker.id,
        status: 'ACTIVE',
      },
      include: {
        property: {
          include: {
            owner: { select: { id: true, name: true } },
            contracts: {
              where: { status: 'ACTIVE' },
              include: {
                tenant: { select: { id: true, name: true, email: true, phone: true } },
              },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    console.log('Managed Properties Records:', managedPropertyRecords.length);
    managedPropertyRecords.forEach((record, i) => {
      console.log(`  ${i + 1}. ${record.property.title} (Owner: ${record.property.owner.name})`);
    });

    // Propiedades propias
    const ownProperties = await prisma.property.findMany({
      where: { ownerId: broker.id },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: { select: { id: true, name: true, email: true, phone: true } },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Own Properties:', ownProperties.length);
    ownProperties.forEach((prop, i) => {
      console.log(`  ${i + 1}. ${prop.title} (Owner: ${prop.owner.name})`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBrokerPropertiesAPI();
