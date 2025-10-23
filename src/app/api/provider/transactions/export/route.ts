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

    // Obtener trabajos completados del proveedor como transacciones
    const completedJobs = await db.maintenance.findMany({
      where: {
        assignedTo: user.id,
        status: 'COMPLETED',
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
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        completedDate: 'desc',
      },
    });

    // Crear transacciones basadas en trabajos completados
    const mockTransactions = completedJobs.map(job => ({
      id: `transaction_${job.id}`,
      maintenanceRequest: {
        id: job.id,
        title: job.title,
        category: job.category,
        priority: job.priority,
        property: job.property,
        requester: job.requester,
      },
      amount: job.estimatedCost || 0,
      status: 'COMPLETED',
      paymentDate: job.completedDate,
      createdAt: job.completedDate || job.createdAt,
      updatedAt: job.updatedAt,
    }));

    if (format === 'csv') {
      // Generar CSV
      const csvHeaders = [
        'ID Transacción',
        'Trabajo',
        'Categoría',
        'Prioridad',
        'Propiedad',
        'Dirección',
        'Cliente',
        'Email Cliente',
        'Monto',
        'Estado',
        'Fecha Pago',
        'Fecha Creación',
      ];

      const csvRows = mockTransactions.map(transaction => [
        transaction.id,
        transaction.maintenanceRequest.title,
        transaction.maintenanceRequest.category || '',
        transaction.maintenanceRequest.priority || '',
        transaction.maintenanceRequest.property?.title || '',
        transaction.maintenanceRequest.property?.address || '',
        transaction.maintenanceRequest.requester?.name || '',
        transaction.maintenanceRequest.requester?.email || '',
        transaction.amount,
        transaction.status,
        transaction.paymentDate
          ? new Date(transaction.paymentDate).toISOString().split('T')[0]
          : '',
        new Date(transaction.createdAt).toISOString().split('T')[0],
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Crear respuesta con archivo CSV
      const response = new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="transacciones_proveedor_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      return response;
    } else if (format === 'json') {
      // Generar JSON
      const jsonData = mockTransactions.map(transaction => ({
        id: transaction.id,
        job: {
          id: transaction.maintenanceRequest.id,
          title: transaction.maintenanceRequest.title,
          category: transaction.maintenanceRequest.category,
          priority: transaction.maintenanceRequest.priority,
        },
        property: {
          id: transaction.maintenanceRequest.property?.id,
          title: transaction.maintenanceRequest.property?.title,
          address: transaction.maintenanceRequest.property?.address,
          city: transaction.maintenanceRequest.property?.city,
        },
        client: {
          id: transaction.maintenanceRequest.requester?.id,
          name: transaction.maintenanceRequest.requester?.name,
          email: transaction.maintenanceRequest.requester?.email,
        },
        amount: transaction.amount,
        status: transaction.status,
        paymentDate: transaction.paymentDate,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="transacciones_proveedor_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting provider transactions:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
