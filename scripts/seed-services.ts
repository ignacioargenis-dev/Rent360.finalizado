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

  // Crear servicios para proveedores
  for (const service of services) {
    try {
      const existingService = await prisma.service.findFirst({
        where: { name: service.name }
      });

      if (!existingService) {
        await prisma.service.create({
          data: {
            ...service,
            providerId: 'proveedor@rent360.cl' // Asignar al proveedor de prueba
          }
        });
        console.log(`Servicio creado: ${service.name}`);
      }
    } catch (error) {
      console.error(`Error al crear servicio ${service.name}:`, error);
    }
  }

  // Crear servicios de mantenimiento
  for (const maintenance of maintenanceServices) {
    try {
      const existingMaintenance = await prisma.maintenanceService.findFirst({
        where: { name: maintenance.name }
      });

      if (!existingMaintenance) {
        await prisma.maintenanceService.create({
          data: {
            ...maintenance,
            maintenanceProviderId: 'mantenimiento@rent360.cl' // Asignar al servicio de mantenimiento
          }
        });
        console.log(`Servicio de mantenimiento creado: ${maintenance.name}`);
      }
    } catch (error) {
      console.error(`Error al crear servicio de mantenimiento ${maintenance.name}:`, error);
    }
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
