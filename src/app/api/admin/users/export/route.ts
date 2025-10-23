import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo administradores pueden exportar usuarios
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv, json
    const role = searchParams.get('role'); // filtro opcional por rol
    const status = searchParams.get('status'); // filtro opcional por estado

    // Construir filtros
    const whereClause: any = {};

    if (role && role !== 'all') {
      whereClause.role = role;
    }

    if (status && status !== 'all') {
      whereClause.isActive = status === 'active';
    }

    // Obtener usuarios
    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            properties: true,
            contractsAsTenant: true,
            contractsAsBroker: true,
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
        'ID Usuario',
        'Nombre',
        'Email',
        'Teléfono',
        'RUT',
        'Rol',
        'Estado',
        'Email Verificado',
        'Propiedades (Propietario)',
        'Contratos (Inquilino)',
        'Contratos (Corredor)',
        'Fecha Creación',
        'Última Actualización',
      ];

      const csvRows = users.map(user => [
        user.id,
        user.name,
        user.email,
        user.phone || '',
        user.rut || '',
        user.role,
        user.isActive ? 'Activo' : 'Inactivo',
        user.emailVerified ? 'Sí' : 'No',
        user._count.properties,
        user._count.contractsAsTenant,
        user._count.contractsAsBroker,
        new Date(user.createdAt).toISOString().split('T')[0],
        new Date(user.updatedAt).toISOString().split('T')[0],
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Crear respuesta con archivo CSV
      const response = new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="usuarios_admin_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      return response;
    } else if (format === 'json') {
      // Generar JSON
      const jsonData = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        rut: user.rut,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        ownedPropertiesCount: user._count.properties,
        tenantContractsCount: user._count.contractsAsTenant,
        brokerContractsCount: user._count.contractsAsBroker,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="usuarios_admin_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting admin users:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
