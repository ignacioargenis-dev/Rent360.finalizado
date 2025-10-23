import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
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
      providerId: user.id,
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

    // Obtener trabajos del proveedor
    const jobs = await db.maintenance.findMany({
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
            role: true,
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
        'ID Trabajo',
        'Título',
        'Descripción',
        'Categoría',
        'Prioridad',
        'Estado',
        'Costo Estimado',
        'Propiedad',
        'Dirección',
        'Ciudad',
        'Comuna',
        'Solicitante',
        'Email Solicitante',
        'Tipo Solicitante',
        'Fecha Creación',
        'Fecha Programada',
        'Fecha Completada',
      ];

      const csvRows = jobs.map(job => [
        job.id,
        job.title,
        `"${job.description?.replace(/"/g, '""') || ''}"`,
        job.category || '',
        job.priority || '',
        job.status,
        job.estimatedCost || 0,
        job.property?.title || '',
        job.property?.address || '',
        job.property?.city || '',
        job.property?.commune || '',
        job.requester?.name || '',
        job.requester?.email || '',
        job.requester?.role || '',
        new Date(job.createdAt).toISOString().split('T')[0],
        job.scheduledDate ? new Date(job.scheduledDate).toISOString().split('T')[0] : '',
        job.completedDate ? new Date(job.completedDate).toISOString().split('T')[0] : '',
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => String(cell)).join(','))
        .join('\n');

      // Crear respuesta con archivo CSV
      const response = new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="trabajos_proveedor_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      return response;
    } else if (format === 'json') {
      // Generar JSON
      const jsonData = jobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        category: job.category,
        priority: job.priority,
        status: job.status,
        estimatedCost: job.estimatedCost,
        property: {
          id: job.property?.id,
          title: job.property?.title,
          address: job.property?.address,
          city: job.property?.city,
          commune: job.property?.commune,
        },
        requester: {
          id: job.requester?.id,
          name: job.requester?.name,
          email: job.requester?.email,
          role: job.requester?.role,
        },
        createdAt: job.createdAt,
        scheduledDate: job.scheduledDate,
        completedDate: job.completedDate,
        updatedAt: job.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="trabajos_proveedor_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting provider jobs:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
