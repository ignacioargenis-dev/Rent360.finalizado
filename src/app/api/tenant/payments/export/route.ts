import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de inquilino.' },
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
      tenantId: user.id,
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

    // Obtener pagos del inquilino
    const payments = await db.payment.findMany({
      where: whereClause,
      include: {
        contract: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
              },
            },
          },
          select: {
            id: true,
            contractNumber: true,
            monthlyRent: true,
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
        'ID Pago',
        'Propiedad',
        'Dirección',
        'Número Contrato',
        'Renta Mensual',
        'Tipo de Pago',
        'Monto',
        'Moneda',
        'Estado',
        'Fecha de Creación',
        'Fecha de Pago',
        'Fecha Vencimiento',
        'Método de Pago',
        'Referencia',
        'Notas',
      ];

      const csvRows = payments.map(payment => [
        payment.id,
        payment.contract?.property?.title || '',
        payment.contract?.property?.address || '',
        payment.contract?.contractNumber || '',
        payment.contract?.monthlyRent || 0,
        'RENT', // Tipo de pago por defecto
        payment.amount,
        'CLP', // Moneda por defecto
        payment.status,
        new Date(payment.createdAt).toISOString().split('T')[0],
        payment.paidDate ? new Date(payment.paidDate).toISOString().split('T')[0] : '',
        payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : '',
        payment.method || '',
        payment.transactionId || '',
        `"${payment.notes?.replace(/"/g, '""') || ''}"`, // Escapar comillas en CSV
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => String(cell)).join(','))
        .join('\n');

      // Crear respuesta con archivo CSV
      const response = new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pagos_inquilino_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      return response;
    } else if (format === 'json') {
      // Generar JSON
      const jsonData = payments.map(payment => ({
        id: payment.id,
        property: {
          id: payment.contract?.property?.id,
          title: payment.contract?.property?.title,
          address: payment.contract?.property?.address,
          city: payment.contract?.property?.city,
        },
        contract: {
          id: payment.contract?.id,
          contractNumber: payment.contract?.contractNumber,
          monthlyRent: payment.contract?.monthlyRent,
        },
        type: 'RENT',
        amount: payment.amount,
        currency: 'CLP',
        status: payment.status,
        createdAt: payment.createdAt,
        paidAt: payment.paidDate,
        dueDate: payment.dueDate,
        paymentMethod: payment.method,
        reference: payment.transactionId,
        notes: payment.notes,
        updatedAt: payment.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="pagos_inquilino_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting tenant payments:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
