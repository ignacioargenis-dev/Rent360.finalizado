import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { backupManager } from '@/lib/backup-manager';
import { logger } from '@/lib/logger';
import { ValidationError, handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

// Esquemas de validación
const backupRequestSchema = z.object({
  type: z.enum(['manual', 'daily', 'weekly', 'monthly']).default('manual'),
});

const restoreRequestSchema = z.object({
  backupId: z.string().min(1, 'ID de backup requerido'),
});

const configUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  schedule: z.object({
    daily: z.boolean().optional(),
    weekly: z.boolean().optional(),
    monthly: z.boolean().optional(),
    customCron: z.string().optional(),
  }).optional(),
  retention: z.object({
    daily: z.number().positive().optional(),
    weekly: z.number().positive().optional(),
    monthly: z.number().positive().optional(),
  }).optional(),
  compression: z.boolean().optional(),
  encryption: z.boolean().optional(),
});

// GET /api/admin/backups - Obtener historial de backups
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');

    logger.info('Obteniendo historial de backups', {
      userId: user.id,
      limit,
      type
    });

    const history = backupManager.getBackupHistory(limit);
    const config = backupManager.getConfig();

    // Filtrar por tipo si se especifica
    let filteredHistory = history;
    if (type) {
      filteredHistory = history.filter(backup => backup.type === type);
    }

    // Obtener estadísticas
    const stats = {
      total: history.length,
      successful: history.filter(b => b.status === 'success').length,
      failed: history.filter(b => b.status === 'failed').length,
      byType: history.reduce((acc, backup) => {
        acc[backup.type] = (acc[backup.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      lastBackup: history.length > 0 ? history[0] : null,
      totalSize: history.reduce((sum, backup) => sum + backup.size, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        history: filteredHistory,
        config,
        stats,
      },
    });

  } catch (error) {
    logger.error('Error obteniendo historial de backups:', {
      error: error instanceof Error ? error.message : String(error)
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

// POST /api/admin/backups - Crear nuevo backup
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    const body = await request.json();
    const validatedData = backupRequestSchema.parse(body);

    logger.info('Iniciando backup manual', {
      userId: user.id,
      type: validatedData.type,
    });

    // Verificar que no haya un backup en ejecución
    const config = backupManager.getConfig();
    if (!config.enabled) {
      throw new ValidationError('El sistema de backup está deshabilitado');
    }

    // Ejecutar backup
    const result = await backupManager.performBackup(validatedData.type);

    logger.info('Backup manual completado', {
      userId: user.id,
      backupId: result.id,
      type: result.type,
      size: result.size,
      duration: result.duration,
      status: result.status,
    });

    return NextResponse.json({
      success: true,
      message: `Backup ${result.type} completado exitosamente`,
      data: result,
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creando backup:', {
      error: error instanceof Error ? error.message : String(error)
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

// PUT /api/admin/backups/config - Actualizar configuración
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    const body = await request.json();
    const validatedData = configUpdateSchema.parse(body);

    logger.info('Actualizando configuración de backup', {
      userId: user.id,
      config: validatedData,
    });

    // Actualizar configuración
    backupManager.updateConfig(validatedData as any);

    const newConfig = backupManager.getConfig();

    logger.info('Configuración de backup actualizada exitosamente', {
      userId: user.id,
      newConfig,
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración de backup actualizada exitosamente',
      data: newConfig,
    });

  } catch (error) {
    logger.error('Error actualizando configuración de backup:', {
      error: error instanceof Error ? error.message : String(error)
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

// Funciones helper para otros métodos HTTP

// PATCH /api/admin/backups/{id}/restore - Restaurar backup
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    const body = await request.json();
    const validatedData = restoreRequestSchema.parse(body);

    logger.info('Iniciando restauración de backup', {
      userId: user.id,
      backupId: validatedData.backupId,
    });

    // Ejecutar restauración
    await backupManager.restoreBackup(validatedData.backupId);

    logger.info('Restauración de backup completada', {
      userId: user.id,
      backupId: validatedData.backupId,
    });

    return NextResponse.json({
      success: true,
      message: 'Backup restaurado exitosamente',
    });

  } catch (error) {
    logger.error('Error restaurando backup:', {
      error: error instanceof Error ? error.message : String(error)
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
