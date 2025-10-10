import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Máximo 50

    logger.info('GET /api/admin/recent-activity - Consultando actividades recientes...', { limit });

    // Obtener actividades recientes de diferentes tablas
    const [recentUsers, recentContracts, recentPayments, recentProperties] = await Promise.all([
      // Usuarios registrados recientemente
      db.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4), // Distribuir el límite entre tipos
      }),

      // Contratos creados recientemente
      db.contract.findMany({
        select: {
          id: true,
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
      }),

      // Pagos realizados recientemente
      db.payment.findMany({
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
        where: {
          status: 'completed', // Solo pagos completados
        },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
      }),

      // Propiedades creadas recientemente
      db.property.findMany({
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
      }),
    ]);

    // Combinar y formatear todas las actividades
    const activities: any[] = [];

    // Agregar usuarios registrados
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        title: 'Nuevo usuario registrado',
        description: `${user.name} se registró en la plataforma`,
        date: user.createdAt.toISOString(),
        severity: 'low',
      });
    });

    // Agregar contratos firmados
    recentContracts.forEach(contract => {
      activities.push({
        id: `contract-${contract.id}`,
        type: 'contract',
        title: 'Contrato creado',
        description: `Nuevo contrato ${contract.status}`,
        date: contract.createdAt.toISOString(),
        severity: 'medium',
      });
    });

    // Agregar pagos realizados
    recentPayments.forEach(payment => {
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        title: 'Pago procesado',
        description: `Pago de $${payment.amount} realizado`,
        date: payment.createdAt.toISOString(),
        severity: 'high',
      });
    });

    // Agregar propiedades creadas
    recentProperties.forEach(property => {
      activities.push({
        id: `property-${property.id}`,
        type: 'property',
        title: 'Propiedad registrada',
        description: `Nueva propiedad: ${property.title}`,
        date: property.createdAt.toISOString(),
        severity: 'medium',
      });
    });

    // Ordenar por fecha descendente y limitar
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limitedActivities = activities.slice(0, limit);

    logger.info('Actividades recientes obtenidas', {
      totalActivities: activities.length,
      returnedActivities: limitedActivities.length,
    });

    return NextResponse.json({
      success: true,
      activities: limitedActivities,
    });
  } catch (error) {
    logger.error('Error obteniendo actividades recientes:', {
      error: error instanceof Error ? error.message : String(error),
    });

    // En caso de error, devolver array vacío
    return NextResponse.json({
      success: true,
      activities: [],
      error: 'Error obteniendo actividades recientes.',
    });
  }
}
