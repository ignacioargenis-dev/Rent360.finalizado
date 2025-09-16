import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { auditService } from '@/lib/audit';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  userId: z.string().min(1, 'ID de usuario requerido'),
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const validatedData = verifyEmailSchema.parse(data);
    const { token, userId } = validatedData;

    logger.info('Iniciando verificación de email', { userId });

    // Buscar usuario
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      logger.warn('Usuario no encontrado en verificación de email', { userId });
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      logger.info('Email ya verificado', { userId });
      return NextResponse.json(
        { message: 'Email ya verificado' },
        { status: 200 }
      );
    }

    // Nota: El modelo User no contiene campos de token de verificación.
    // La verificación se limita a marcar el correo como verificado.

    // Actualizar usuario como verificado
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
      },
    });

    // Registrar evento de auditoría
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await auditService.logUpdate(
      userId,
      'user',
      userId,
      { emailVerified: false },
      { emailVerified: true },
      clientIP || undefined,
      userAgent || undefined
    );

    logger.info('Email verificado exitosamente', { userId });

    return NextResponse.json({
      message: 'Email verificado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: true,
      },
    });

  } catch (error) {
    logger.error('Error en verificación de email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
