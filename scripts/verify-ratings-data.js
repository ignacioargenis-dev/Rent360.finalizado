#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyRatings() {
  try {
    console.log('🔍 Verificando datos de calificaciones...\n');

    // 1. Verificar estructura de la tabla
    console.log('1. Verificando estructura de la tabla user_ratings...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_ratings' 
      ORDER BY ordinal_position
    `;
    console.log(`   ✅ Tabla tiene ${columns.length} columnas`);
    const hasResponse = columns.some(c => c.column_name === 'response');
    const hasResponseDate = columns.some(c => c.column_name === 'responseDate');
    console.log(
      `   ${hasResponse ? '✅' : '❌'} Campo 'response': ${hasResponse ? 'EXISTE' : 'NO EXISTE'}`
    );
    console.log(
      `   ${hasResponseDate ? '✅' : '❌'} Campo 'responseDate': ${hasResponseDate ? 'EXISTE' : 'NO EXISTE'}\n`
    );

    // 2. Contar calificaciones totales
    const totalRatings = await prisma.userRating.count();
    console.log(`2. Total de calificaciones en user_ratings: ${totalRatings}\n`);

    // 3. Mostrar calificaciones recientes
    console.log('3. Últimas 10 calificaciones:');
    const recentRatings = await prisma.userRating.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: { id: true, name: true, role: true },
        },
        toUser: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (recentRatings.length === 0) {
      console.log('   ⚠️  No hay calificaciones en la base de datos\n');
    } else {
      recentRatings.forEach((rating, idx) => {
        console.log(`   ${idx + 1}. ID: ${rating.id}`);
        console.log(
          `      De: ${rating.fromUser?.name || 'N/A'} (${rating.fromUser?.role || 'N/A'})`
        );
        console.log(
          `      Para: ${rating.toUser?.name || 'N/A'} (${rating.toUser?.role || 'N/A'})`
        );
        console.log(`      Contexto: ${rating.contextType}`);
        console.log(`      Calificación: ${rating.overallRating} estrellas`);
        console.log(`      Fecha: ${rating.createdAt.toISOString()}`);
        console.log(`      Tiene respuesta: ${rating.response ? 'Sí' : 'No'}`);
        console.log('');
      });
    }

    // 4. Verificar calificaciones por rol
    console.log('4. Calificaciones recibidas por rol:');
    const ratingsByRole = await prisma.userRating.groupBy({
      by: ['toUserId'],
      _count: true,
    });

    for (const group of ratingsByRole.slice(0, 10)) {
      const user = await prisma.user.findUnique({
        where: { id: group.toUserId },
        select: { name: true, role: true },
      });
      console.log(
        `   ${user?.name || group.toUserId} (${user?.role || 'N/A'}): ${group._count} calificaciones`
      );
    }

    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyRatings();
