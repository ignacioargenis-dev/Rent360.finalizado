import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    logger.info('GET /api/admin/quick-diagnostics - Iniciando diagnóstico rápido...', {
      userId: user.id,
      userEmail: user.email,
    });

    // Obtener conteos básicos
    const counts = await Promise.all([
      db.user.count(),
      db.property.count(),
      db.contract.count(),
      db.payment.count(),
      db.ticket.count(),
    ]);

    const [totalUsers, totalProperties, totalContracts, totalPayments, totalTickets] = counts;

    // Obtener algunos datos de ejemplo
    const sampleData = await Promise.all([
      db.user.findFirst({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.property.findFirst({
        select: { id: true, title: true, address: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.contract.findFirst({
        select: { id: true, contractNumber: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const diagnostics = {
      counts: {
        totalUsers,
        totalProperties,
        totalContracts,
        totalPayments,
        totalTickets,
      },
      sampleData: {
        latestUser: sampleData[0],
        latestProperty: sampleData[1],
        latestContract: sampleData[2],
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    logger.info('Diagnóstico rápido completado', {
      totalUsers,
      totalProperties,
      totalContracts,
      totalPayments,
      totalTickets,
    });

    return NextResponse.json({
      success: true,
      data: diagnostics,
    });
  } catch (error) {
    logger.error('Error en diagnóstico rápido:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo diagnóstico rápido',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
