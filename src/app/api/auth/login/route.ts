import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { generateTokens, setAuthCookies, verifyPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

// Importar servicios con manejo de errores
let auditService: any = null;
let notificationService: any = null;

try {
  const { auditService: audit } = await import('@/lib/audit');
  auditService = audit;
  logger.info('Audit service loaded successfully');
} catch (error) {
  logger.warn('Audit service not available, continuing without audit logging', { error });
}

try {
  const { notificationService: notifications } = await import('@/lib/notifications');
  notificationService = notifications;
  logger.info('Notification service loaded successfully');
} catch (error) {
  logger.warn('Notification service not available, continuing without notifications', { error });
}

// Importar apiWrapper para usar el wrapper robusto
import { apiWrapper } from '@/lib/api-wrapper';

async function loginHandler(request: NextRequest) {
  let data: any;
  try {
    const startTime = Date.now();
    logger.info('Iniciando proceso de login', { timestamp: new Date().toISOString() });

    data = await request.json();
    logger.debug('Datos de login recibidos', { email: data.email });

    // Validar los datos de entrada
    const validatedData = loginSchema.parse(data);
    logger.debug('Datos de login validados exitosamente');

    const { email, password } = validatedData;

    logger.debug('Buscando usuario en base de datos');

    // Usar Prisma para buscar usuario
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true,
        avatar: true,
      },
    });

    if (!user) {
      logger.warn('Intento de login con usuario inexistente', { email });

      // Registrar intento de login con usuario inexistente (si el servicio está disponible)
      if (auditService) {
        try {
          const clientIP =
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
          const userAgent = request.headers.get('user-agent') || 'unknown';
          await auditService.logUnauthorizedAccess(
            null,
            'login_user_not_found',
            'user',
            clientIP,
            userAgent
          );
        } catch (auditError) {
          logger.warn('Error registrando auditoría de login fallido', { auditError });
        }
      }

      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      logger.warn('Intento de login con cuenta inactiva', { userId: user.id, email });

      // Registrar intento de login con cuenta inactiva (si el servicio está disponible)
      if (auditService) {
        try {
          const clientIP =
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
          const userAgent = request.headers.get('user-agent') || 'unknown';
          await auditService.logUnauthorizedAccess(
            user.id,
            'login_account_inactive',
            'user',
            clientIP,
            userAgent
          );
        } catch (auditError) {
          logger.warn('Error registrando auditoría de cuenta inactiva', { auditError });
        }
      }

      return NextResponse.json({ error: 'Tu cuenta ha sido desactivada' }, { status: 403 });
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      logger.warn('Intento de login con contraseña incorrecta', { email });

      // Registrar intento de login fallido (si el servicio está disponible)
      if (auditService) {
        try {
          const clientIP =
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
          const userAgent = request.headers.get('user-agent') || 'unknown';
          await auditService.logUnauthorizedAccess(
            user.id,
            'login_failed',
            'user',
            clientIP,
            userAgent
          );
        } catch (auditError) {
          logger.warn('Error registrando auditoría de login fallido', { auditError });
        }
      }

      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Normalizar el rol a MAYÚSCULAS independientemente de cómo esté en la BD
    const role = user.role.toUpperCase();

    // Generar tokens
    console.log('🔐 Login: Generando tokens para usuario:', user.email, 'Rol:', role);
    console.log(
      '🔑 JWT_SECRET disponible:',
      !!process.env.JWT_SECRET,
      'Longitud:',
      process.env.JWT_SECRET?.length
    );

    logger.debug('Generando tokens para usuario', { email });
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, role, user.name);

    console.log(
      '✅ Login: Tokens generados exitosamente, longitud accessToken:',
      accessToken.length
    );

    // Crear respuesta con cookies
    const response = NextResponse.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
        avatar: user.avatar,
      },
    });

    // Establecer cookies HTTP-only
    setAuthCookies(response, accessToken, refreshToken);

    // Registrar evento de auditoría (si el servicio está disponible)
    if (auditService) {
      try {
        const clientIP =
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        await auditService.logLogin(user.id, clientIP, userAgent);
      } catch (auditError) {
        logger.warn('Error registrando auditoría de login exitoso', { auditError });
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Login exitoso', {
      userId: user.id,
      userRole: role,
      duration,
    });

    // Crear notificación de bienvenida (si el servicio está disponible)
    if (notificationService) {
      try {
        await notificationService.createSmartNotification(
          user.id,
          'system_alert' as any,
          {},
          {
            priority: 'high' as any,
            personalization: {
              action: 'login_success',
              timestamp: new Date().toISOString(),
            },
          }
        );
      } catch (error) {
        logger.warn('Error creando notificación de bienvenida', { error, userId: user.id });
      }
    }

    return response;
  } catch (error) {
    // Re-throw para que el wrapper maneje los errores
    throw error;
  }
}

export const POST = apiWrapper(
  { POST: loginHandler },
  {
    enableAudit: true,
    auditAction: 'user_login',
    timeout: 30000, // 30 segundos timeout
  }
);
