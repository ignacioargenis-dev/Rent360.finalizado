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

    // Obtener pagos del propietario
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
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
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
        'Inquilino',
        'Email Inquilino',
        'Teléfono Inquilino',
        'Número Contrato',
        'Tipo de Pago',
        'Monto',
        'Moneda',
        'Estado',
        'Fecha de Creación',
        'Fecha de Pago',
        'Método de Pago',
        'Referencia',
        'Notas',
      ];

      const csvRows = payments.map(payment => [
        payment.id,
        payment.contract?.property?.title || '',
        payment.contract?.property?.address || '',
        payment.contract?.tenant?.name || '',
        payment.contract?.tenant?.email || '',
        payment.contract?.tenant?.phone || '',
        payment.contract?.contractNumber || '',
        'RENT', // Tipo de pago por defecto
        payment.amount,
        'CLP', // Moneda por defecto
        payment.status,
        new Date(payment.createdAt).toISOString().split('T')[0],
        payment.paidDate ? new Date(payment.paidDate).toISOString().split('T')[0] : '',
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
          'Content-Disposition': `attachment; filename="pagos_propietario_${new Date().toISOString().split('T')[0]}.csv"`,
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
        tenant: {
          id: payment.contract?.tenant?.id,
          name: payment.contract?.tenant?.name,
          email: payment.contract?.tenant?.email,
          phone: payment.contract?.tenant?.phone,
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
        paymentMethod: payment.method,
        reference: payment.transactionId,
        notes: payment.notes,
        dueDate: payment.dueDate,
        updatedAt: payment.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="pagos_propietario_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting owner payments:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
