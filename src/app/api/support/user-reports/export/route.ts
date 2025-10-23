import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const statusFilter = searchParams.get('status') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    logger.info('GET /api/support/user-reports/export - Exportando reportes de usuarios', {
      userId: user.id,
      format,
      statusFilter,
      startDate,
      endDate,
    });

    const whereClause: any = {};

    if (statusFilter !== 'all') {
      whereClause.status = statusFilter;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    const userReports = await db.userReport.findMany({
      where: whereClause,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      const csvHeaders = [
        'ID Reporte',
        'Reportado Por',
        'Email Reportador',
        'Rol Reportador',
        'Usuario Reportado',
        'Email Reportado',
        'Rol Reportado',
        'Motivo',
        'Descripción',
        'Estado',
        'Notas Admin',
        'Revisado Por',
        'Fecha Revisión',
        'Fecha Creación',
        'Última Actualización',
      ];

      const csvRows = userReports.map(report => [
        report.id,
        report.reporter?.name || '',
        report.reporter?.email || '',
        report.reporter?.role || '',
        report.reportedUser?.name || '',
        report.reportedUser?.email || '',
        report.reportedUser?.role || '',
        report.reason,
        `"${report.description?.replace(/"/g, '""') || ''}"`,
        report.status,
        `"${report.adminNotes?.replace(/"/g, '""') || ''}"`,
        report.reviewer?.name || '',
        report.reviewedAt ? new Date(report.reviewedAt).toISOString().split('T')[0] : '',
        new Date(report.createdAt).toISOString().split('T')[0],
        new Date(report.updatedAt).toISOString().split('T')[0],
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => String(cell)).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="reportes_usuarios_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      const jsonData = userReports.map(report => ({
        id: report.id,
        reporter: {
          id: report.reporter?.id,
          name: report.reporter?.name,
          email: report.reporter?.email,
          role: report.reporter?.role,
          avatar: report.reporter?.avatar,
        },
        reportedUser: {
          id: report.reportedUser?.id,
          name: report.reportedUser?.name,
          email: report.reportedUser?.email,
          role: report.reportedUser?.role,
          avatar: report.reportedUser?.avatar,
        },
        reason: report.reason,
        description: report.description,
        status: report.status,
        adminNotes: report.adminNotes,
        reviewedBy: report.reviewer?.name,
        reviewedAt: report.reviewedAt,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="reportes_usuarios_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
      return response;
    } else {
      return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error exporting user reports:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
