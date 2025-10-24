import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
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
      brokerId: user.id,
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

    // Obtener contratos del corredor con información de comisiones
    const contracts = await db.contract.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
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
    });

    // Transformar contratos en registros de comisiones
    const commissions = contracts.map(contract => ({
      id: `commission_${contract.id}`,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      propertyTitle: contract.property?.title || '',
      propertyAddress: contract.property?.address || '',
      propertyCity: contract.property?.city || '',
      ownerName: contract.owner?.name || '',
      ownerEmail: contract.owner?.email || '',
      tenantName: contract.tenant?.name || '',
      tenantEmail: contract.tenant?.email || '',
      monthlyRent: contract.monthlyRent,
      deposit: contract.depositAmount,
      brokerCommission: contract.monthlyRent * 0.05, // 5% de comisión por defecto
      commissionPercentage: 5.0, // 5% por defecto
      status: contract.status,
      startDate: contract.startDate,
      endDate: contract.endDate,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    }));

    if (format === 'csv') {
      // Generar CSV
      const csvHeaders = [
        'ID Comisión',
        'Número Contrato',
        'Propiedad',
        'Dirección',
        'Ciudad',
        'Propietario',
        'Email Propietario',
        'Inquilino',
        'Email Inquilino',
        'Renta Mensual',
        'Depósito',
        'Comisión (CLP)',
        'Comisión (%)',
        'Estado',
        'Fecha Inicio',
        'Fecha Fin',
        'Fecha Creación',
      ];

      const csvRows = commissions.map(commission => [
        commission.id,
        commission.contractNumber || '',
        commission.propertyTitle,
        commission.propertyAddress,
        commission.propertyCity,
        commission.ownerName,
        commission.ownerEmail,
        commission.tenantName,
        commission.tenantEmail,
        commission.monthlyRent,
        commission.deposit || 0,
        commission.brokerCommission,
        commission.commissionPercentage.toFixed(2),
        commission.status,
        commission.startDate ? new Date(commission.startDate).toISOString().split('T')[0] : '',
        commission.endDate ? new Date(commission.endDate).toISOString().split('T')[0] : '',
        new Date(commission.createdAt).toISOString().split('T')[0],
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Crear respuesta con archivo CSV
      const response = new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="comisiones_corredor_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      return response;
    } else if (format === 'json') {
      // Generar JSON
      const response = new NextResponse(JSON.stringify(commissions, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="comisiones_corredor_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting broker commissions:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
