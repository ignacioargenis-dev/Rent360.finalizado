import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('serviceType');
    const city = searchParams.get('city');
    const verified = searchParams.get('verified');

    // Construir filtros
    const where: any = {
      status: 'ACTIVE', // Solo proveedores activos
    };

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    if (verified === 'true') {
      where.isVerified = true;
    }

    const providers = await db.serviceProvider.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ rating: 'desc' }, { completedJobs: 'desc' }],
      take: 50, // Limitar resultados
    });

    logger.info(`Service providers loaded: ${providers.length} providers`);

    return NextResponse.json({
      success: true,
      providers,
      count: providers.length,
    });
  } catch (error) {
    logger.error('Error fetching service providers:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener proveedores de servicios' },
      { status: 500 }
    );
  }
}
