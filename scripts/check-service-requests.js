const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkServiceRequests() {
  try {
    console.log('🔍 Verificando solicitudes de servicio existentes...\n');

    const serviceRequests = await prisma.serviceJob.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        urgency: true,
        preferredTimeSlot: true,
        budgetMax: true,
        estimatedDuration: true,
        specialRequirements: true,
        attachments: true,
        requester: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      take: 10, // Solo las primeras 10 para ver el estado
    });

    console.log(`📊 Total de solicitudes encontradas: ${serviceRequests.length}\n`);

    for (const request of serviceRequests) {
      console.log(`🆔 Solicitud: ${request.id}`);
      console.log(`📝 Título: ${request.title}`);
      console.log(`👤 Cliente: ${request.requester.name} (${request.requester.email})`);
      console.log(`📅 Fecha: ${request.createdAt}`);

      // Verificar campos nuevos
      console.log(`🚨 Urgencia: ${request.urgency || '❌ NULL'}`);
      console.log(`⏰ Horario preferido: ${request.preferredTimeSlot || '❌ NULL'}`);
      console.log(`💰 Presupuesto máximo: ${request.budgetMax || '❌ NULL'}`);
      console.log(`⏳ Duración estimada: ${request.estimatedDuration || '❌ NULL'}`);
      console.log(
        `📋 Requisitos especiales: ${request.specialRequirements ? '✅ Presente' : '❌ NULL'}`
      );
      console.log(`📎 Adjuntos: ${request.attachments ? '✅ Presente' : '❌ NULL'}`);

      // Intentar parsear JSON si existe
      if (request.specialRequirements) {
        try {
          const parsed = JSON.parse(request.specialRequirements);
          console.log(
            `   📋 Requisitos parseados: ${Array.isArray(parsed) ? parsed.join(', ') : 'No es array'}`
          );
        } catch (e) {
          console.log(`   ❌ Error parseando requisitos especiales: ${e.message}`);
        }
      }

      if (request.attachments) {
        try {
          const parsed = JSON.parse(request.attachments);
          console.log(
            `   📎 Adjuntos parseados: ${Array.isArray(parsed) ? parsed.length + ' archivos' : 'No es array'}`
          );
        } catch (e) {
          console.log(`   ❌ Error parseando adjuntos: ${e.message}`);
        }
      }

      console.log('---\n');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServiceRequests();
