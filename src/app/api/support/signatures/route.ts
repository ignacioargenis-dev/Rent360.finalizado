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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    logger.info('GET /api/support/signatures - Obteniendo firmas para soporte', {
      userId: user.id,
      page,
      limit,
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

    // Obtener firmas con información relacionada
    const signatures = await db.contractSignature.findMany({
      where: whereClause,
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            status: true,
          },
        },
        signer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { signedAt: 'desc' },
      skip,
      take: limit,
    });

    // Obtener el total para paginación
    const totalSignatures = await db.contractSignature.count({ where: whereClause });

    // Calcular estadísticas
    const stats = await db.contractSignature.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const statsMap = stats.reduce(
      (acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    // Transformar datos para el formato esperado
    const transformedSignatures = signatures.map(signature => ({
      id: signature.id,
      contractId: signature.contractId,
      contractTitle: signature.contract?.contractNumber || 'Contrato sin título',
      signerName: signature.signer?.name || 'Firmante desconocido',
      signerEmail: signature.signer?.email || 'Sin email',
      signerRole: signature.signer?.role || 'unknown',
      status: signature.status,
      signedAt: signature.signedAt?.toISOString(),
      expiresAt: signature.expiresAt?.toISOString(),
      provider: signature.signatureProvider || 'Desconocido',
      ipAddress: '', // Campo no disponible en este modelo
      userAgent: '', // Campo no disponible en este modelo
    }));

    return NextResponse.json({
      success: true,
      signatures: transformedSignatures,
      pagination: {
        page,
        limit,
        total: totalSignatures,
        pages: Math.ceil(totalSignatures / limit),
      },
      stats: {
        totalSignatures,
        signed: statsMap['signed'] || 0,
        pending: statsMap['pending'] || 0,
        expired: statsMap['expired'] || 0,
        cancelled: statsMap['cancelled'] || 0,
      },
    });
  } catch (error) {
    logger.error('Error en GET /api/support/signatures:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
