import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Actualizando contraseñas de usuarios...');

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash('123456', 12);

  // Usuarios a actualizar
  const users = [
    'admin@rent360.cl',
    'propietario@rent360.cl',
    'inquilino@rent360.cl',
    'corredor@rent360.cl',
    'runner@rent360.cl',
    'soporte@rent360.cl',
  ];

  for (const email of users) {
    try {
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
      console.log(`Contraseña actualizada para: ${email}`);
    } catch (error) {
      console.error(`Error al actualizar contraseña para ${email}:`, error);
    }
  }

  console.log('Actualización de contraseñas completada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });