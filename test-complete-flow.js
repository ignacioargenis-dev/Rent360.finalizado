const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCompleteFlow() {
  try {
    console.log('🧪 PROBANDO FLUJO COMPLETO DE CAPTACIÓN DE CLIENTES\n');

    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
    });

    const owner = await prisma.user.findUnique({
      where: { email: 'ignacioargenis@gmail.com' },
    });

    if (!broker || !owner) {
      console.log('❌ Usuarios no encontrados');
      return;
    }

    console.log(`👥 Broker: ${broker.name} (${broker.id})`);
    console.log(`🏠 Owner: ${owner.name} (${owner.id})\n`);

    // PASO 1: Verificar invitación enviada
    console.log('📧 PASO 1: Verificando invitación enviada...');
    const invitation = await prisma.brokerInvitation.findFirst({
      where: { brokerId: broker.id, userId: owner.id },
    });

    if (!invitation) {
      console.log('❌ No hay invitación enviada');
      return;
    }

    console.log(`✅ Invitación encontrada: ${invitation.id} (${invitation.status})`);

    // PASO 2: Simular aceptación de invitación
    console.log('\n🤝 PASO 2: Simulando aceptación de invitación...');
    const acceptResult = await prisma.brokerInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });
    console.log(`✅ Invitación aceptada: ${acceptResult.status}`);

    // Crear prospect si no existe
    let prospect = await prisma.brokerProspect.findFirst({
      where: { brokerId: broker.id, userId: owner.id },
    });

    if (!prospect) {
      prospect = await prisma.brokerProspect.create({
        data: {
          brokerId: broker.id,
          userId: owner.id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          status: 'QUALIFIED',
          priority: 'high',
          source: 'invitation',
          tags: JSON.stringify(['invitation_accepted']),
          lastContactDate: new Date(),
        },
      });
      console.log(`✅ Prospect creado: ${prospect.id}`);
    } else {
      prospect = await prisma.brokerProspect.update({
        where: { id: prospect.id },
        data: {
          status: 'QUALIFIED',
          tags: JSON.stringify(['invitation_accepted']),
        },
      });
      console.log(`✅ Prospect actualizado: ${prospect.id} (${prospect.status})`);
    }

    // PASO 3: Simular selección de UNA propiedad
    console.log('\n🏠 PASO 3: Simulando selección de UNA propiedad...');

    const ownerProperties = await prisma.property.findMany({
      where: { ownerId: owner.id, status: 'AVAILABLE' },
    });

    console.log(`📋 Propiedades disponibles del owner: ${ownerProperties.length}`);
    ownerProperties.forEach((prop, i) => {
      console.log(`  ${i + 1}. ${prop.title} (${prop.status})`);
    });

    if (ownerProperties.length === 0) {
      console.log('❌ No hay propiedades disponibles');
      return;
    }

    // Seleccionar solo la primera propiedad
    const selectedProperty = ownerProperties[0];
    const selectedPropertyIds = [selectedProperty.id];

    console.log(`🎯 Seleccionada 1 propiedad: ${selectedProperty.title}`);

    // PASO 4: Simular complete-setup con gestión parcial
    console.log('\n⚙️ PASO 4: Ejecutando complete-setup con gestión parcial...');

    // Crear BrokerClient
    const brokerClient = await prisma.brokerClient.create({
      data: {
        brokerId: broker.id,
        userId: owner.id,
        prospectId: prospect.id,
        clientType: 'OWNER',
        status: 'ACTIVE',
        relationshipType: 'standard',
        servicesOffered: invitation.servicesOffered,
        commissionRate: invitation.proposedRate || 5.0,
        exclusiveAgreement: false,
        propertyManagementType: 'partial', // Gestión parcial
        managedPropertyIds: JSON.stringify(selectedPropertyIds),
        startDate: new Date(),
        lastInteraction: new Date(),
        notes: `Relación establecida desde invitación aceptada. ${invitation.servicesOffered ? `Servicios: ${invitation.servicesOffered}` : ''}`,
      },
    });

    console.log(
      `✅ BrokerClient creado: ${brokerClient.id} (tipo: ${brokerClient.propertyManagementType})`
    );

    // Crear brokerPropertyManagement para la propiedad seleccionada
    for (const propertyId of selectedPropertyIds) {
      const management = await prisma.brokerPropertyManagement.create({
        data: {
          brokerId: broker.id,
          clientId: brokerClient.id,
          propertyId: propertyId,
          managementType: 'full',
          services: invitation.servicesOffered || JSON.stringify([]),
          commissionRate: brokerClient.commissionRate,
          exclusivity: false,
          status: 'ACTIVE',
          startDate: new Date(),
        },
      });

      console.log(`✅ Gestión creada para: ${selectedProperty.title} (${management.id})`);

      // Actualizar propiedad
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          brokerId: broker.id,
          status: 'MANAGED',
        },
      });
      console.log(`✅ Propiedad actualizada: ${selectedProperty.title} -> MANAGED`);
    }

    // Actualizar métricas
    await prisma.brokerClient.update({
      where: { id: brokerClient.id },
      data: { totalPropertiesManaged: selectedPropertyIds.length },
    });

    // Actualizar prospect
    await prisma.brokerProspect.update({
      where: { id: prospect.id },
      data: {
        status: 'CONVERTED',
        notes: `${prospect.notes || ''}\n\n✅ Convertido a cliente activo - ${new Date().toISOString()}`,
      },
    });

    console.log(`✅ Prospect convertido: ${prospect.id} -> CONVERTED`);

    // PASO 5: Verificar resultados finales
    console.log('\n🔍 PASO 5: Verificando resultados finales...\n');

    // Verificar BrokerClient
    const finalBrokerClient = await prisma.brokerClient.findUnique({
      where: { id: brokerClient.id },
      include: {
        managedProperties: {
          include: {
            property: { select: { title: true, status: true } },
          },
        },
      },
    });

    console.log('📊 BrokerClient final:');
    console.log(`  - ID: ${finalBrokerClient.id}`);
    console.log(`  - Tipo gestión: ${finalBrokerClient.propertyManagementType}`);
    console.log(`  - Propiedades gestionadas: ${finalBrokerClient.managedProperties.length}`);
    finalBrokerClient.managedProperties.forEach((mp, i) => {
      console.log(`    ${i + 1}. ${mp.property.title} (${mp.property.status})`);
    });

    // Verificar propiedades del owner
    const finalOwnerProperties = await prisma.property.findMany({
      where: { ownerId: owner.id },
      select: { id: true, title: true, status: true, brokerId: true },
    });

    console.log('\n🏠 Propiedades del Owner final:');
    finalOwnerProperties.forEach((prop, i) => {
      console.log(
        `  ${i + 1}. ${prop.title} (${prop.status}) - Broker: ${prop.brokerId ? 'ASIGNADO' : 'SIN BROKER'}`
      );
    });

    // Verificar propiedades del broker (API simulation)
    console.log('\n🏢 Propiedades que debería ver el corredor:');

    const managedProps = await prisma.brokerPropertyManagement.findMany({
      where: { brokerId: broker.id, status: 'ACTIVE' },
      include: { property: { include: { owner: { select: { name: true } } } } },
    });

    console.log(`  - Gestionadas: ${managedProps.length}`);
    managedProps.forEach((mp, i) => {
      console.log(`    ${i + 1}. ${mp.property.title} (Dueño: ${mp.property.owner.name})`);
    });

    const ownProps = await prisma.property.findMany({
      where: { ownerId: broker.id },
    });

    console.log(`  - Propias: ${ownProps.length}`);
    ownProps.forEach((prop, i) => {
      console.log(`    ${i + 1}. ${prop.title}`);
    });

    console.log(`\n📈 Total propiedades para corredor: ${managedProps.length + ownProps.length}`);

    console.log('\n✅ FLUJO COMPLETADO EXITOSAMENTE!');
    console.log('\n📋 RESUMEN:');
    console.log(
      `  - Owner tiene ${finalOwnerProperties.filter(p => p.status === 'MANAGED').length} propiedades MANAGED`
    );
    console.log(
      `  - Owner tiene ${finalOwnerProperties.filter(p => p.status === 'AVAILABLE').length} propiedades AVAILABLE`
    );
    console.log(`  - Broker gestiona ${managedProps.length} propiedades`);
    console.log(`  - BrokerClient ID para navegación: ${brokerClient.id}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteFlow();
