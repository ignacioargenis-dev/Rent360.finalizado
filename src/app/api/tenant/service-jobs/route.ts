import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo tenants pueden ver sus service jobs
    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Solo inquilinos pueden ver sus trabajos de servicio' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {
      requesterId: user.id,
    };

    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    const jobs = await db.serviceJob.findMany({
      where: whereClause,
      include: {
        serviceProvider: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        requester: {
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
      take: limit,
      skip: offset,
    });

    const total = await db.serviceJob.count({ where: whereClause });

    logger.info('Service jobs del tenant obtenidos', {
      tenantId: user.id,
      count: jobs.length,
      status,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        serviceType: job.serviceType,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        completedDate: job.completedDate?.toISOString(),
        serviceProviderId: job.serviceProviderId,
        serviceProvider: {
          id: job.serviceProvider.id,
          businessName: job.serviceProvider.businessName,
          name: job.serviceProvider.user.name,
          email: job.serviceProvider.user.email,
        },
        property: {
          id: 'unknown',
          title: 'Propiedad no especificada',
          address: 'Dirección no disponible',
        },
        finalPrice: job.finalPrice,
        notes: job.notes,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo service jobs del tenant:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
