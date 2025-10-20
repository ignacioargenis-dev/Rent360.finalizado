const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProperty() {
  try {
    const property = await prisma.property.findUnique({
      where: { id: 'cmgso8wv00003p5qwva17zrmn' },
      select: { images: true, title: true },
    });

    console.log('Property:', property?.title);
    console.log('Images:', property?.images);

    if (property?.images) {
      const images = Array.isArray(property.images) ? property.images : JSON.parse(property.images);
      console.log('Parsed images:', images);
      console.log('Number of images:', images.length);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProperty();
