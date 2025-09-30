import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando siembra de usuarios...');

  // Hash de contraseñas (mínimo 8 caracteres para validación)
  const hashedPassword = await bcrypt.hash('12345678', 12);

  // Crear usuarios de prueba
  const users = [
    {
      email: 'admin@rent360.cl',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
    {
      email: 'propietario@rent360.cl',
      name: 'Propietario',
      password: hashedPassword,
      role: 'OWNER',
    },
    {
      email: 'inquilino@rent360.cl',
      name: 'Inquilino',
      password: hashedPassword,
      role: 'TENANT',
    },
    {
      email: 'corredor@rent360.cl',
      name: 'Corredor',
      password: hashedPassword,
      role: 'BROKER',
    },
    {
      email: 'runner@rent360.cl',
      name: 'Runner',
      password: hashedPassword,
      role: 'RUNNER',
    },
    {
      email: 'soporte@rent360.cl',
      name: 'Soporte',
      password: hashedPassword,
      role: 'SUPPORT',
    },
    {
      email: 'proveedor@rent360.cl',
      name: 'Proveedor de Servicios',
      password: hashedPassword,
      role: 'PROVIDER',
    },
    {
      email: 'mantenimiento@rent360.cl',
      name: 'Servicio de Mantenimiento',
      password: hashedPassword,
      role: 'MAINTENANCE',
    },
  ];

  for (const user of users) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            ...user,
            role: user.role as any
          },
        });
        console.log(`Usuario creado: ${user.email}`);
      } else {
        console.log(`Usuario ya existe: ${user.email}`);
      }
    } catch (error) {
      console.error(`Error al crear usuario ${user.email}:`, error);
    }
  }

  console.log('Siembra de usuarios completada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });