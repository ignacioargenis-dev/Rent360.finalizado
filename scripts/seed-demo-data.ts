import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando siembra de datos de demo...');

  // Obtener usuarios existentes
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
    console.log('No hay usuarios en la base de datos. Ejecuta primero el script de usuarios.');
    return;
  }

  const adminUser = users.find(u => u.role === 'ADMIN');
  const ownerUser = users.find(u => u.role === 'OWNER');
  const tenantUser = users.find(u => u.role === 'TENANT');

  if (!adminUser || !ownerUser || !tenantUser) {
    console.log('Se necesitan usuarios admin, owner y tenant para crear datos de demo.');
    return;
  }

  // Crear propiedades de ejemplo
  const properties = [
    {
      title: 'Departamento Amoblado en Providencia',
      description: 'Hermoso departamento amoblado en el corazón de Providencia, cerca del metro Los Leones. Cuenta con 2 dormitorios, 1 baño, cocina equipada y living comedor. Ideal para profesionales o parejas.',
      address: 'Avenida Providencia 1234, Providencia',
      city: 'Santiago',
      commune: 'Providencia',
      region: 'Metropolitana',
      price: 450000,
      deposit: 450000,
      bedrooms: 2,
      bathrooms: 1,
      area: 65,
      type: 'APARTMENT',
      status: 'AVAILABLE',
      features: JSON.stringify(['Amoblado', 'Cocina equipada', 'Balcón', 'Estacionamiento', 'Gimnasio', 'Piscina']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop']),
      ownerId: ownerUser.id,
    },
    {
      title: 'Casa en Las Condes con Jardín',
      description: 'Espaciosa casa en Las Condes con jardín privado. 3 dormitorios, 2 baños, living comedor, cocina independiente y garaje para 2 autos. Zona tranquila y segura.',
      address: 'Calle Las Condes 5678, Las Condes',
      city: 'Santiago',
      commune: 'Las Condes',
      region: 'Metropolitana',
      price: 850000,
      deposit: 850000,
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      type: 'HOUSE',
      status: 'RENTED',
      features: JSON.stringify(['Jardín', 'Garaje', 'Seguridad 24h', 'Terraza', 'Chimenea']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop']),
      ownerId: ownerUser.id,
    },
    {
      title: 'Studio en Ñuñoa cerca del metro',
      description: 'Moderno studio en Ñuñoa, a pasos del metro Irarrázaval. Perfecto para estudiantes o jóvenes profesionales. Zona universitaria con muchos servicios.',
      address: 'Avenida Irarrázaval 901, Ñuñoa',
      city: 'Santiago',
      commune: 'Ñuñoa',
      region: 'Metropolitana',
      price: 280000,
      deposit: 280000,
      bedrooms: 1,
      bathrooms: 1,
      area: 35,
      type: 'STUDIO',
      status: 'AVAILABLE',
      features: JSON.stringify(['Cerca del metro', 'Zona universitaria', 'Amoblado', 'Internet incluido']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop']),
      ownerId: ownerUser.id,
    },
  ];

  for (const propertyData of properties) {
    try {
      const existingProperty = await prisma.property.findFirst({
        where: { title: propertyData.title },
      });

      if (!existingProperty) {
        await prisma.property.create({
          data: {
            ...propertyData,
            status: propertyData.status as any,
            type: propertyData.type as any
          },
        });
        console.log(`Propiedad creada: ${propertyData.title}`);
      } else {
        console.log(`Propiedad ya existe: ${propertyData.title}`);
      }
    } catch (error) {
      console.error(`Error al crear propiedad ${propertyData.title}:`, error);
    }
  }

  // Crear tickets de soporte de ejemplo
  const tickets = [
    {
      ticketNumber: 'TKT-001',
      title: 'Problema con cerradura de departamento',
      description: 'La cerradura de la puerta principal del departamento no funciona correctamente. Es difícil abrir y cerrar la puerta.',
      category: 'Mantenimiento',
      priority: 'HIGH',
      status: 'OPEN',
      userId: tenantUser.id,
    },
    {
      ticketNumber: 'TKT-002',
      title: 'Consulta sobre contrato de arriendo',
      description: 'Tengo dudas sobre las cláusulas del contrato de arriendo, específicamente sobre la renovación automática.',
      category: 'Contrato',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      userId: tenantUser.id,
      assignedTo: adminUser.id,
    },
    {
      ticketNumber: 'TKT-003',
      title: 'Solicitud de aumento de renta',
      description: 'Me gustaría solicitar un aumento del 5% en la renta de mi propiedad en Las Condes debido a mejoras realizadas.',
      category: 'Propietario',
      priority: 'LOW',
      status: 'RESOLVED',
      userId: ownerUser.id,
      assignedTo: adminUser.id,
    },
  ];

  for (const ticketData of tickets) {
    try {
      const existingTicket = await prisma.ticket.findFirst({
        where: { ticketNumber: ticketData.ticketNumber },
      });

      if (!existingTicket) {
        await prisma.ticket.create({
          data: {
            ...ticketData,
            priority: ticketData.priority as any,
            status: ticketData.status as any,
            category: ticketData.category as any
          },
        });
        console.log(`Ticket creado: ${ticketData.ticketNumber}`);
      } else {
        console.log(`Ticket ya existe: ${ticketData.ticketNumber}`);
      }
    } catch (error) {
      console.error(`Error al crear ticket ${ticketData.ticketNumber}:`, error);
    }
  }

  // Crear comentarios de ejemplo para los tickets
  const comments = [
    {
      ticketId: 'TKT-001',
      userId: adminUser.id,
      content: 'Hemos contactado al servicio de mantenimiento para revisar la cerradura. Visitarán la propiedad en las próximas 48 horas.',
      isInternal: false,
    },
    {
      ticketId: 'TKT-002',
      userId: adminUser.id,
      content: 'Revisando el contrato y las cláusulas de renovación. Te enviaré una respuesta detallada pronto.',
      isInternal: false,
    },
    {
      ticketId: 'TKT-003',
      userId: adminUser.id,
      content: 'Aumento de renta aprobado. Se ha notificado al inquilino y se actualizará el contrato.',
      isInternal: true,
    },
  ];

  for (const commentData of comments) {
    try {
      // Obtener el ID del ticket
      const ticket = await prisma.ticket.findFirst({
        where: { ticketNumber: commentData.ticketId },
      });

      if (ticket) {
        await prisma.ticketComment.create({
          data: {
            ticketId: ticket.id,
            userId: commentData.userId,
            content: commentData.content,
            isInternal: commentData.isInternal,
          },
        });
        console.log(`Comentario creado para ticket: ${commentData.ticketId}`);
      }
    } catch (error) {
      console.error(`Error al crear comentario para ticket ${commentData.ticketId}:`, error);
    }
  }

  console.log('Siembra de datos de demo completada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });