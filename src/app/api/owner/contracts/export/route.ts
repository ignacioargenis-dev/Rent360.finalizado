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
      ownerId: user.id,
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

    // Obtener contratos del propietario
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
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rut: true,
          },
        },
        broker: {
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
        'Inquilino',
        'Email Inquilino',
        'Teléfono Inquilino',
        'RUT Inquilino',
        'Corredor',
        '', // Company column removed
        'Estado',
        'Fecha Inicio',
        'Fecha Fin',
        'Renta Mensual',
        'Depósito',
        'Fecha Creación',
      ];

      const csvRows = contracts.map(contract => [
        contract.id,
        contract.contractNumber || '',
        contract.property?.title || '',
        contract.property?.address || '',
        contract.property?.city || '',
        contract.property?.commune || '',
        contract.tenant?.name || '',
        contract.tenant?.email || '',
        contract.tenant?.phone || '',
        contract.tenant?.rut || '',
        contract.broker?.name || '',
        '', // Company info not available
        contract.status,
        contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
        contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
        contract.monthlyRent,
        contract.depositAmount || 0,
        new Date(contract.createdAt).toISOString().split('T')[0],
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Crear respuesta con archivo CSV
      const response = new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="contratos_propietario_${new Date().toISOString().split('T')[0]}.csv"`,
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
        tenant: {
          id: contract.tenant?.id,
          name: contract.tenant?.name,
          email: contract.tenant?.email,
          phone: contract.tenant?.phone,
          rut: contract.tenant?.rut,
        },
        broker: contract.broker
          ? {
              id: contract.broker.id,
              name: contract.broker.name,
              email: contract.broker.email,
            }
          : null,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyRent: contract.monthlyRent,
        deposit: contract.depositAmount,
        terms: contract.terms,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="contratos_propietario_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting owner contracts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
