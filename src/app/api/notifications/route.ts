import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Construir filtros
    const whereClause: any = {
      userId: user.id
    };
    
    if (unreadOnly) {
      whereClause.read = false;
    }

    // Obtener notificaciones del usuario
    const notifications = await db.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    });

    // Contar notificaciones no leídas
    const unreadCount = await db.notification.count({
      where: {
        userId: user.id,
        read: false
      }
    });

    // Transformar datos al formato esperado
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
    }));

    logger.info('Notificaciones obtenidas', {
      userId: user.id,
      count: transformedNotifications.length,
      unreadCount,
      unreadOnly
    });

    return NextResponse.json({
      success: true,
      data: transformedNotifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        total: notifications.length,
        hasMore: notifications.length === limit
      }
    });

  } catch (error) {
    logger.error('Error obteniendo notificaciones:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    
    const { title, message, type, metadata } = body;

    // Validar campos requeridos
    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Campos requeridos: title, message, type' },
        { status: 400 }
      );
    }

    // Crear notificación
    const notification = await db.notification.create({
      data: {
        userId: user.id,
        title,
        message,
        type,
        metadata: metadata ? JSON.stringify(metadata) : null,
        read: false
      }
    });

    logger.info('Notificación creada', {
      userId: user.id,
      notificationId: notification.id,
      type
    });

    return NextResponse.json({
      success: true,
      data: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
        metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
      }
    });

  } catch (error) {
    logger.error('Error creando notificación:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    
    const { notificationId, read } = body;

    if (!notificationId || typeof read !== 'boolean') {
      return NextResponse.json(
        { error: 'Campos requeridos: notificationId, read' },
        { status: 400 }
      );
    }

    // Actualizar notificación
    const notification = await db.notification.update({
      where: {
        id: notificationId,
        userId: user.id // Asegurar que el usuario es el propietario
      },
      data: {
        read
      }
    });

    logger.info('Notificación actualizada', {
      userId: user.id,
      notificationId,
      read
    });

    return NextResponse.json({
      success: true,
      data: {
        id: notification.id,
        read: notification.read
      }
    });

  } catch (error) {
    logger.error('Error actualizando notificación:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}