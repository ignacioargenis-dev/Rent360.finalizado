const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    // Buscar todas las invitaciones del usuario ignacioargenis@gmail.com
    const user = await prisma.user.findUnique({
      where: { email: 'ignacioargenis@gmail.com' },
    });

    if (!user) {
      console.log('Usuario no encontrado');
      return;
    }

    console.log('Usuario encontrado:', user.id, user.name);

    // Eliminar invitaciones del usuario
    const deletedInvitations = await prisma.brokerInvitation.deleteMany({
      where: { userId: user.id },
    });

    console.log('Invitaciones eliminadas:', deletedInvitations.count);

    // También eliminar prospects relacionados
    const deletedProspects = await prisma.brokerProspect.deleteMany({
      where: { userId: user.id },
    });

    console.log('Prospects eliminados:', deletedProspects.count);

    // Verificar que no queden invitaciones
    const remainingInvitations = await prisma.brokerInvitation.findMany({
      where: { userId: user.id },
    });

    console.log('Invitaciones restantes:', remainingInvitations.length);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
