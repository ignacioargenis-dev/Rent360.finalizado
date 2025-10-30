const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyze() {
  try {
    console.log('🔍 ANALIZANDO SISTEMA DE CORREDORES...\n');

    // 1. Encontrar el corredor
    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
    });

    if (!broker) {
      console.log('❌ Corredor no encontrado');
      return;
    }

    console.log('👤 CORREDOR:', broker.name, '(' + broker.id + ')');

    // 2. Ver clientes activos del corredor
    const brokerClients = await prisma.brokerClient.findMany({
      where: { brokerId: broker.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        managedProperties: {
          include: {
            property: {
              select: { id: true, title: true, status: true },
            },
          },
        },
      },
    });

    console.log('\n📊 RELACIONES BROKER-CLIENT:');
    console.log('Total:', brokerClients.length);
    brokerClients.forEach((bc, i) => {
      console.log(`  ${i + 1}. ${bc.user.name} - Status: ${bc.status}`);
      console.log(
        `     Propiedades gestionadas: ${bc.managedPropertyIds ? JSON.parse(bc.managedPropertyIds).length : 0}`
      );
      if (bc.managedProperties.length > 0) {
        console.log('     Propiedades actuales:');
        bc.managedProperties.forEach((mp, j) => {
          console.log(`       - ${mp.property.title} (${mp.property.status})`);
        });
      }
    });

    // 3. Ver propiedades del corredor
    // Primero propiedades propias
    const ownProperties = await prisma.property.findMany({
      where: { ownerId: broker.id },
      select: { id: true, title: true, status: true },
    });

    // Después propiedades gestionadas a través de brokerPropertyManagement
    const managedProperties = await prisma.brokerPropertyManagement.findMany({
      where: { brokerId: broker.id },
      include: {
        property: {
          include: {
            owner: { select: { name: true } },
          },
        },
      },
    });

    console.log('\n🏠 PROPIEDADES DEL CORREDOR:');
    console.log('Propias:', ownProperties.length);
    ownProperties.forEach((prop, i) => {
      console.log(`  Propia ${i + 1}. ${prop.title} (${prop.status})`);
    });

    console.log('Gestionadas:', managedProperties.length);
    managedProperties.forEach((mp, i) => {
      console.log(
        `  Gestionada ${i + 1}. ${mp.property.title} (${mp.property.status}) - Dueño: ${mp.property.owner.name}`
      );
    });

    // 4. Ver prospects del corredor
    const prospects = await prisma.brokerProspect.findMany({
      where: { brokerId: broker.id },
      include: {
        user: { select: { name: true } },
      },
    });

    console.log('\n👥 PROSPECTS DEL CORREDOR:');
    console.log('Total:', prospects.length);
    prospects.forEach((prospect, i) => {
      console.log(`  ${i + 1}. ${prospect.name} (${prospect.status}) - ${prospect.user?.name}`);
    });

    // 5. Ver invitaciones enviadas por el corredor
    const sentInvitations = await prisma.brokerInvitation.findMany({
      where: { brokerId: broker.id },
      include: {
        user: { select: { name: true } },
      },
    });

    console.log('\n📧 INVITACIONES ENVIADAS:');
    console.log('Total:', sentInvitations.length);
    sentInvitations.forEach((inv, i) => {
      console.log(`  ${i + 1}. Para ${inv.user.name} - Status: ${inv.status}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyze();
