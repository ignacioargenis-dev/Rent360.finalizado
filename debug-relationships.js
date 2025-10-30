const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBrokerClientRelationship() {
  try {
    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
    });

    if (!broker) {
      console.log('❌ Corredor no encontrado');
      return;
    }

    // Ver relaciones BrokerClient activas
    const brokerClients = await prisma.brokerClient.findMany({
      where: {
        brokerId: broker.id,
        status: 'ACTIVE',
      },
      include: {
        user: { select: { id: true, name: true } },
        managedProperties: {
          include: {
            property: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    console.log('BrokerClient Relationships:');
    brokerClients.forEach((bc, i) => {
      console.log(
        `  ${i + 1}. ID: ${bc.id}, User: ${bc.user.name} (${bc.userId}), Properties: ${bc.managedProperties.length}`
      );
      bc.managedProperties.forEach((mp, j) => {
        console.log(`     - ${mp.property.title} (${mp.property.status})`);
      });
    });

    // Ver propiedades con brokerId asignado
    const propertiesWithBroker = await prisma.property.findMany({
      where: { brokerId: broker.id },
      select: { id: true, title: true, status: true, ownerId: true },
    });

    console.log('\nProperties with brokerId:');
    propertiesWithBroker.forEach((prop, i) => {
      console.log(`  ${i + 1}. ${prop.title} (${prop.status})`);
    });

    // Ver propiedades del corredor (propias)
    const ownProperties = await prisma.property.findMany({
      where: { ownerId: broker.id },
      select: { id: true, title: true, status: true },
    });

    console.log('\nOwn Properties:');
    ownProperties.forEach((prop, i) => {
      console.log(`  ${i + 1}. ${prop.title} (${prop.status})`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrokerClientRelationship();
