import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { ValidationError, handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';
import * as crypto from 'crypto';

// Esquemas de validación
const settingSchema = z.object({
  key: z.string().min(1, 'Clave requerida'),
  value: z.string().min(1, 'Valor requerido'),
  description: z.string().optional(),
  category: z.enum([
    'system',
    'integration',
    'security',
    'email',
    'payment',
    'signature',
    'maps',
    'sms',
  ]),
  isActive: z.boolean().default(true),
});

const bulkUpdateSchema = z.object({
  settings: z.array(
    settingSchema.omit({ isActive: true }).extend({
      isActive: z.boolean().optional(),
    })
  ),
});

// Clave de encriptación (en producción usar variable de entorno)
const ENCRYPTION_KEY =
  process.env.SETTINGS_ENCRYPTION_KEY || 'default-encryption-key-32-chars-long';

// Función para encriptar valores sensibles
function encryptValue(value: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Función para desencriptar valores sensibles
function decryptValue(encryptedValue: string): string {
  try {
    const [ivHex, encrypted] = encryptedValue.split(':');

    // Validar que ambos valores existan y no sean undefined
    if (!ivHex || !encrypted) {
      logger.warn('Formato de valor encriptado inválido:', { encryptedValue });
      return encryptedValue;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Error desencriptando valor:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return encryptedValue; // Retornar valor original si falla la desencriptación
  }
}

// GET /api/admin/settings - Obtener todas las configuraciones
export async function GET(request: NextRequest) {
  try {
    console.error('🔍 [API SETTINGS GET] Request received');

    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    console.error('✅ [API SETTINGS GET] User authenticated:', {
      userId: user.id,
      role: user.role,
    });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeEncrypted = searchParams.get('includeEncrypted') === 'true';

    console.error('📋 [API SETTINGS GET] Query params:', { category, includeEncrypted });

    // Construir where clause
    const where: any = {};
    if (category) {
      where.category = category;
    }

    // Obtener configuraciones
    const settings = await db.systemSetting.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    console.error('📦 [API SETTINGS GET] Settings retrieved from DB:', {
      count: settings.length,
      sample: settings.slice(0, 2).map(s => ({ key: s.key, value: s.value, category: s.category })),
    });

    // Procesar configuraciones
    const processedSettings = settings.map(setting => {
      // Por ahora no hay encriptación implementada
      // TODO: Implementar encriptación de configuraciones sensibles cuando sea necesario
      const processed = {
        ...setting,
        value: setting.value,
      };

      return processed;
    });

    logger.info('Configuraciones del sistema obtenidas', {
      userId: user.id,
      count: processedSettings.length,
      category: category || 'all',
    });

    const responseData = {
      success: true,
      data: processedSettings,
    };

    console.error('📤 [API SETTINGS GET] Sending response:', {
      success: true,
      count: processedSettings.length,
      hasData: processedSettings.length > 0,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error obteniendo configuraciones:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error as Error);
    return errorResponse;
  }
}

// POST /api/admin/settings - Crear nueva configuración
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    const body = await request.json();
    const validatedData = settingSchema.parse(body);

    // Verificar si la configuración ya existe
    const existingSetting = await db.systemSetting.findUnique({
      where: { key: validatedData.key },
    });

    if (existingSetting) {
      throw new ValidationError('Ya existe una configuración con esta clave');
    }

    // Encriptar valor si es necesario
    // Por ahora no encriptamos valores - TODO: implementar encriptación cuando sea necesario
    let finalValue = validatedData.value;

    // Crear configuración
    const setting = await db.systemSetting.create({
      data: {
        key: validatedData.key,
        value: finalValue,
        description: validatedData.description ?? null,
        category: validatedData.category,
        // TODO: Implementar encriptación cuando sea necesario: validatedData.// TODO: Implementar encriptación cuando sea necesario,
        isActive: validatedData.isActive,
      },
    });

    logger.info('Configuración del sistema creada', {
      userId: user.id,
      key: setting.key,
      category: setting.category,
      // TODO: Implementar encriptación cuando sea necesario: setting.// TODO: Implementar encriptación cuando sea necesario
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Configuración creada exitosamente',
        data: {
          ...setting,
          value: setting.value, // TODO: Implementar encriptación cuando sea necesario
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creando configuración:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error as Error);
    return errorResponse;
  }
}

// PUT /api/admin/settings - Actualizar configuración existente
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    const body = await request.json();
    const { key, ...updateData } = body;

    if (!key) {
      throw new ValidationError('Clave de configuración requerida');
    }

    // Verificar que la configuración existe
    const existingSetting = await db.systemSetting.findUnique({
      where: { key },
    });

    if (!existingSetting) {
      throw new ValidationError('Configuración no encontrada');
    }

    // Validar datos de actualización
    const validatedData = settingSchema.partial().parse(updateData);

    // Encriptar valor si es necesario
    let finalValue = validatedData.value;
    // Por ahora no manejamos encriptación - TODO: implementar cuando sea necesario
    if (validatedData.value !== undefined) {
      finalValue = validatedData.value;
    }

    // Preparar datos limpios para Prisma (filtrar undefined)
    const prismaData: any = {
      value: finalValue !== undefined ? finalValue : existingSetting.value,
      updatedAt: new Date(),
    };

    // Solo incluir campos definidos (no undefined)
    if (validatedData.description !== undefined) {
      prismaData.description = validatedData.description ?? null;
    }
    if (validatedData.category !== undefined) {
      prismaData.category = validatedData.category;
    }
    if (validatedData.isActive !== undefined) {
      prismaData.isActive = validatedData.isActive;
    }

    // Actualizar configuración
    const updatedSetting = await db.systemSetting.update({
      where: { key },
      data: prismaData,
    });

    logger.info('Configuración del sistema actualizada', {
      userId: user.id,
      key: updatedSetting.key,
      category: updatedSetting.category,
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: {
        ...updatedSetting,
        value: updatedSetting.value, // TODO: Implementar encriptación cuando sea necesario
      },
    });
  } catch (error) {
    logger.error('Error actualizando configuración:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error as Error);
    return errorResponse;
  }
}

// PATCH /api/admin/settings - Actualización masiva de configuraciones
export async function PATCH(request: NextRequest) {
  try {
    console.error(
      '🔍 [API SETTINGS PATCH] Request received from:',
      request.headers.get('user-agent')?.slice(0, 50)
    );

    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    console.error('✅ [API SETTINGS PATCH] User authenticated:', {
      userId: user.id,
      role: user.role,
    });

    const body = await request.json();
    console.error('📦 [API SETTINGS PATCH] Body received:', {
      hasSettings: !!body.settings,
      settingsCount: body.settings?.length || 0,
      sample: body.settings?.slice(0, 2),
    });

    const validatedData = bulkUpdateSchema.parse(body);
    console.error('✅ [API SETTINGS PATCH] Data validated successfully:', {
      settingsToProcess: validatedData.settings.length,
    });

    const results = [];

    for (const settingData of validatedData.settings) {
      try {
        // Verificar si la configuración existe
        const existingSetting = await db.systemSetting.findUnique({
          where: { key: settingData.key },
        });

        // Por ahora no encriptamos - TODO: implementar encriptación
        let finalValue = settingData.value;

        if (existingSetting) {
          // Preparar datos limpios para bulk update (filtrar undefined)
          const bulkUpdateData: any = {
            value: finalValue,
            updatedAt: new Date(),
          };

          // Solo incluir campos definidos (no undefined)
          if (settingData.description !== undefined) {
            bulkUpdateData.description = settingData.description ?? null;
          }
          if (settingData.category !== undefined) {
            bulkUpdateData.category = settingData.category;
          }
          if (settingData.isActive !== undefined) {
            bulkUpdateData.isActive = settingData.isActive;
          }

          // Actualizar configuración existente
          const updatedSetting = await db.systemSetting.update({
            where: { key: settingData.key },
            data: bulkUpdateData,
          });

          results.push({
            key: settingData.key,
            action: 'updated',
            success: true,
            data: {
              ...updatedSetting,
              value: updatedSetting.value, // TODO: Implementar encriptación cuando sea necesario
            },
          });
        } else {
          // Preparar datos limpios para bulk create (filtrar undefined)
          const bulkCreateData: any = {
            key: settingData.key,
            value: finalValue,
          };

          // Solo incluir campos definidos (no undefined)
          if (settingData.description !== undefined) {
            bulkCreateData.description = settingData.description ?? null;
          }
          if (settingData.category !== undefined) {
            bulkCreateData.category = settingData.category;
          }
          if (settingData.isActive !== undefined) {
            bulkCreateData.isActive = settingData.isActive;
          }

          // Crear nueva configuración
          const newSetting = await db.systemSetting.create({
            data: bulkCreateData,
          });

          results.push({
            key: settingData.key,
            action: 'created',
            success: true,
            data: {
              ...newSetting,
              value: newSetting.value, // TODO: Implementar encriptación cuando sea necesario
            },
          });
        }
      } catch (error) {
        results.push({
          key: settingData.key,
          action: 'failed',
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.error('✅ [API SETTINGS PATCH] Processing completed:', {
      total: results.length,
      success: successCount,
      failures: failureCount,
      created: results.filter(r => r.action === 'created').length,
      updated: results.filter(r => r.action === 'updated').length,
      failed: results.filter(r => r.action === 'failed').length,
    });

    if (failureCount > 0) {
      console.error(
        '❌ [API SETTINGS PATCH] Failed settings:',
        results.filter(r => !r.success).map(r => ({ key: r.key, error: r.error }))
      );
    }

    logger.info('Actualización masiva de configuraciones completada', {
      userId: user.id,
      total: results.length,
      success: successCount,
      failures: failureCount,
    });

    const responseData = {
      success: true,
      message: `Actualización masiva completada: ${successCount} exitosas, ${failureCount} fallidas`,
      count: successCount,
      data: results,
    };

    console.error('📤 [API SETTINGS PATCH] Sending response:', {
      success: true,
      count: successCount,
      total: results.length,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error en actualización masiva de configuraciones:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error as Error);
    return errorResponse;
  }
}

// DELETE /api/admin/settings - Eliminar configuración
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      throw new ValidationError('Clave de configuración requerida');
    }

    // Verificar que la configuración existe
    const existingSetting = await db.systemSetting.findUnique({
      where: { key },
    });

    if (!existingSetting) {
      throw new ValidationError('Configuración no encontrada');
    }

    // Eliminar configuración
    await db.systemSetting.delete({
      where: { key },
    });

    logger.info('Configuración del sistema eliminada', {
      userId: user.id,
      key: key,
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración eliminada exitosamente',
    });
  } catch (error) {
    logger.error('Error eliminando configuración:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error as Error);
    return errorResponse;
  }
}
