import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { getUserFromRequest } from '@/lib/auth-token-validator';

/**
 * GET /api/admin/user-reports
 * Obtiene todos los reportes de usuarios (solo admin/support)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      logger.warn('API/admin/user-reports: Unauthorized attempt (no token)');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el usuario sea admin o support
    if (user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
      logger.warn('API/admin/user-reports: Forbidden - User is not admin/support', {
        userId: user.id,
        role: user.role,
      });
      return NextResponse.json(
        { success: false, error: 'Forbidden - Solo administradores y soporte pueden acceder' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, REVIEWED, RESOLVED, DISMISSED
    const reason = searchParams.get('reason');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Construir filtro
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (reason) {
      where.reason = reason;
    }

    // Obtener reportes con información completa
    const [reports, total] = await Promise.all([
      // TODO: Descomentar después de aplicar migración de Prisma en producción
      // db.userReport.findMany({
      (db as any).userReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              createdAt: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      // db.userReport.count({ where }),
      (db as any).userReport.count({ where }),
    ]);

    logger.info('API/admin/user-reports: Reports fetched successfully', {
      userId: user.id,
      totalReports: total,
      page,
    });

    return NextResponse.json(
      {
        success: true,
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('API/admin/user-reports: Error fetching reports', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/user-reports/:id
 * Actualiza el estado de un reporte (solo admin/support)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      logger.warn('API/admin/user-reports: Unauthorized attempt (no token)');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el usuario sea admin o support
    if (user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
      logger.warn('API/admin/user-reports: Forbidden - User is not admin/support', {
        userId: user.id,
        role: user.role,
      });
      return NextResponse.json(
        { success: false, error: 'Forbidden - Solo administradores y soporte pueden actualizar' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reportId, status, adminNotes } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { success: false, error: 'reportId y status son requeridos' },
        { status: 400 }
      );
    }

    // Validar status
    const validStatuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status inválido. Debe ser uno de: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Actualizar el reporte
    const updatedReport = await (db as any).userReport.update({
      where: { id: reportId },
      data: {
        status,
        adminNotes: adminNotes || undefined,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('API/admin/user-reports: Report updated successfully', {
      reportId,
      status,
      reviewedBy: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        report: updatedReport,
        message: 'Reporte actualizado exitosamente',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('API/admin/user-reports: Error updating report', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
