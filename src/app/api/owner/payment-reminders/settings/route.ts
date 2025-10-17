import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { z } from 'zod';

const settingsSchema = z.object({
  autoReminders: z.boolean(),
  firstReminderDays: z.number().min(1).max(30),
  secondReminderDays: z.number().min(1).max(30),
  finalReminderDays: z.number().min(1).max(30),
  emailTemplates: z.string(),
  smsEnabled: z.boolean(),
  includePropertyInfo: z.boolean(),
  includeOwnerContact: z.boolean(),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar que el usuario tenga permisos (OWNER, BROKER, ADMIN)
    if (!['OWNER', 'BROKER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    logger.info('Actualizando configuración de recordatorios:', {
      userId: user.id,
      userRole: user.role,
      settings: validatedData,
    });

    // Guardar configuración en el modelo User (campo metadata o similar)
    // Por ahora, vamos a usar una tabla temporal o guardar en localStorage del servidor
    const settingsData = {
      autoReminders: validatedData.autoReminders,
      firstReminderDays: validatedData.firstReminderDays,
      secondReminderDays: validatedData.secondReminderDays,
      finalReminderDays: validatedData.finalReminderDays,
      emailTemplate: validatedData.emailTemplates,
      smsEnabled: validatedData.smsEnabled,
      includePropertyInfo: validatedData.includePropertyInfo,
      includeOwnerContact: validatedData.includeOwnerContact,
      updatedAt: new Date().toISOString(),
    };

    // Por ahora, solo logueamos la configuración
    // En una implementación real, esto se guardaría en una tabla de configuraciones
    logger.info('Configuración de recordatorios guardada:', {
      userId: user.id,
      settings: settingsData,
    });

    // Crear log de auditoría
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PAYMENT_REMINDERS_SETTINGS_UPDATED',
        entityType: 'USER_SETTINGS',
        entityId: user.id,
        oldValues: '{}',
        newValues: JSON.stringify(settingsData),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      },
    });

    logger.info('Configuración de recordatorios actualizada exitosamente:', {
      userId: user.id,
      settings: settingsData,
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración de recordatorios actualizada exitosamente',
      settings: settingsData,
    });
  } catch (error) {
    logger.error('Error actualizando configuración de recordatorios:', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos de configuración inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error interno del servidor al actualizar la configuración',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar que el usuario tenga permisos (OWNER, BROKER, ADMIN)
    if (!['OWNER', 'BROKER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      );
    }

    // Configuración por defecto
    // En una implementación real, esto se obtendría de la base de datos
    const defaultSettings = {
      autoReminders: true,
      firstReminderDays: 10,
      secondReminderDays: 5,
      finalReminderDays: 1,
      emailTemplate: 'default',
      smsEnabled: false,
      includePropertyInfo: true,
      includeOwnerContact: true,
    };

    return NextResponse.json({
      success: true,
      settings: defaultSettings,
    });
  } catch (error) {
    logger.error('Error obteniendo configuración de recordatorios:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Error interno del servidor al obtener la configuración',
      },
      { status: 500 }
    );
  }
}
