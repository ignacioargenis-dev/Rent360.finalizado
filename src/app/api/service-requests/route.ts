import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger-minimal';

/**
 * API para que propietarios e inquilinos creen solicitudes de servicio
 * Estas solicitudes aparecerán en el marketplace para corredores
 */

const createRequestSchema = z.object({
  requestType: z.enum([
    'PROPERTY_MANAGEMENT',
    'PROPERTY_SALE',
    'PROPERTY_SEARCH',
    'TENANT_SEARCH',
    'CONSULTATION',
  ]),
  title: z.string().min(10, 'Título muy corto').max(200, 'Título muy largo'),
  description: z.string().min(50, 'Descripción muy corta').max(2000, 'Descripción muy larga'),
  urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
  budget: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  locations: z.array(z.string()).optional(),
  propertyTypes: z.array(z.string()).optional(),
  expiresInDays: z.number().min(1).max(90).optional().default(30),
});

/**
 * GET - Listar mis solicitudes de servicio
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo OWNER y TENANT pueden ver sus solicitudes
    if (user.role !== 'OWNER' && user.role !== 'TENANT') {
      return NextResponse.json(
        { success: false, error: 'Solo propietarios e inquilinos pueden crear solicitudes' },
        { status: 403 }
      );
    }

    const userId = user.id;
    const status = request.nextUrl.searchParams.get('status');

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const requests = await db.brokerServiceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedBroker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        responses: {
          orderBy: { createdAt: 'desc' },
          include: {
            broker: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    logger.error('Error fetching service requests', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener solicitudes' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear nueva solicitud de servicio
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo OWNER y TENANT pueden crear solicitudes
    if (user.role !== 'OWNER' && user.role !== 'TENANT') {
      return NextResponse.json(
        { success: false, error: 'Solo propietarios e inquilinos pueden crear solicitudes' },
        { status: 403 }
      );
    }

    const userId = user.id;
    const body = await request.json();
    const data = createRequestSchema.parse(body);

    logger.info('📝 Creating service request', {
      userId,
      type: data.requestType,
      urgency: data.urgency,
    });

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

    // Determinar userType basado en el role
    const userType = user.role === 'OWNER' ? 'OWNER' : 'TENANT';

    // Crear solicitud
    const serviceRequest = await db.brokerServiceRequest.create({
      data: {
        userId,
        userType,
        requestType: data.requestType,
        title: data.title,
        description: data.description,
        urgency: data.urgency,
        ...(data.budget && { budget: JSON.stringify(data.budget) }),
        ...(data.locations && { locations: JSON.stringify(data.locations) }),
        ...(data.propertyTypes && { propertyTypes: JSON.stringify(data.propertyTypes) }),
        expiresAt,
        status: 'OPEN',
      },
      include: {
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    logger.info('✅ Service request created', {
      userId,
      requestId: serviceRequest.id,
      type: data.requestType,
    });

    return NextResponse.json(
      {
        success: true,
        data: serviceRequest,
        message: 'Solicitud publicada exitosamente. Los corredores podrán verla y responder.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating service request', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al crear solicitud' },
      { status: 500 }
    );
  }
}
