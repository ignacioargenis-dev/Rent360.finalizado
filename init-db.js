const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Inicializando base de datos...');

  // Crear usuario admin de prueba
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@rent360.cl' },
    update: {},
    create: {
      name: 'Administrador Rent360',
      email: 'admin@rent360.cl',
      password: await bcrypt.hash('admin123', 12),
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date(),
      rut: '12345678-9',
      phone: '+56912345678',
    },
  });

  // Crear usuario propietario de prueba
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@rent360.cl' },
    update: {},
    create: {
      name: 'Propietario Prueba',
      email: 'owner@rent360.cl',
      password: await bcrypt.hash('owner123', 12),
      role: 'OWNER',
      isActive: true,
      emailVerified: new Date(),
      rut: '98765432-1',
      phone: '+56987654321',
    },
  });

  // Crear usuario inquilino de prueba
  const tenantUser = await prisma.user.upsert({
    where: { email: 'tenant@rent360.cl' },
    update: {},
    create: {
      name: 'Inquilino Prueba',
      email: 'tenant@rent360.cl',
      password: await bcrypt.hash('tenant123', 12),
      role: 'TENANT',
      isActive: true,
      emailVerified: new Date(),
      rut: '11223344-5',
      phone: '+56911223344',
    },
  });

  // Crear propiedad de prueba
  const property = await prisma.property.upsert({
    where: { id: 'prop-1' },
    update: {},
    create: {
      id: 'prop-1',
      title: 'Departamento Las Condes',
      description: 'Hermoso departamento de 3 dormitorios en Las Condes, completamente amoblado y con estacionamiento.',
      address: 'Avenida Apoquindo 1234',
      city: 'Santiago',
      commune: 'Las Condes',
      region: 'Metropolitana',
      price: 850000,
      deposit: 850000,
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      type: 'APARTMENT',
      status: 'AVAILABLE',
      ownerId: ownerUser.id,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop'
      ]),
      features: JSON.stringify([
        'Estacionamiento',
        'Conserje 24/7',
        'Gimnasio',
        'Piscina',
        'Área de juegos',
        'Acceso controlado'
      ]),
    },
  });

  console.log('✅ Base de datos inicializada correctamente');
  console.log('Usuarios creados:');
  console.log('- Admin: admin@rent360.cl / admin123');
  console.log('- Owner: owner@rent360.cl / owner123');
  console.log('- Tenant: tenant@rent360.cl / tenant123');
  console.log('Propiedades creadas: 1');
}

main()
  .catch((e) => {
    console.error('❌ Error inicializando base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
