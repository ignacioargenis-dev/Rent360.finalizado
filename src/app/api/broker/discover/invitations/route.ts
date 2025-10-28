import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { CommissionValidator } from '@/lib/commission-validator';
import { NotificationService } from '@/lib/notification-service';

/**
 * API para gestionar invitaciones de corredores a usuarios
 */

const invitationSchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
  invitationType: z.enum([
    'SERVICE_OFFER',
    'PROPERTY_MANAGEMENT',
    'PROPERTY_VIEWING',
    'CONSULTATION',
  ]),
  subject: z.string().min(5, 'Asunto muy corto').max(200, 'Asunto muy largo'),
  message: z.string().min(20, 'Mensaje muy corto').max(2000, 'Mensaje muy largo'),
  servicesOffered: z.array(z.string()).optional(),
  proposedRate: z.number().min(0).max(100).optional(),
  expiresInDays: z.number().min(1).max(90).optional().default(30),
});

/**
 * GET - Listar invitaciones enviadas por el corredor
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'BROKER') {
      return NextResponse.json(
        { success: false, error: 'Solo corredores pueden acceder a esta función' },
        { status: 403 }
      );
    }

    const brokerId = session.user.id;
    const status = request.nextUrl.searchParams.get('status');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    const where: any = { brokerId };

    if (status) {
      where.status = status;
    }

    const invitations = await db.brokerInvitation.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            avatar: true,
          },
        },
        prospect: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    const total = await db.brokerInvitation.count({ where });

    // Estadísticas
    const stats = await db.brokerInvitation.groupBy({
      by: ['status'],
      where: { brokerId },
      _count: true,
    });

    const statsByStatus = Object.fromEntries(stats.map(s => [s.status, s._count]));

    return NextResponse.json({
      success: true,
      data: invitations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + invitations.length < total,
      },
      stats: statsByStatus,
    });
  } catch (error: any) {
    logger.error('Error fetching invitations', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener invitaciones' },
      { status: 500 }
    );
  }
}

/**
 * POST - Enviar nueva invitación
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'BROKER') {
      return NextResponse.json(
        { success: false, error: 'Solo corredores pueden enviar invitaciones' },
        { status: 403 }
      );
    }

    const brokerId = session.user.id;
    const body = await request.json();
    const data = invitationSchema.parse(body);

    logger.info('📨 Creating broker invitation', {
      brokerId,
      userId: data.userId,
      type: data.invitationType,
    });

    // Validar comisión propuesta
    if (data.proposedRate !== undefined && data.proposedRate !== null) {
      const validation = await CommissionValidator.validateProposedCommission(data.proposedRate);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: validation.error,
            maxCommissionRate: validation.maxRate,
          },
          { status: 400 }
        );
      }
    }

    // Verificar que el usuario existe
    const targetUser = await db.user.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        // Verificar si ya tiene relación activa
        clientRelationships: {
          where: {
            brokerId,
            status: 'ACTIVE',
          },
          select: { id: true },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!targetUser.isActive) {
      return NextResponse.json({ success: false, error: 'Usuario inactivo' }, { status: 400 });
    }

    // Verificar si ya tiene una relación activa
    if (targetUser.clientRelationships.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Este usuario ya es tu cliente activo' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una invitación pendiente
    const existingInvitation = await db.brokerInvitation.findFirst({
      where: {
        brokerId,
        userId: data.userId,
        status: {
          in: ['SENT', 'VIEWED'],
        },
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una invitación pendiente para este usuario' },
        { status: 400 }
      );
    }

    // Crear invitación
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

    const invitation = await db.brokerInvitation.create({
      data: {
        brokerId,
        userId: data.userId,
        invitationType: data.invitationType,
        subject: data.subject,
        message: data.message,
        servicesOffered: data.servicesOffered ? JSON.stringify(data.servicesOffered) : null,
        proposedRate: data.proposedRate,
        expiresAt,
        status: 'SENT',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    // Enviar notificación al usuario
    await NotificationService.notifyInvitationReceived({
      userId: data.userId,
      brokerName: session.user.name || 'Un corredor',
      brokerId,
      invitationType: data.invitationType,
      invitationId: invitation.id,
    }).catch(err => {
      logger.error('Error sending invitation notification', { error: err });
      // No fallar la creación si falla la notificación
    });

    logger.info('✅ Invitation created', {
      brokerId,
      invitationId: invitation.id,
      userId: data.userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: invitation,
        message: `Invitación enviada a ${targetUser.name}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating invitation', {
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
      { success: false, error: 'Error al crear invitación' },
      { status: 500 }
    );
  }
}
