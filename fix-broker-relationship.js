const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBrokerRelationship() {
  try {
    console.log('🔧 ARREGLANDO RELACIÓN BROKER-CLIENT...\n');

    // 1. Encontrar el corredor y owner
    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
    });

    const owner = await prisma.user.findUnique({
      where: { email: 'ignacioargenis@gmail.com' },
    });

    if (!broker || !owner) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log(`👥 Broker: ${broker.name} (${broker.id})`);
    console.log(`🏠 Owner: ${owner.name} (${owner.id})`);

    // 2. Encontrar la invitación ACCEPTED
    const invitation = await prisma.brokerInvitation.findFirst({
      where: {
        brokerId: broker.id,
        userId: owner.id,
        status: 'ACCEPTED',
      },
    });

    if (!invitation) {
      console.log('❌ Invitación ACCEPTED no encontrada');
      return;
    }

    console.log(`📧 Invitación encontrada: ${invitation.id} (${invitation.status})`);

    // 3. Verificar si ya existe BrokerClient
    const existingBrokerClient = await prisma.brokerClient.findFirst({
      where: {
        brokerId: broker.id,
        userId: owner.id,
        status: 'ACTIVE',
      },
    });

    if (!existingBrokerClient) {
      console.log('❌ BrokerClient no encontrado');
      return;
    }

    console.log(`✅ BrokerClient encontrado: ${existingBrokerClient.id}`);

    // 4. Obtener propiedades del owner para gestión completa
    const ownerProperties = await prisma.property.findMany({
      where: { ownerId: owner.id },
      select: { id: true, title: true },
    });

    console.log(`🏠 Propiedades del owner: ${ownerProperties.length}`);
    ownerProperties.forEach((prop, i) => {
      console.log(`  ${i + 1}. ${prop.title} (${prop.id})`);
    });

    // 5. Crear brokerPropertyManagement records para todas las propiedades
    console.log('\n🔧 Creando brokerPropertyManagement records...');

    for (const property of ownerProperties) {
      // Verificar si ya existe
      const existing = await prisma.brokerPropertyManagement.findFirst({
        where: {
          brokerId: broker.id,
          clientId: existingBrokerClient.id,
          propertyId: property.id,
        },
      });

      if (existing) {
        console.log(`⚠️  Ya existe gestión para: ${property.title}`);
        continue;
      }

      // Crear el registro
      const newManagement = await prisma.brokerPropertyManagement.create({
        data: {
          brokerId: broker.id,
          clientId: existingBrokerClient.id,
          propertyId: property.id,
          managementType: 'full',
          services: invitation.servicesOffered || JSON.stringify([]),
          commissionRate: existingBrokerClient.commissionRate,
          exclusivity: false,
          status: 'ACTIVE',
          startDate: new Date(),
        },
      });

      console.log(`✅ Creado gestión para: ${property.title} (${newManagement.id})`);

      // Actualizar propiedad con brokerId
      await prisma.property.update({
        where: { id: property.id },
        data: {
          brokerId: broker.id,
          status: 'MANAGED',
        },
      });

      console.log(`✅ Actualizada propiedad: ${property.title} -> MANAGED`);
    }

    // 6. Actualizar métricas del BrokerClient
    const totalManaged = await prisma.brokerPropertyManagement.count({
      where: { clientId: existingBrokerClient.id },
    });

    await prisma.brokerClient.update({
      where: { id: existingBrokerClient.id },
      data: { totalPropertiesManaged: totalManaged },
    });

    console.log(
      `✅ Actualizadas métricas del BrokerClient: ${totalManaged} propiedades gestionadas`
    );

    // 8. Verificar resultados
    console.log('\n🔍 VERIFICANDO RESULTADOS...\n');

    const finalBrokerClient = await prisma.brokerClient.findUnique({
      where: { id: existingBrokerClient.id },
      include: {
        managedProperties: {
          include: {
            property: { select: { title: true, status: true } },
          },
        },
      },
    });

    console.log('BrokerClient final:', {
      id: finalBrokerClient.id,
      totalPropertiesManaged: finalBrokerClient.totalPropertiesManaged,
      managedProperties: finalBrokerClient.managedProperties.map(mp => ({
        title: mp.property.title,
        status: mp.property.status,
      })),
    });

    console.log('\n✅ PROCESO COMPLETADO EXITOSAMENTE!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBrokerRelationship();
