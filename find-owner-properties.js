const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findOwnerProperties() {
  try {
    const owner = await prisma.user.findUnique({
      where: { email: 'ignacioargenis@gmail.com' },
    });

    if (!owner) {
      console.log('❌ Owner no encontrado');
      return;
    }

    const properties = await prisma.property.findMany({
      where: { ownerId: owner.id },
      select: {
        id: true,
        title: true,
        status: true,
        brokerId: true,
      },
    });

    console.log('Owner properties:', properties);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findOwnerProperties();
