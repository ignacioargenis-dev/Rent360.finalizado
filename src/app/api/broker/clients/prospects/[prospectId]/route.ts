import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    console.log('🔍 [PROSPECT_DETAIL] Iniciando GET /api/broker/clients/prospects/[prospectId]');

    const user = await requireAuth(request);
    console.log('✅ [PROSPECT_DETAIL] Usuario autenticado:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    if (user.role !== 'BROKER') {
      console.log('❌ [PROSPECT_DETAIL] Usuario no es BROKER');
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;
    console.log('📋 [PROSPECT_DETAIL] Prospecto ID:', prospectId);

    // Buscar el prospecto (usuario OWNER o TENANT)
    const prospect = await db.user.findUnique({
      where: { id: prospectId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        rut: true,
        rutVerified: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        address: true,
        city: true,
        region: true,
        commune: true,
        createdAt: true,
        updatedAt: true,
        // Propiedades del usuario
        properties: {
          select: {
            id: true,
            title: true,
            address: true,
            price: true,
            type: true,
            status: true,
            createdAt: true,
          },
          take: 10, // Limitar a las últimas 10 propiedades
          orderBy: { createdAt: 'desc' },
        },
        // Contratos como propietario
        contractsAsOwner: {
          select: {
            id: true,
            status: true,
            monthlyRent: true,
            startDate: true,
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        // Contratos como inquilino
        contractsAsTenant: {
          select: {
            id: true,
            status: true,
            monthlyRent: true,
            startDate: true,
            property: {
              select: {
                title: true,
                address: true,
              },
            },
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!prospect) {
      console.log('❌ [PROSPECT_DETAIL] Prospecto no encontrado:', prospectId);
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    // Verificar que sea un prospecto válido (OWNER o TENANT)
    if (!['OWNER', 'TENANT'].includes(prospect.role)) {
      console.log('❌ [PROSPECT_DETAIL] Usuario no es OWNER o TENANT:', prospect.role);
      return NextResponse.json({ error: 'Usuario no válido como prospecto' }, { status: 400 });
    }

    // Calcular estadísticas adicionales
    const stats = {
      totalProperties: prospect.properties.length,
      activeContracts:
        prospect.contractsAsOwner.filter(c => c.status === 'ACTIVE').length +
        prospect.contractsAsTenant.filter(c => c.status === 'ACTIVE').length,
      totalContracts: prospect.contractsAsOwner.length + prospect.contractsAsTenant.length,
      recentActivity:
        prospect.properties.length +
        prospect.contractsAsOwner.length +
        prospect.contractsAsTenant.length,
    };

    console.log('✅ [PROSPECT_DETAIL] Prospecto encontrado:', {
      id: prospect.id,
      name: prospect.name,
      email: prospect.email,
      role: prospect.role,
      stats,
    });

    // Devolver datos del prospecto
    return NextResponse.json({
      success: true,
      ...prospect,
      stats,
    });
  } catch (error) {
    console.error('❌ [PROSPECT_DETAIL] Error:', error);
    logger.error('Error obteniendo detalle del prospecto:', {
      error: error instanceof Error ? error.message : String(error),
      prospectId: params.prospectId,
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
