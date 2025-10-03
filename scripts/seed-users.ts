import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando siembra de usuarios...');

  // Hash de contraseñas (mínimo 8 caracteres para validación)
  const hashedPassword = await bcrypt.hash('12345678', 12);

  // Crear usuarios de prueba con datos completos y realistas
  const users = [
    {
      email: 'admin@rent360.cl',
      name: 'Carlos Rodríguez',
      password: hashedPassword,
      phone: '+56912345678',
      rut: '12.345.678-9',
      rutVerified: true,
      role: 'ADMIN',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      dateOfBirth: new Date('1985-03-15'),
      gender: 'M',
      address: 'Av. Providencia 1234',
      city: 'Santiago',
      commune: 'Providencia',
      region: 'Metropolitana',
      nationality: 'CHILE',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      lastLogin: new Date(),
    },
    {
      email: 'propietario@rent360.cl',
      name: 'María González',
      password: hashedPassword,
      phone: '+56987654321',
      rut: '15.678.901-2',
      rutVerified: true,
      role: 'OWNER',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      dateOfBirth: new Date('1978-07-22'),
      gender: 'F',
      address: 'Calle Las Condes 567',
      city: 'Santiago',
      commune: 'Las Condes',
      region: 'Metropolitana',
      nationality: 'CHILE',
      emergencyContact: 'Juan González',
      emergencyPhone: '+56911223344',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24), // Hace 1 día
    },
    {
      email: 'inquilino@rent360.cl',
      name: 'Pedro Sánchez',
      password: hashedPassword,
      phone: '+56955556666',
      rut: '18.901.234-5',
      rutVerified: true,
      role: 'TENANT',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      dateOfBirth: new Date('1992-11-08'),
      gender: 'M',
      address: 'Paseo Ñuñoa 890',
      city: 'Santiago',
      commune: 'Ñuñoa',
      region: 'Metropolitana',
      nationality: 'CHILE',
      emergencyContact: 'Ana Sánchez',
      emergencyPhone: '+56933445566',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tenant',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2), // Hace 2 horas
    },
    {
      email: 'corredor@rent360.cl',
      name: 'Ana Martínez',
      password: hashedPassword,
      phone: '+56977778888',
      rut: '21.234.567-8',
      rutVerified: true,
      role: 'BROKER',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      dateOfBirth: new Date('1982-05-30'),
      gender: 'F',
      address: 'Av. Apoquindo 1456',
      city: 'Santiago',
      commune: 'Las Condes',
      region: 'Metropolitana',
      nationality: 'CHILE',
      phoneSecondary: '+56999990000',
      emergencyContact: 'Roberto Martínez',
      emergencyPhone: '+56922334455',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=broker',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 12), // Hace 12 horas
    },
    {
      email: 'runner@rent360.cl',
      name: 'Diego López',
      password: hashedPassword,
      phone: '+56944443333',
      rut: '24.567.890-1',
      rutVerified: true,
      role: 'RUNNER',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      dateOfBirth: new Date('1995-09-12'),
      gender: 'M',
      address: 'Calle Macul 234',
      city: 'Santiago',
      commune: 'Macul',
      region: 'Metropolitana',
      nationality: 'CHILE',
      emergencyContact: 'Carmen López',
      emergencyPhone: '+56955667788',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=runner',
      lastLogin: new Date(Date.now() - 1000 * 60 * 30), // Hace 30 minutos
    },
    {
      email: 'soporte@rent360.cl',
      name: 'Soporte Rent360',
      password: hashedPassword,
      phone: '+56922221111',
      rut: '27.890.123-4',
      rutVerified: true,
      role: 'SUPPORT',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      dateOfBirth: new Date('1988-12-03'),
      gender: 'M',
      address: 'Oficina Central',
      city: 'Santiago',
      commune: 'Santiago Centro',
      region: 'Metropolitana',
      nationality: 'CHILE',
      phoneSecondary: '+56933332222',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=support',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 6), // Hace 6 horas
    },
    {
      email: 'proveedor@rent360.cl',
      name: 'ServicioExpress Ltda',
      password: hashedPassword,
      phone: '+56988887777',
      rut: '30.123.456-7',
      rutVerified: true,
      role: 'PROVIDER',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      dateOfBirth: new Date('1980-01-20'),
      gender: 'OTHER',
      address: 'Av. Libertador 789',
      city: 'Santiago',
      commune: 'Vitacura',
      region: 'Metropolitana',
      nationality: 'CHILE',
      phoneSecondary: '+56977776666',
      emergencyContact: 'María Silva',
      emergencyPhone: '+56966554433',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // Hace 2 días
    },
    {
      email: 'mantenimiento@rent360.cl',
      name: 'Mantención Total SpA',
      password: hashedPassword,
      phone: '+56966665555',
      rut: '33.456.789-0',
      rutVerified: true,
      role: 'MAINTENANCE',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      dateOfBirth: new Date('1975-06-14'),
      gender: 'M',
      address: 'Calle Mantención 456',
      city: 'Santiago',
      commune: 'La Florida',
      region: 'Metropolitana',
      nationality: 'CHILE',
      phoneSecondary: '+56955554444',
      emergencyContact: 'Patricia Morales',
      emergencyPhone: '+56977889900',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maintenance',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 8), // Hace 8 horas
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
            role: user.role as any,
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
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
