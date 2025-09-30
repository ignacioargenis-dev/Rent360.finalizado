import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando siembra de servicios y mantenimientos...');

  // Crear algunos servicios de ejemplo para proveedores
  const services = [
    {
      name: 'Reparación de cañerías',
      description: 'Servicio completo de reparación y mantenimiento de cañerías',
      category: 'Plomería',
      priceRange: '50000-200000',
      estimatedDuration: '2-4 horas'
    },
    {
      name: 'Mantenimiento eléctrico',
      description: 'Instalación y reparación de sistemas eléctricos',
      category: 'Electricidad',
      priceRange: '30000-150000',
      estimatedDuration: '1-3 horas'
    },
    {
      name: 'Pintura interior',
      description: 'Pintura profesional de interiores',
      category: 'Pintura',
      priceRange: '80000-300000',
      estimatedDuration: '4-8 horas'
    },
    {
      name: 'Jardinería',
      description: 'Mantenimiento de jardines y áreas verdes',
      category: 'Jardinería',
      priceRange: '25000-100000',
      estimatedDuration: '2-6 horas'
    }
  ];

  // Crear servicios de mantenimiento preventivo
  const maintenanceServices = [
    {
      name: 'Inspección mensual de ascensores',
      description: 'Revisión completa y mantenimiento preventivo de ascensores',
      type: 'PREVENTIVE',
      frequency: 'MONTHLY',
      estimatedCost: 150000
    },
    {
      name: 'Mantenimiento de calefacción',
      description: 'Servicio de mantenimiento de sistemas de calefacción',
      type: 'PREVENTIVE',
      frequency: 'QUARTERLY',
      estimatedCost: 80000
    },
    {
      name: 'Limpieza de conductos de ventilación',
      description: 'Limpieza profunda de sistemas de ventilación',
      type: 'PREVENTIVE',
      frequency: 'BIANNUAL',
      estimatedCost: 120000
    },
    {
      name: 'Inspección eléctrica completa',
      description: 'Revisión completa de instalaciones eléctricas',
      type: 'PREVENTIVE',
      frequency: 'ANNUAL',
      estimatedCost: 100000
    }
  ];

  // Implementación básica de servicios para proveedores
  console.log('Creando servicios básicos para proveedores...');

  try {
    // Verificar si existen los usuarios de prueba
    const providerUser = await prisma.user.findUnique({
      where: { email: 'proveedor@rent360.cl' }
    });

    const maintenanceUser = await prisma.user.findUnique({
      where: { email: 'mantenimiento@rent360.cl' }
    });

    if (providerUser) {
      console.log(`Usuario proveedor encontrado: ${providerUser.name}`);

      // Crear un ServiceProvider básico si no existe
      const existingProvider = await prisma.serviceProvider.findUnique({
        where: { userId: providerUser.id }
      });

      if (!existingProvider) {
        await prisma.serviceProvider.create({
          data: {
            userId: providerUser.id,
            businessName: 'Proveedor de Servicios Rent360',
            rut: '12.345.678-9',
            serviceType: 'MULTIPLE',
            serviceTypes: JSON.stringify(['PLOMERIA', 'ELECTRICIDAD', 'PINTURA', 'JARDINERIA']),
            basePrice: 25000,
            rating: 4.5,
            totalRatings: 25,
            completedJobs: 15,
            totalEarnings: 500000,
            status: 'VERIFIED',
            isVerified: true,
            responseTime: 2.5,
            address: 'Santiago, Chile',
            description: 'Proveedor integral de servicios para propiedades',
            availability: JSON.stringify({
              monday: '08:00-18:00',
              tuesday: '08:00-18:00',
              wednesday: '08:00-18:00',
              thursday: '08:00-18:00',
              friday: '08:00-18:00',
              saturday: '09:00-14:00'
            })
          }
        });
        console.log('ServiceProvider creado para el proveedor');
      }
    }

    if (maintenanceUser) {
      console.log(`Usuario mantenimiento encontrado: ${maintenanceUser.name}`);

      // Crear un ServiceProvider básico para mantenimiento si no existe
      const existingMaintenance = await prisma.serviceProvider.findUnique({
        where: { userId: maintenanceUser.id }
      });

      if (!existingMaintenance) {
        await prisma.serviceProvider.create({
          data: {
            userId: maintenanceUser.id,
            businessName: 'Servicio de Mantenimiento Rent360',
            rut: '98.765.432-1',
            serviceType: 'MAINTENANCE',
            serviceTypes: JSON.stringify(['MANTENIMIENTO_PREVENTIVO', 'MANTENIMIENTO_CORRECTIVO']),
            basePrice: 35000,
            rating: 4.8,
            totalRatings: 40,
            completedJobs: 28,
            totalEarnings: 1200000,
            status: 'VERIFIED',
            isVerified: true,
            responseTime: 1.8,
            address: 'Santiago, Región Metropolitana',
            description: 'Servicio especializado en mantenimiento preventivo y correctivo',
            availability: JSON.stringify({
              monday: '07:00-19:00',
              tuesday: '07:00-19:00',
              wednesday: '07:00-19:00',
              thursday: '07:00-19:00',
              friday: '07:00-19:00',
              saturday: '08:00-16:00',
              sunday: 'emergencias'
            })
          }
        });
        console.log('ServiceProvider creado para el servicio de mantenimiento');
      }
    }
  } catch (error) {
    console.error('Error al crear proveedores de servicios:', error);
  }

  console.log('Siembra de servicios completada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
