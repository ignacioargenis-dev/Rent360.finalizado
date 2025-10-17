import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

interface PlatformRetentionConfig {
  enabled: boolean;
  autoProcess: boolean;
  schedule: 'immediate' | 'weekly' | 'monthly';
  cutoffDay: number;
  platformFeePercentage: number;
  paymentProviderFeePercentage: number;
  minimumRetentionAmount: number;
  maximumRetentionAmount: number;
  defaultPaymentMethod: string;
  supportedPaymentMethods: string[];
  minimumPayout: number;
  maximumDailyPayout: number;
  requireApproval: boolean;
  approvalThreshold: number;
  requireKYC: boolean;
  requireBankVerification: boolean;
  fraudDetection: boolean;
}

/**
 * GET /api/admin/platform-retention-config
 * Obtiene la configuración de retención de la plataforma
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener configuración desde la base de datos
    const settings = await db.systemSetting.findMany({
      where: {
        category: 'platform_retention',
        isActive: true,
      },
    });

    // Configuración por defecto
    const defaultConfig: PlatformRetentionConfig = {
      enabled: true,
      autoProcess: true,
      schedule: 'monthly',
      cutoffDay: 1,
      platformFeePercentage: 5.0, // 5% por defecto
      paymentProviderFeePercentage: 1.0, // 1% por defecto
      minimumRetentionAmount: 5000, // $5.000 CLP
      maximumRetentionAmount: 1000000, // $1M CLP
      defaultPaymentMethod: 'bank_transfer',
      supportedPaymentMethods: ['bank_transfer', 'paypal'],
      minimumPayout: 50000, // $50.000 CLP
      maximumDailyPayout: 10000000, // $10M CLP
      requireApproval: false,
      approvalThreshold: 1000000, // $1M CLP
      requireKYC: true,
      requireBankVerification: true,
      fraudDetection: true,
    };

    // Aplicar configuraciones desde la base de datos
    const config = { ...defaultConfig };
    settings.forEach(setting => {
      switch (setting.key) {
        case 'enabled':
          config.enabled = setting.value === 'true';
          break;
        case 'autoProcess':
          config.autoProcess = setting.value === 'true';
          break;
        case 'schedule':
          config.schedule = setting.value as 'immediate' | 'weekly' | 'monthly';
          break;
        case 'cutoffDay':
          config.cutoffDay = parseInt(setting.value || '1');
          break;
        case 'platformFeePercentage':
          config.platformFeePercentage = parseFloat(setting.value || '5.0');
          break;
        case 'paymentProviderFeePercentage':
          config.paymentProviderFeePercentage = parseFloat(setting.value || '1.0');
          break;
        case 'minimumRetentionAmount':
          config.minimumRetentionAmount = parseInt(setting.value || '5000');
          break;
        case 'maximumRetentionAmount':
          config.maximumRetentionAmount = parseInt(setting.value || '1000000');
          break;
        case 'defaultPaymentMethod':
          config.defaultPaymentMethod = setting.value || 'bank_transfer';
          break;
        case 'supportedPaymentMethods':
          config.supportedPaymentMethods = JSON.parse(
            setting.value || '["bank_transfer", "paypal"]'
          );
          break;
        case 'minimumPayout':
          config.minimumPayout = parseInt(setting.value || '50000');
          break;
        case 'maximumDailyPayout':
          config.maximumDailyPayout = parseInt(setting.value || '10000000');
          break;
        case 'requireApproval':
          config.requireApproval = setting.value === 'true';
          break;
        case 'approvalThreshold':
          config.approvalThreshold = parseInt(setting.value || '1000000');
          break;
        case 'requireKYC':
          config.requireKYC = setting.value === 'true';
          break;
        case 'requireBankVerification':
          config.requireBankVerification = setting.value === 'true';
          break;
        case 'fraudDetection':
          config.fraudDetection = setting.value === 'true';
          break;
      }
    });

    logger.info('Configuración de retención obtenida', {
      userId: user.id,
      config: {
        enabled: config.enabled,
        platformFeePercentage: config.platformFeePercentage,
        schedule: config.schedule,
      },
    });

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    logger.error('Error obteniendo configuración de retención:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * POST /api/admin/platform-retention-config
 * Actualiza la configuración de retención de la plataforma
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { config }: { config: PlatformRetentionConfig } = body;

    if (!config) {
      return NextResponse.json({ error: 'Configuración requerida' }, { status: 400 });
    }

    // Validar configuración
    if (config.platformFeePercentage < 0 || config.platformFeePercentage > 100) {
      return NextResponse.json(
        { error: 'El porcentaje de retención de plataforma debe estar entre 0 y 100' },
        { status: 400 }
      );
    }

    if (config.paymentProviderFeePercentage < 0 || config.paymentProviderFeePercentage > 100) {
      return NextResponse.json(
        { error: 'El porcentaje de costo del proveedor debe estar entre 0 y 100' },
        { status: 400 }
      );
    }

    if (config.cutoffDay < 1 || config.cutoffDay > 31) {
      return NextResponse.json(
        { error: 'El día de corte debe estar entre 1 y 31' },
        { status: 400 }
      );
    }

    // Actualizar configuración en la base de datos
    const configUpdates = [
      { key: 'enabled', value: config.enabled.toString() },
      { key: 'autoProcess', value: config.autoProcess.toString() },
      { key: 'schedule', value: config.schedule },
      { key: 'cutoffDay', value: config.cutoffDay.toString() },
      { key: 'platformFeePercentage', value: config.platformFeePercentage.toString() },
      {
        key: 'paymentProviderFeePercentage',
        value: config.paymentProviderFeePercentage.toString(),
      },
      { key: 'minimumRetentionAmount', value: config.minimumRetentionAmount.toString() },
      { key: 'maximumRetentionAmount', value: config.maximumRetentionAmount.toString() },
      { key: 'defaultPaymentMethod', value: config.defaultPaymentMethod },
      { key: 'supportedPaymentMethods', value: JSON.stringify(config.supportedPaymentMethods) },
      { key: 'minimumPayout', value: config.minimumPayout.toString() },
      { key: 'maximumDailyPayout', value: config.maximumDailyPayout.toString() },
      { key: 'requireApproval', value: config.requireApproval.toString() },
      { key: 'approvalThreshold', value: config.approvalThreshold.toString() },
      { key: 'requireKYC', value: config.requireKYC.toString() },
      { key: 'requireBankVerification', value: config.requireBankVerification.toString() },
      { key: 'fraudDetection', value: config.fraudDetection.toString() },
    ];

    // Usar transacción para actualizar todas las configuraciones
    await db.$transaction(async tx => {
      for (const update of configUpdates) {
        await tx.systemSetting.upsert({
          where: {
            id: `${update.key}_platform_retention`,
          },
          update: {
            value: update.value,
            updatedAt: new Date(),
          },
          create: {
            id: `${update.key}_platform_retention`,
            category: 'platform_retention',
            key: update.key,
            value: update.value,
            description: `Configuración de retención: ${update.key}`,
            isActive: true,
          },
        });
      }
    });

    logger.info('Configuración de retención actualizada', {
      userId: user.id,
      config: {
        enabled: config.enabled,
        platformFeePercentage: config.platformFeePercentage,
        schedule: config.schedule,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración de retención actualizada exitosamente',
      config,
    });
  } catch (error) {
    logger.error('Error actualizando configuración de retención:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
