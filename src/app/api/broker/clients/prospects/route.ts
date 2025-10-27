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

    // Consultar usuarios OWNER que no están asociados con este corredor como prospects potenciales
    const prospectsRaw = await db.user.findMany({
      where: {
        role: 'OWNER',
        // Excluir usuarios que ya tienen propiedades con este corredor
        NOT: {
          properties: {
            some: {
              brokerId: user.id,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        createdAt: true,
        // Obtener estadísticas de interacciones
        _count: {
          select: {
            properties: true,
            contractsAsOwner: true,
            contractsAsTenant: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limitar a 50 prospects por página
    });

    // Transformar los datos al formato esperado por el frontend
    const prospects = prospectsRaw.map(prospect => ({
      id: prospect.id,
      name: prospect.name,
      email: prospect.email,
      phone: prospect.phone || '',
      interestedIn: [], // No tenemos esta info aún
      budget: { min: 0, max: 0 }, // No tenemos esta info aún
      preferredLocation: '', // No tenemos esta info aún
      status: 'active',
      source: 'website',
      createdAt: prospect.createdAt.toISOString(),
      lastContact: prospect.createdAt.toISOString(),
      notes: '',
      avatar: prospect.avatar,
      // Calcular algunos analytics basados en datos reales
      totalProperties: prospect._count.properties,
      totalContracts: prospect._count.contractsAsOwner + prospect._count.contractsAsTenant,
    }));

    logger.info('Prospects obtenidos para broker', {
      brokerId: user.id,
      count: prospects.length,
    });

    return NextResponse.json({
      success: true,
      data: prospects,
      pagination: {
        limit: 50,
        offset: 0,
        total: prospects.length,
        hasMore: false,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo prospects:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validar datos básicos
    const { name, email, phone } = data;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Nombre, email y teléfono son requeridos' },
        { status: 400 }
      );
    }

    // Por ahora, solo loggear ya que no hay modelo de prospects
    // En el futuro, esto debería crear un registro en la tabla de prospects
    logger.info('Nuevo prospect creado', {
      brokerId: user.id,
      prospectData: {
        name,
        email,
        phone,
        interestedIn: data.interestedIn || [],
        budget: data.budget || {},
        preferredLocation: data.preferredLocation || '',
        source: data.source || 'website',
      },
    });

    // Devolver respuesta mock por ahora
    const newProspect = {
      id: `temp_${Date.now()}`,
      name,
      email,
      phone,
      interestedIn: data.interestedIn || [],
      budget: data.budget || { min: 0, max: 0 },
      preferredLocation: data.preferredLocation || '',
      status: 'active',
      source: data.source || 'website',
      createdAt: new Date().toISOString(),
      lastContact: new Date().toISOString(),
      notes: data.notes || '',
    };

    return NextResponse.json({
      success: true,
      data: newProspect,
      message: 'Prospect creado exitosamente',
    });
  } catch (error) {
    logger.error('Error creando prospect:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
