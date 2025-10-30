const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentState() {
  try {
    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
    });

    if (!broker) {
      console.log('❌ Corredor no encontrado');
      return;
    }

    console.log('👤 Broker:', broker.name, '(' + broker.id + ')');

    // Ver BrokerClients activos
    const brokerClients = await prisma.brokerClient.findMany({
      where: { brokerId: broker.id, status: 'ACTIVE' },
      include: {
        user: { select: { name: true } },
        managedProperties: {
          include: {
            property: { select: { title: true, status: true } },
          },
        },
      },
    });

    console.log('\n📊 BrokerClients activos:', brokerClients.length);
    brokerClients.forEach((bc, i) => {
      console.log(
        `  ${i + 1}. ID: ${bc.id}, User: ${bc.user.name}, Properties: ${bc.managedProperties.length}`
      );
      bc.managedProperties.forEach((mp, j) => {
        console.log(`     - ${mp.property.title} (${mp.property.status})`);
      });
    });

    // Ver propiedades con brokerId
    const propertiesWithBroker = await prisma.property.findMany({
      where: { brokerId: broker.id },
      select: { id: true, title: true, status: true },
    });

    console.log('\n🏠 Propiedades con brokerId asignado:', propertiesWithBroker.length);
    propertiesWithBroker.forEach((prop, i) => {
      console.log(`  ${i + 1}. ${prop.title} (${prop.status})`);
    });

    // Ver propiedades gestionadas
    const managedProperties = await prisma.brokerPropertyManagement.findMany({
      where: { brokerId: broker.id, status: 'ACTIVE' },
      include: {
        property: { select: { title: true, status: true } },
      },
    });

    console.log('\n🔗 Propiedades gestionadas:', managedProperties.length);
    managedProperties.forEach((mp, i) => {
      console.log(
        `  ${i + 1}. ${mp.property.title} (${mp.property.status}) - ID gestión: ${mp.id}`
      );
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentState();
