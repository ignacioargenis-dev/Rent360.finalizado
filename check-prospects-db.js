const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProspects() {
  try {
    console.log('🔍 Verificando prospects en la base de datos...');

    // Contar usuarios con roles OWNER y TENANT
    const ownerCount = await prisma.user.count({
      where: { role: 'OWNER', isActive: true },
    });

    const tenantCount = await prisma.user.count({
      where: { role: 'TENANT', isActive: true },
    });

    const brokerCount = await prisma.user.count({
      where: { role: 'BROKER', isActive: true },
    });

    console.log('📊 Usuarios por rol:');
    console.log('  OWNER:', ownerCount);
    console.log('  TENANT:', tenantCount);
    console.log('  BROKER:', brokerCount);

    // Obtener algunos usuarios OWNER y TENANT como ejemplo
    const owners = await prisma.user.findMany({
      where: { role: 'OWNER', isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            properties: true,
            contractsAsOwner: true,
          },
        },
      },
      take: 3,
    });

    const tenants = await prisma.user.findMany({
      where: { role: 'TENANT', isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            contractsAsTenant: true,
          },
        },
      },
      take: 3,
    });

    console.log('\n👥 Usuarios OWNER (prospects potenciales):');
    owners.forEach(user => {
      console.log(
        '  -',
        user.name,
        '(',
        user.email,
        ') - Propiedades:',
        user._count.properties,
        '- Contratos:',
        user._count.contractsAsOwner
      );
    });

    console.log('\n👤 Usuarios TENANT (prospects potenciales):');
    tenants.forEach(user => {
      console.log(
        '  -',
        user.name,
        '(',
        user.email,
        ') - Contratos:',
        user._count.contractsAsTenant
      );
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

checkProspects();
