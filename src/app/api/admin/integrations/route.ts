import { logger } from '@/lib/logger-edge';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleError } from '@/lib/errors';

// Configuración por defecto de integraciones
const DEFAULT_INTEGRATIONS = [
  {
    id: 'khipu',
    name: 'Khipu - Pagos',
    description: 'Configuración para procesamiento de pagos con Khipu',
    category: 'payments',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      apiUrl: 'https://khipu.com/api/2.0',
      environment: 'test',
      secretKey: '',
      receiverId: '',
    },
  },
  {
    id: 'esign',
    name: 'eSign - Firma Avanzada',
    description: 'Configuración para eSign (firma avanzada y cualificada)',
    category: 'signature',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      apiUrl: 'https://api.esign.cl',
      apiKey: '',
      secretKey: '',
      environment: 'test',
    },
  },
  {
    id: 'firmasimple',
    name: 'FirmaSimple - Firma Avanzada',
    description: 'Configuración para FirmaSimple (firma avanzada)',
    category: 'signature',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      apiUrl: 'https://api.firmasimple.cl',
      apiKey: '',
      clientId: '',
      callbackUrl: 'https://rent360.cl/api/signatures/webhook',
    },
  },
  {
    id: 'firmachile',
    name: 'FirmaChile - Firma Cualificada',
    description: 'Configuración para FirmaChile (firma cualificada oficial)',
    category: 'signature',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      apiUrl: 'https://api.firmachile.cl',
      apiKey: '',
      certificateAuthority: '',
    },
  },
  {
    id: 'smtp',
    name: 'Email (SMTP)',
    description: 'Configuración para envío de emails',
    category: 'communication',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      host: 'smtp.gmail.com',
      port: '587',
      username: '',
      password: '',
      fromEmail: 'noreply@rent360.cl',
      fromName: 'Rent360',
    },
  },
  {
    id: 'sms',
    name: 'SMS',
    description: 'Configuración para envío de SMS',
    category: 'communication',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      apiUrl: 'https://api.sms-provider.cl',
      apiKey: '',
      senderId: 'Rent360',
    },
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Configuración para servicios de mapas y geolocalización',
    category: 'maps',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      apiKey: '',
      analyticsId: '',
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const user = requireAuth(request);
    requireRole(request, 'admin');

    // Obtener configuraciones guardadas de la base de datos
    const savedConfigs = await db.systemSetting.findMany({
      where: {
        key: {
          startsWith: 'integration_',
        },
      },
    });

    // Mapear configuraciones guardadas a las integraciones por defecto
    const integrations = DEFAULT_INTEGRATIONS.map(integration => {
      const savedConfig = savedConfigs.find(config => 
        config.key === `integration_${integration.id}`,
      );

      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig.value);
          return {
            ...integration,
            ...parsedConfig,
          };
        } catch (error) {
          logger.error('Error parsing config for integration:', { integrationId: integration.id, error: error instanceof Error ? error.message : String(error) });
          return integration;
        }
      }

      return integration;
    });

    return NextResponse.json({
      integrations,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const user = requireAuth(request);
    requireRole(request, 'admin');

    const body = await request.json();
    const { id, name, description, category, isEnabled, isConfigured, isTested, config, testResult } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de integración requerido' },
        { status: 400 },
      );
    }

    // Validar que la integración existe
    const integrationExists = DEFAULT_INTEGRATIONS.find(i => i.id === id);
    if (!integrationExists) {
      return NextResponse.json(
        { error: 'Integración no válida' },
        { status: 400 },
      );
    }

    // Preparar configuración para guardar
    const integrationConfig = {
      id,
      name,
      description,
      category,
      isEnabled,
      isConfigured,
      isTested,
      config,
      testResult,
      updatedAt: new Date().toISOString(),
    };

    // Guardar en la base de datos
    const configKey = `integration_${id}`;
    
    await db.systemSetting.upsert({
      where: { key: configKey },
      update: {
        value: JSON.stringify(integrationConfig),
        updatedAt: new Date(),
      },
      create: {
        key: configKey,
        value: JSON.stringify(integrationConfig),
        category: 'integrations',
        description: `Configuración de integración ${name}`,
        isSystem: false,
        isActive: true,
      },
    });

    // Actualizar variables de entorno si es necesario
    if (isEnabled && isConfigured) {
      await updateEnvironmentVariables(id, config);
    }

    return NextResponse.json({
      message: 'Configuración guardada exitosamente',
      integration: integrationConfig,
    });
  } catch (error) {
    return handleError(error);
  }
}

async function updateEnvironmentVariables(integrationId: string, config: any) {
  // Esta función actualizaría las variables de entorno dinámicamente
  // En una implementación real, esto podría requerir reiniciar el servidor
  // o usar un sistema de configuración dinámica
  
  const envMappings: Record<string, Record<string, string>> = {
    'khipu': {
      'KHIPU_API_URL': config.apiUrl,
      'KHIPU_SECRET_KEY': config.secretKey,
      'KHIPU_RECEIVER_ID': config.receiverId,
      'KHIPU_ENVIRONMENT': config.environment,
    },
         'esign': {
       'ESIGN_API_URL': config.apiUrl,
       'ESIGN_API_KEY': config.apiKey,
       'ESIGN_SECRET_KEY': config.secretKey,
       'ESIGN_ENVIRONMENT': config.environment,
     },
     'firmasimple': {
       'FIRMASIMPLE_API_URL': config.apiUrl,
       'FIRMASIMPLE_API_KEY': config.apiKey,
       'FIRMASIMPLE_CLIENT_ID': config.clientId,
       'FIRMASIMPLE_CALLBACK_URL': config.callbackUrl,
     },
     'firmachile': {
       'FIRMACHILE_API_URL': config.apiUrl,
       'FIRMACHILE_API_KEY': config.apiKey,
       'FIRMACHILE_CERTIFICATE_AUTHORITY': config.certificateAuthority,
     },
    'smtp': {
      'SMTP_HOST': config.host,
      'SMTP_PORT': config.port,
      'SMTP_USERNAME': config.username,
      'SMTP_PASSWORD': config.password,
      'FROM_EMAIL': config.fromEmail,
      'FROM_NAME': config.fromName,
    },
    'sms': {
      'SMS_API_URL': config.apiUrl,
      'SMS_API_KEY': config.apiKey,
      'SMS_SENDER_ID': config.senderId,
    },
    'google-maps': {
      'GOOGLE_MAPS_API_KEY': config.apiKey,
      'GOOGLE_ANALYTICS_ID': config.analyticsId,
    },
  };

  const mappings = envMappings[integrationId];
  if (mappings) {
    // En una implementación real, aquí se actualizarían las variables de entorno
    // Por ahora, solo registramos la actualización
    logger.info('Actualizando variables de entorno para integración:', { integrationId, mappings });
  }
}
