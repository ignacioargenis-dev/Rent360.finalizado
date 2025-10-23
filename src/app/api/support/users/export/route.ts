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
    const roleFilter = searchParams.get('role') || 'all';
    const statusFilter = searchParams.get('status') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    logger.info('GET /api/support/users/export - Exportando usuarios de soporte', {
      userId: user.id,
      format,
      roleFilter,
      statusFilter,
      startDate,
      endDate,
    });

    const whereClause: any = {};

    if (roleFilter !== 'all') {
      whereClause.role = roleFilter;
    }

    if (statusFilter !== 'all') {
      whereClause.isActive = statusFilter === 'active';
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

    const users = await db.user.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            properties: true,
            contractsAsTenant: true,
            contractsAsBroker: true,
            tickets: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      const csvHeaders = [
        'ID',
        'Nombre',
        'Email',
        'Teléfono',
        'RUT',
        'Rol',
        'Estado',
        'Email Verificado',
        'Propiedades',
        'Contratos como Inquilino',
        'Contratos como Corredor',
        'Tickets',
        'Fecha Creación',
        'Última Actualización',
      ];

      const csvRows = users.map(user => [
        user.id,
        user.name,
        user.email,
        user.phone || '',
        user.rut || '',
        user.role,
        user.isActive ? 'Activo' : 'Inactivo',
        user.emailVerified ? 'Sí' : 'No',
        user._count.properties,
        user._count.contractsAsTenant,
        user._count.contractsAsBroker,
        user._count.tickets,
        new Date(user.createdAt).toISOString().split('T')[0],
        new Date(user.updatedAt).toISOString().split('T')[0],
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => String(cell)).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="usuarios_soporte_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      const jsonData = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        rut: user.rut,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        stats: {
          properties: user._count.properties,
          tenantContracts: user._count.contractsAsTenant,
          brokerContracts: user._count.contractsAsBroker,
          tickets: user._count.tickets,
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="usuarios_soporte_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
      return response;
    } else {
      return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error exporting support users:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
