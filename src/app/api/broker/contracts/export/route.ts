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

    // Construir filtros
    const whereClause: any = {
      brokerId: user.id,
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Obtener contratos del corredor
    const contracts = await db.contract.findMany({
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
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    if (format === 'csv') {
      // Generar CSV
      const csvHeaders = [
        'ID Contrato',
        'Número Contrato',
        'Propiedad',
        'Dirección',
        'Ciudad',
        'Comuna',
        'Propietario',
        'Email Propietario',
        'Teléfono Propietario',
        'Inquilino',
        'Email Inquilino',
        'Estado',
        'Fecha Inicio',
        'Fecha Fin',
        'Renta Mensual',
        'Depósito',
        'Comisión',
        'Fecha Creación',
      ];

      const csvRows = contracts.map(contract => [
        contract.id,
        contract.contractNumber || '',
        contract.property?.title || '',
        contract.property?.address || '',
        contract.property?.city || '',
        contract.property?.commune || '',
        contract.owner?.name || '',
        contract.owner?.email || '',
        contract.owner?.phone || '',
        contract.tenant?.name || '',
        contract.tenant?.email || '',
        contract.status,
        contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
        contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
        contract.monthlyRent,
        contract.deposit || 0,
        contract.monthlyRent * 0.05, // 5% de comisión por defecto
        new Date(contract.createdAt).toISOString().split('T')[0],
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Crear respuesta con archivo CSV
      const response = new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="contratos_corredor_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      return response;
    } else if (format === 'json') {
      // Generar JSON
      const jsonData = contracts.map(contract => ({
        id: contract.id,
        contractNumber: contract.contractNumber,
        property: {
          id: contract.property?.id,
          title: contract.property?.title,
          address: contract.property?.address,
          city: contract.property?.city,
          commune: contract.property?.commune,
        },
        owner: {
          id: contract.owner?.id,
          name: contract.owner?.name,
          email: contract.owner?.email,
          phone: contract.owner?.phone,
        },
        tenant: {
          id: contract.tenant?.id,
          name: contract.tenant?.name,
          email: contract.tenant?.email,
        },
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyRent: contract.monthlyRent,
        deposit: contract.deposit,
        brokerCommission: contract.monthlyRent * 0.05, // 5% de comisión por defecto
        terms: contract.terms,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="contratos_corredor_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting broker contracts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
