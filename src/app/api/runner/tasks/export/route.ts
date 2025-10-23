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
      whereClause.scheduledDate = {};
      if (startDate) {
        whereClause.scheduledDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.scheduledDate.lte = new Date(endDate);
      }
    }

    // Obtener visitas del runner como tareas
    const visits = await db.visit.findMany({
      where: {
        runnerId: user.id,
      },
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

    // Transformar visitas en tareas
    const mockTasks = visits.map(visit => ({
      id: `task_${visit.id}`,
      title: `Visita a propiedad: ${visit.property.title}`,
      description: visit.notes || 'Visita programada para mostrar propiedad',
      status: visit.status,
      scheduledDate: visit.scheduledAt,
      completedDate: visit.scheduledAt, // Usamos scheduledAt como completedDate por simplicidad
      property: visit.property,
      requester: visit.tenant,
      createdAt: visit.createdAt,
      updatedAt: visit.updatedAt,
    }));

    if (format === 'csv') {
      // Generar CSV
      const csvHeaders = [
        'ID Tarea',
        'Título',
        'Descripción',
        'Estado',
        'Propiedad',
        'Dirección',
        'Ciudad',
        'Comuna',
        'Solicitante',
        'Email Solicitante',
        'Teléfono Solicitante',
        'Fecha Programada',
        'Fecha Completada',
        'Fecha Creación',
      ];

      const csvRows = mockTasks.map(task => [
        task.id,
        task.title,
        `"${task.description?.replace(/"/g, '""') || ''}"`,
        task.status,
        task.property?.title || '',
        task.property?.address || '',
        task.property?.city || '',
        task.property?.commune || '',
        task.requester?.name || '',
        task.requester?.email || '',
        task.requester?.phone || '',
        task.scheduledDate ? new Date(task.scheduledDate).toISOString().split('T')[0] : '',
        task.completedDate ? new Date(task.completedDate).toISOString().split('T')[0] : '',
        new Date(task.createdAt).toISOString().split('T')[0],
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => String(cell)).join(','))
        .join('\n');

      // Crear respuesta con archivo CSV
      const response = new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tareas_runner_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      return response;
    } else if (format === 'json') {
      // Generar JSON
      const jsonData = mockTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        property: {
          id: task.property?.id,
          title: task.property?.title,
          address: task.property?.address,
          city: task.property?.city,
          commune: task.property?.commune,
        },
        requester: {
          id: task.requester?.id,
          name: task.requester?.name,
          email: task.requester?.email,
          phone: task.requester?.phone,
        },
        scheduledDate: task.scheduledDate,
        completedDate: task.completedDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="tareas_runner_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting runner tasks:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
