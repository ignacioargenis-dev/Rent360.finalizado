import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de propietario.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv, json
    const status = searchParams.get('status'); // filtro opcional por estado
    const startDate = searchParams.get('startDate'); // filtro opcional por fecha
    const endDate = searchParams.get('endDate'); // filtro opcional por fecha

    // Construir filtros
    const whereClause: any = {
      property: {
        ownerId: user.id,
      },
    };

    if (status && status !== 'all') {
      whereClause.status = status;
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

    // Obtener datos de mantenimiento
    const maintenanceRequests = await db.maintenance.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        maintenanceProvider: {
          select: {
            id: true,
            businessName: true,
            specialty: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      // Generar CSV
      const csvHeaders = [
        'ID',
        'Propiedad',
        'Dirección',
        'Ciudad',
        'Comuna',
        'Inquilino',
        'Email Inquilino',
        'Tipo',
        'Urgencia',
        'Descripción',
        'Estado',
        'Costo Estimado',
        'Fecha Creación',
        'Fecha Programada',
        'Fecha Completada',
        'Proveedor Asignado',
        'Email Proveedor',
      ];

      const csvRows = maintenanceRequests.map(request => [
        request.id,
        request.property?.title || '',
        request.property?.address || '',
        request.property?.city || '',
        request.property?.commune || '',
        request.requester?.name || '',
        request.requester?.email || '',
        request.type,
        request.priority,
        `"${request.description.replace(/"/g, '""')}"`, // Escapar comillas en CSV
        request.status,
        request.estimatedCost,
        new Date(request.createdAt).toISOString().split('T')[0],
        request.scheduledDate ? new Date(request.scheduledDate).toISOString().split('T')[0] : '',
        request.completedDate ? new Date(request.completedDate).toISOString().split('T')[0] : '',
        request.maintenanceProvider?.user?.name || request.maintenanceProvider?.businessName || '',
        request.maintenanceProvider?.user?.email || '',
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => String(cell)).join(','))
        .join('\n');

      // Crear respuesta con archivo CSV
      const response = new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="mantenimiento_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      return response;
    } else if (format === 'json') {
      // Generar JSON
      const jsonData = maintenanceRequests.map(request => ({
        id: request.id,
        property: {
          id: request.property?.id,
          title: request.property?.title,
          address: request.property?.address,
          city: request.property?.city,
          commune: request.property?.commune,
        },
        tenant: {
          id: request.requester?.id,
          name: request.requester?.name,
          email: request.requester?.email,
        },
        type: request.type,
        priority: request.priority,
        description: request.description,
        status: request.status,
        estimatedCost: request.estimatedCost,
        createdAt: request.createdAt,
        scheduledDate: request.scheduledDate,
        completedDate: request.completedDate,
        provider: request.maintenanceProvider
          ? {
              id: request.maintenanceProvider.id,
              businessName: request.maintenanceProvider.businessName,
              specialty: request.maintenanceProvider.specialty,
              user: {
                name: request.maintenanceProvider.user?.name,
                email: request.maintenanceProvider.user?.email,
              },
            }
          : null,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="mantenimiento_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting maintenance data:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
