import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { getUserFromRequest } from '@/lib/auth-token-validator';
import { z } from 'zod';

const reportSchema = z.object({
  reportedUserId: z.string(),
  reason: z.enum(['spam', 'harassment', 'inappropriate_content', 'scam', 'fake_profile', 'other']),
  description: z.string().min(10).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    // Validar token
    console.log('📢 REPORT API: Iniciando reporte de usuario');
    const decoded = await getUserFromRequest(request);

    if (!decoded) {
      console.error('📢 REPORT API: NO SE PUDO VALIDAR TOKEN');
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
        },
        { status: 401 }
      );
    }

    const user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    console.log('📢 REPORT API: Usuario autenticado:', user.email);

    // Validar datos
    const body = await request.json();
    const validatedData = reportSchema.parse(body);

    const { reportedUserId, reason, description } = validatedData;

    // Verificar que el usuario reportado existe
    const reportedUser = await db.user.findUnique({
      where: { id: reportedUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!reportedUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado',
        },
        { status: 404 }
      );
    }

    // Crear el reporte
    // TODO: Descomentar después de aplicar migración de Prisma en producción
    // const report = await db.userReport.create({
    const report = await (db as any).userReport.create({
      data: {
        reporterId: user.id,
        reportedUserId: reportedUserId,
        reason: reason,
        description: description,
        status: 'PENDING',
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    logger.info('Reporte de usuario creado', {
      reportId: report.id,
      reporterId: user.id,
      reportedUserId: reportedUserId,
      reason: reason,
    });

    // Crear notificación para admins y soporte
    const adminAndSupportUsers = await db.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPPORT'],
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    // Crear notificaciones para cada admin/support
    await Promise.all(
      adminAndSupportUsers.map(adminUser =>
        db.notification.create({
          data: {
            userId: adminUser.id,
            type: 'system_alert',
            title: 'Nuevo Reporte de Usuario',
            message: `${user.email} ha reportado a ${reportedUser.email} por ${reason}`,
            isRead: false,
            metadata: JSON.stringify({
              reportId: report.id,
              reportedUserId: reportedUserId,
              reason: reason,
            }),
          },
        })
      )
    );

    console.log('📢 REPORT API: Reporte creado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Reporte enviado exitosamente',
      report: {
        id: report.id,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.format(),
        },
        { status: 400 }
      );
    }

    logger.error('Error creando reporte de usuario', {
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
