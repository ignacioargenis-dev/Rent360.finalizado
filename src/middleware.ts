import { NextResponse, type NextRequest } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger-edge-runtime';
import { securityMiddleware } from '@/middleware/security';
import { authMiddleware } from '@/middleware/auth';

// Configuración de rate limiting por ruta
const rateLimitConfigs = {
  '/api/auth/login': 'auth-strict',
  '/api/auth/register': 'auth-strict',
  '/api/auth/me': 'auth-me', // Configuración específica para verificar sesión
  '/api/auth': 'auth',
  '/api/admin': 'admin',
  '/api/support': 'support',
  '/api/legal': 'legal',
  '/api/deposits': 'financial',
  '/api/payments': 'financial',
  '/api/properties': 'properties',
  '/api/users': 'users',
  '/api/contracts': 'contracts',
  '/api/tickets': 'tickets',
  '/api/reports': 'reports',
  '/api/backups': 'backups',
  '/api/database-stats': 'database-stats',
  '/api/health': 'health-unlimited',
};

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  logger.info('🔧 Middleware: Procesando request', {
    pathname,
    method: request.method,
  });

  // Skip middleware para archivos estáticos y API de health
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/health')
  ) {
    logger.info('🔧 Middleware: Saltando archivos estáticos', { pathname });
    return NextResponse.next();
  }

  try {
    // ✅ RE-HABILITADO: Middleware de seguridad y auth para APIs críticas
    // Aplicar middleware de seguridad solo para rutas que lo necesitan
    if (
      pathname.startsWith('/api/messages') ||
      pathname.startsWith('/api/contracts') ||
      pathname.startsWith('/api/payments') ||
      pathname.startsWith('/api/properties') ||
      pathname.startsWith('/api/users') ||
      pathname.startsWith('/api/support')
    ) {
      logger.info('🔧 Middleware: Aplicando middleware de seguridad y auth', { pathname });

      const securityResponse = await securityMiddleware(request);
      if (securityResponse) {
        logger.info('🔧 Middleware: Security middleware bloqueó la request', { pathname });
        return securityResponse;
      }

      const authResponse = await authMiddleware(request);
      if (authResponse) {
        logger.info('🔧 Middleware: Auth middleware bloqueó la request', { pathname });
        return authResponse;
      }

      logger.info('🔧 Middleware: Auth middleware completado exitosamente', { pathname });
    } else {
      logger.info('🔧 Middleware: Ruta no requiere auth middleware', { pathname });
    }
    // Determinar configuración de rate limiting basada en la ruta
    let rateLimitKey = 'default';
    for (const [route, config] of Object.entries(rateLimitConfigs)) {
      if (pathname.startsWith(route)) {
        rateLimitKey = config;
        break;
      }
    }

    // ✅ RESTAURADO: Rate limiting con límites más altos para evitar bloqueos
    const rateLimitResult = rateLimiter.checkLimit(request, rateLimitKey);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', {
        context: 'middleware.rate-limit',
        pathname,
        rateLimitKey,
        clientIP:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimitResult.message,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: rateLimitResult.statusCode || 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX_REQUESTS || '1000',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // ⚠️ MIDDLEWARE ULTRA-SIMPLIFICADO PARA DEBUGGING
    // TODO: Restaurar headers de seguridad cuando se confirme que el dashboard funciona

    const response = NextResponse.next();

    // ✅ RESTAURADO: Headers de seguridad básicos y esenciales
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

    // Headers de seguridad básicos (no restrictivos)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Headers de información
    response.headers.set('X-Powered-By', 'Rent360');
    response.headers.set('X-Application-Version', '1.0.0');

    // Log de la solicitud
    const responseTime = Date.now() - startTime;
    if (responseTime > 1000) {
      // Log solo solicitudes lentas (>1s)
      logger.warn('Slow request detected', {
        context: 'middleware.performance',
        pathname,
        method: request.method,
        responseTime,
        userAgent: request.headers.get('user-agent') || 'unknown',
        clientIP:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });
    }

    return response;
  } catch (error) {
    logger.error('Middleware error', {
      context: 'middleware.error',
      pathname,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // En caso de error, permitir que la solicitud continúe
    return NextResponse.next();
  }
  // Fallback explícito para satisfacer el tipo de retorno
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - Rutas públicas: /, /about, /features, /contact, /auth/*, /offline, /demo-fase1, /api/health, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|auth/|about|features|contact|offline|demo-fase1|api/health).*)',
  ],
};
