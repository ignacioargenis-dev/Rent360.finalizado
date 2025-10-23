import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
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
      runnerId: user.id,
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.scheduledAt = {};
      if (startDate) {
        whereClause.scheduledAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.scheduledAt.lte = new Date(endDate);
      }
    }

    // Obtener visitas del runner como ganancias
    const visits = await db.visit.findMany({
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
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Crear ganancias basadas en visitas
    const earnings = visits.map(visit => ({
      id: `earning_${visit.id}`,
      visitId: visit.id,
      propertyTitle: visit.property.title,
      propertyAddress: visit.property.address,
      propertyCity: visit.property.city,
      propertyCommune: visit.property.commune,
      tenantName: visit.tenant?.name || '',
      tenantEmail: visit.tenant?.email || '',
      tenantPhone: visit.tenant?.phone || '',
      scheduledDate: visit.scheduledAt,
      status: visit.status,
      earnings: visit.earnings || 0, // Monto ganado por la visita
      duration: visit.duration || 30, // Duración en minutos
      photosTaken: visit.photosTaken || 0,
      rating: visit.rating,
      notes: visit.notes,
      createdAt: visit.createdAt,
      updatedAt: visit.updatedAt,
    }));

    if (format === 'csv') {
      // Generar CSV
      const csvHeaders = [
        'ID Ganancia',
        'ID Visita',
        'Propiedad',
        'Dirección',
        'Ciudad',
        'Comuna',
        'Cliente',
        'Email Cliente',
        'Teléfono Cliente',
        'Fecha Programada',
        'Estado',
        'Ganancia (CLP)',
        'Duración (min)',
        'Fotos Tomadas',
        'Calificación',
        'Notas',
        'Fecha Creación',
      ];

      const csvRows = earnings.map(earning => [
        earning.id,
        earning.visitId,
        earning.propertyTitle,
        earning.propertyAddress,
        earning.propertyCity,
        earning.propertyCommune,
        earning.tenantName,
        earning.tenantEmail,
        earning.tenantPhone,
        earning.scheduledDate ? new Date(earning.scheduledDate).toISOString().split('T')[0] : '',
        earning.status,
        earning.earnings,
        earning.duration,
        earning.photosTaken,
        earning.rating || '',
        `"${earning.notes?.replace(/"/g, '""') || ''}"`,
        new Date(earning.createdAt).toISOString().split('T')[0],
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => String(cell)).join(','))
        .join('\n');

      // Crear respuesta con archivo CSV
      const response = new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="ganancias_runner_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      return response;
    } else if (format === 'json') {
      // Generar JSON
      const response = new NextResponse(JSON.stringify(earnings, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="ganancias_runner_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting runner earnings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
