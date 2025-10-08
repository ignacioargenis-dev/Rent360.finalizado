import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando prestadores de mantenimiento de ejemplo...');

  // Crear usuarios para prestadores
  const providerUsers = [
    {
      name: 'Carlos Electricista SPA',
      email: 'carlos.electricista@example.com',
      phone: '+56912345678',
      rut: '12.345.678-9',
      password: await hash('password123', 12),
      role: 'MAINTENANCE_PROVIDER' as const,
    },
    {
      name: 'María Plomería Express',
      email: 'maria.plomeria@example.com',
      phone: '+56987654321',
      rut: '98.765.432-1',
      password: await hash('password123', 12),
      role: 'MAINTENANCE_PROVIDER' as const,
    },
    {
      name: 'Pedro Carpintería Plus',
      email: 'pedro.carpinteria@example.com',
      phone: '+56955556666',
      rut: '55.556.667-8',
      password: await hash('password123', 12),
      role: 'MAINTENANCE_PROVIDER' as const,
    },
    {
      name: 'Ana Pintura Profesional',
      email: 'ana.pintura@example.com',
      phone: '+56944447777',
      rut: '44.447.778-9',
      password: await hash('password123', 12),
      role: 'MAINTENANCE_PROVIDER' as const,
    },
  ];

  const createdUsers = [];

  for (const userData of providerUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    createdUsers.push(user);
  }

  // Crear prestadores de mantenimiento
  const providers = [
    {
      userId: createdUsers[0].id,
      businessName: 'Carlos Electricista SPA',
      rut: '12.345.678-9',
      specialty: 'Electricidad',
      specialties: JSON.stringify(['electricidad', 'instalaciones', 'reparaciones_electricas']),
      hourlyRate: 25000,
      rating: 4.8,
      totalRatings: 45,
      completedJobs: 120,
      totalEarnings: 3000000,
      status: 'ACTIVE',
      isVerified: true,
      responseTime: 2.5,
      address: 'Av. Providencia 1234',
      city: 'Santiago',
      region: 'Metropolitana',
      description:
        'Especialistas en instalaciones eléctricas residenciales y comerciales. Más de 15 años de experiencia.',
      availability: JSON.stringify({
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '09:00', end: '14:00' },
      }),
    },
    {
      userId: createdUsers[1].id,
      businessName: 'María Plomería Express',
      rut: '98.765.432-1',
      specialty: 'Plomería',
      specialties: JSON.stringify(['plomeria', 'instalaciones_sanitarias', 'reparaciones_agua']),
      hourlyRate: 22000,
      rating: 4.6,
      totalRatings: 38,
      completedJobs: 95,
      totalEarnings: 2090000,
      status: 'ACTIVE',
      isVerified: true,
      responseTime: 1.8,
      address: 'Calle Los Leones 567',
      city: 'Santiago',
      region: 'Metropolitana',
      description:
        'Servicio rápido de plomería. Solucionamos emergencias y realizamos instalaciones completas.',
      availability: JSON.stringify({
        monday: { start: '07:00', end: '19:00' },
        tuesday: { start: '07:00', end: '19:00' },
        wednesday: { start: '07:00', end: '19:00' },
        thursday: { start: '07:00', end: '19:00' },
        friday: { start: '07:00', end: '19:00' },
        saturday: { start: '08:00', end: '16:00' },
        sunday: { start: '09:00', end: '12:00' },
      }),
    },
    {
      userId: createdUsers[2].id,
      businessName: 'Pedro Carpintería Plus',
      rut: '55.556.667-8',
      specialty: 'Carpintería',
      specialties: JSON.stringify([
        'carpinteria',
        'muebles',
        'reparaciones_madera',
        'instalaciones',
      ]),
      hourlyRate: 28000,
      rating: 4.9,
      totalRatings: 52,
      completedJobs: 78,
      totalEarnings: 2184000,
      status: 'ACTIVE',
      isVerified: true,
      responseTime: 3.2,
      address: 'Pasaje Santa Rosa 890',
      city: 'Providencia',
      region: 'Metropolitana',
      description:
        'Trabajos finos en madera. Fabricación de muebles a medida y reparaciones especializadas.',
      availability: JSON.stringify({
        monday: { start: '08:30', end: '17:30' },
        tuesday: { start: '08:30', end: '17:30' },
        wednesday: { start: '08:30', end: '17:30' },
        thursday: { start: '08:30', end: '17:30' },
        friday: { start: '08:30', end: '17:30' },
      }),
    },
    {
      userId: createdUsers[3].id,
      businessName: 'Ana Pintura Profesional',
      rut: '44.447.778-9',
      specialty: 'Pintura',
      specialties: JSON.stringify(['pintura', 'acabados', 'reparaciones_superficiales']),
      hourlyRate: 20000,
      rating: 4.7,
      totalRatings: 29,
      completedJobs: 67,
      totalEarnings: 1340000,
      status: 'ACTIVE',
      isVerified: true,
      responseTime: 2.1,
      address: 'Av. La Chascona 234',
      city: 'Las Condes',
      region: 'Metropolitana',
      description:
        'Pintores profesionales con amplia experiencia en interiores y exteriores. Materiales de primera calidad.',
      availability: JSON.stringify({
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '09:00', end: '15:00' },
      }),
    },
  ];

  for (const providerData of providers) {
    await prisma.maintenanceProvider.upsert({
      where: { userId: providerData.userId },
      update: {},
      create: providerData,
    });
  }

  console.log('✅ Prestadores de mantenimiento creados exitosamente!');
  console.log(`📊 Total de prestadores creados: ${providers.length}`);
  console.log('🏢 Servicios disponibles: Electricidad, Plomería, Carpintería, Pintura');
}

main()
  .catch(e => {
    console.error('❌ Error creando prestadores:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
