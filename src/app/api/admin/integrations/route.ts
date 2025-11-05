import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/api-error-handler';

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
  {
    id: 'twilio',
    name: 'Twilio SMS',
    description: 'Configuración para envío de SMS con Twilio',
    category: 'communication',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      accountSid: '',
      authToken: '',
      phoneNumber: '',
      apiUrl: 'https://api.twilio.com/2010-04-01',
    },
  },
  {
    id: 'sendgrid',
    name: 'SendGrid Email',
    description: 'Configuración para envío de emails con SendGrid',
    category: 'communication',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      apiKey: '',
      fromEmail: 'noreply@rent360.cl',
      fromName: 'Rent360',
      apiUrl: 'https://api.sendgrid.com/v3',
    },
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Configuración para seguimiento de analíticas',
    category: 'analytics',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      trackingId: '',
      measurementId: '',
      apiSecret: '',
    },
  },
  {
    id: 'aws-s3',
    name: 'AWS S3 Storage',
    description: 'Configuración para almacenamiento en AWS S3',
    category: 'storage',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      bucketName: '',
    },
  },
  {
    id: 'digitalocean-spaces',
    name: 'DigitalOcean Spaces',
    description: 'Configuración para almacenamiento en DigitalOcean Spaces',
    category: 'storage',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'nyc3',
      bucketName: '',
      endpoint: '',
    },
  },
  {
    id: 'pusher',
    name: 'Pusher WebSocket',
    description:
      'Configuración para notificaciones en tiempo real con Pusher (recomendado para DigitalOcean)',
    category: 'communication',
    isEnabled: false,
    isConfigured: false,
    isTested: false,
    config: {
      appId: '',
      key: '',
      secret: '',
      cluster: 'us2',
      encrypted: true,
    },
  },
  {
    id: 'socket-io',
    name: 'Socket.io (Propio)',
    description: 'WebSocket usando Socket.io del servidor propio (sin costo adicional)',
    category: 'communication',
    isEnabled: true, // ✅ Habilitado por defecto
    isConfigured: true, // ✅ Pre-configurado
    isTested: false,
    config: {
      serverUrl: 'https://rent360management-2yxgz.ondigitalocean.app',
      namespace: '/',
      allowedOrigins: 'https://rent360management-2yxgz.ondigitalocean.app',
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
      const savedConfig = savedConfigs.find(
        config => config.key === `integration_${integration.id}`
      );

      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig.value);
          return {
            ...integration,
            ...parsedConfig,
          };
        } catch (error) {
          logger.error('Error parsing config for integration:', {
            integrationId: integration.id,
            error: error instanceof Error ? error.message : String(error),
          });
          return integration;
        }
      }

      return integration;
    });

    return NextResponse.json({
      integrations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const user = requireAuth(request);
    requireRole(request, 'admin');

    const body = await request.json();
    const {
      id,
      name,
      description,
      category,
      isEnabled,
      isConfigured,
      isTested,
      config,
      testResult,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de integración requerido' }, { status: 400 });
    }

    // Validar que la integración existe
    const integrationExists = DEFAULT_INTEGRATIONS.find(i => i.id === id);
    if (!integrationExists) {
      return NextResponse.json({ error: 'Integración no válida' }, { status: 400 });
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
    return handleApiError(error);
  }
}

async function updateEnvironmentVariables(integrationId: string, config: any) {
  // Esta función actualizaría las variables de entorno dinámicamente
  // En una implementación real, esto podría requerir reiniciar el servidor
  // o usar un sistema de configuración dinámica

  const envMappings: Record<string, Record<string, string>> = {
    khipu: {
      KHIPU_API_URL: config.apiUrl,
      KHIPU_SECRET_KEY: config.secretKey,
      KHIPU_RECEIVER_ID: config.receiverId,
      KHIPU_ENVIRONMENT: config.environment,
    },
    esign: {
      ESIGN_API_URL: config.apiUrl,
      ESIGN_API_KEY: config.apiKey,
      ESIGN_SECRET_KEY: config.secretKey,
      ESIGN_ENVIRONMENT: config.environment,
    },
    firmasimple: {
      FIRMASIMPLE_API_URL: config.apiUrl,
      FIRMASIMPLE_API_KEY: config.apiKey,
      FIRMASIMPLE_CLIENT_ID: config.clientId,
      FIRMASIMPLE_CALLBACK_URL: config.callbackUrl,
    },
    firmachile: {
      FIRMACHILE_API_URL: config.apiUrl,
      FIRMACHILE_API_KEY: config.apiKey,
      FIRMACHILE_CERTIFICATE_AUTHORITY: config.certificateAuthority,
    },
    smtp: {
      SMTP_HOST: config.host,
      SMTP_PORT: config.port,
      SMTP_USERNAME: config.username,
      SMTP_PASSWORD: config.password,
      FROM_EMAIL: config.fromEmail,
      FROM_NAME: config.fromName,
    },
    sms: {
      SMS_API_URL: config.apiUrl,
      SMS_API_KEY: config.apiKey,
      SMS_SENDER_ID: config.senderId,
    },
    'google-maps': {
      GOOGLE_MAPS_API_KEY: config.apiKey,
      GOOGLE_ANALYTICS_ID: config.analyticsId,
    },
    twilio: {
      TWILIO_ACCOUNT_SID: config.accountSid,
      TWILIO_AUTH_TOKEN: config.authToken,
      TWILIO_PHONE_NUMBER: config.phoneNumber,
    },
    sendgrid: {
      SENDGRID_API_KEY: config.apiKey,
      SENDGRID_FROM_EMAIL: config.fromEmail,
      SENDGRID_FROM_NAME: config.fromName,
    },
    'google-analytics': {
      GOOGLE_ANALYTICS_TRACKING_ID: config.trackingId,
      GOOGLE_ANALYTICS_MEASUREMENT_ID: config.measurementId,
      GOOGLE_ANALYTICS_API_SECRET: config.apiSecret,
    },
    'aws-s3': {
      AWS_ACCESS_KEY_ID: config.accessKeyId,
      AWS_SECRET_ACCESS_KEY: config.secretAccessKey,
      AWS_REGION: config.region,
      AWS_S3_BUCKET_NAME: config.bucketName,
    },
    'digitalocean-spaces': {
      DO_SPACES_ACCESS_KEY: config.accessKeyId,
      DO_SPACES_SECRET_KEY: config.secretAccessKey,
      DO_SPACES_REGION: config.region,
      DO_SPACES_BUCKET: config.bucketName,
      DO_SPACES_ENDPOINT: config.endpoint,
    },
    pusher: {
      PUSHER_APP_ID: config.appId,
      PUSHER_KEY: config.key,
      PUSHER_SECRET: config.secret,
      PUSHER_CLUSTER: config.cluster,
      NEXT_PUBLIC_PUSHER_KEY: config.key,
      NEXT_PUBLIC_PUSHER_CLUSTER: config.cluster,
    },
    'socket-io': {
      NEXT_PUBLIC_WS_URL: config.serverUrl,
      JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret', // Necesario para WebSocket auth
      ALLOWED_ORIGINS:
        config.allowedOrigins || 'https://rent360management-2yxgz.ondigitalocean.app',
    },
  };

  const mappings = envMappings[integrationId];
  if (mappings) {
    // En una implementación real, aquí se actualizarían las variables de entorno
    // Por ahora, solo registramos la actualización
    logger.info('Actualizando variables de entorno para integración:', { integrationId, mappings });
  }
}
