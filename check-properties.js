const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProperties() {
  try {
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        brokerId: true,
        ownerId: true,
        createdAt: true,
      },
    });

    console.log('Total properties:', properties.length);
    properties.forEach(p => {
      console.log(
        `Property ${p.id}: title='${p.title}', brokerId='${p.brokerId}', ownerId='${p.ownerId}'`
      );
    });

    // Check brokers
    const brokers = await prisma.user.findMany({
      where: { role: 'BROKER' },
      select: { id: true, name: true, email: true },
    });

    console.log('\nBrokers:');
    brokers.forEach(b => {
      console.log(`Broker ${b.id}: ${b.name} (${b.email})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProperties();
