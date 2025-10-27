const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugQuery() {
  try {
    const brokerId = 'cmh930hua0000nb2zg1b12r60';

    // Verificar si la propiedad existe con este brokerId
    const count = await prisma.property.count({
      where: { brokerId: brokerId },
    });

    console.log('Count result:', count);

    // Verificar las propiedades encontradas
    const properties = await prisma.property.findMany({
      where: { brokerId: brokerId },
      select: { id: true, title: true, brokerId: true },
    });

    console.log('Properties found:', properties);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugQuery();
