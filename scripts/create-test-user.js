const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Usuario de Prueba',
        role: 'TENANT',
        isActive: true,
        emailVerified: true,
      },
    });
    
    console.log('Test user created successfully:', user);
    
    // Create a test property
    const property = await prisma.property.create({
      data: {
        title: 'Departamento de prueba en Las Condes',
        description: 'Hermoso departamento amoblado con excelente ubicación. Cercano a metro y servicios.',
        address: 'Av. Presidente Kennedy 5410',
        city: 'Las Condes',
        commune: 'Las Condes',
        region: 'Metropolitana',
        price: 350000,
        deposit: 175000,
        bedrooms: 2,
        bathrooms: 1,
        area: 65,
        status: 'AVAILABLE',
        type: 'APARTMENT',
        features: JSON.stringify(['Amoblado', 'Estacionamiento', 'Gimnasio', 'Piscina']),
        images: JSON.stringify(['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80']),
        ownerId: user.id,
      },
    });
    
    console.log('Test property created successfully:', property);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();