import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    logger.info('GET /api/support/signatures/export - Exportando firmas de soporte', {
      userId: user.id,
      status,
      search,
    });

    // Construir filtros
    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status.toLowerCase();
    }

    if (search) {
      whereClause.OR = [
        { contract: { contractNumber: { contains: search, mode: 'insensitive' } } },
        { signer: { name: { contains: search, mode: 'insensitive' } } },
        { signer: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Obtener todas las firmas para exportación
    const signatures = await db.contractSignature.findMany({
      where: whereClause,
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            status: true,
            createdAt: true,
          },
        },
        signer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { signedAt: 'desc' },
    });

    // Generar CSV
    const csvHeaders = [
      'ID Firma',
      'ID Contrato',
      'Título Contrato',
      'Estado Contrato',
      'Nombre Firmante',
      'Email Firmante',
      'Rol Firmante',
      'Teléfono Firmante',
      'Estado Firma',
      'Fecha Firma',
      'Fecha Expiración',
      'Proveedor',
      'Dirección IP',
      'User Agent',
      'Fecha Creación Contrato',
    ];

    const csvRows = signatures.map(signature => [
      signature.id,
      signature.contractId,
      signature.contract?.contractNumber || '',
      signature.contract?.status || '',
      signature.signer?.name || '',
      signature.signer?.email || '',
      signature.signer?.role || '',
      signature.signer?.phone || '',
      signature.status,
      signature.signedAt?.toISOString() || '',
      signature.expiresAt?.toISOString() || '',
      signature.signatureProvider || '',
      '', // ipAddress no disponible en este modelo
      '', // userAgent no disponible en este modelo
      signature.contract?.createdAt?.toISOString() || '',
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Crear respuesta con archivo CSV
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="firmas-soporte-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

    return response;
  } catch (error) {
    logger.error('Error en GET /api/support/signatures/export:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
