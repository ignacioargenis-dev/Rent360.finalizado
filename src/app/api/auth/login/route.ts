import { NextRequest } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { generateTokens, setAuthCookies, verifyPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-edge';
import { notificationService } from '@/lib/notifications';
import { auditService } from '@/lib/audit';
import { apiWrapper, createSuccessResponse, createErrorResponse } from '@/lib/api-wrapper';
import { AuthenticationError, ValidationError } from '@/middleware/error-handler';

async function loginHandler(request: NextRequest) {
  let data: any;
  try {
    const startTime = Date.now();
    logger.info( 'Iniciando proceso de login', { request });
    
    data = await request.json();
    logger.debug('Datos de login recibidos', { email: data.email });

    // Validar los datos de entrada
    const validatedData = loginSchema.parse(data);
    logger.debug('Datos de login validados exitosamente');

    const { email, password } = validatedData;

    logger.debug('Buscando usuario en base de datos');
    
    // Usar Prisma para buscar usuario
    const user = await db.User.findUnique({
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

      // Registrar intento de login con usuario inexistente
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      await auditService.logUnauthorizedAccess(null, 'login_user_not_found', 'user', clientIP, userAgent);

      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 },
      );
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      logger.warn('Intento de login con cuenta inactiva', { userId: user.id, email });

      // Registrar intento de login con cuenta inactiva
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      await auditService.logUnauthorizedAccess(user.id, 'login_account_inactive', 'user', clientIP, userAgent);

      return NextResponse.json(
        { error: 'Tu cuenta ha sido desactivada' },
        { status: 403 },
      );
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      logger.warn('Intento de login con contraseña incorrecta', { email });

      // Registrar intento de login fallido
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      await auditService.logUnauthorizedAccess(user.id, 'login_failed', 'user', clientIP, userAgent);

      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 },
      );
    }

    // Determinar el rol del usuario
    const role = user.role.toLowerCase();

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.email,
      role,
      user.name,
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

    // Registrar evento de auditoría
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await auditService.logLogin(user.id, clientIP, userAgent);

    const duration = Date.now() - startTime;
    logger.info(
      'Login exitoso',
      {
        userId: user.id,
        userRole: role,
        duration,
      },
    );

    // Crear notificación de bienvenida usando template
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
    timeout: 30000 // 30 segundos timeout
  }
);
