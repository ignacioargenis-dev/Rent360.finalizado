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

  // Skip middleware para archivos estáticos y API de health
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/health')
  ) {
    return NextResponse.next();
  }

  try {
    // Ejecutar middleware de seguridad avanzada primero
    const securityResponse = await securityMiddleware(request);
    if (securityResponse) {
      return securityResponse;
    }

    // Ejecutar middleware de autenticación
    const authResponse = await authMiddleware(request);
    if (authResponse) {
      return authResponse;
    }
    // Determinar configuración de rate limiting basada en la ruta
    let rateLimitKey = 'default';
    for (const [route, config] of Object.entries(rateLimitConfigs)) {
      if (pathname.startsWith(route)) {
        rateLimitKey = config;
        break;
      }
    }

    // ⚠️ RATE LIMITING TEMPORALMENTE DESHABILITADO PARA DEBUGGING
    // TODO: Re-habilitar cuando se confirme que el dashboard funciona

    // Aplicar rate limiting (COMENTADO TEMPORALMENTE)
    // const rateLimitResult = rateLimiter.checkLimit(request, rateLimitKey);

    // if (!rateLimitResult.allowed) {
    //   logger.warn('Rate limit exceeded', {
    //     context: 'middleware.rate-limit',
    //     pathname,
    //     rateLimitKey,
    //     clientIP:
    //       request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    //     userAgent: request.headers.get('user-agent') || 'unknown',
    //   });

    //   return NextResponse.json(
    //     {
    //       error: 'Rate limit exceeded',
    //       message: rateLimitResult.message,
    //       retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
    //     },
    //     {
    //       status: rateLimitResult.statusCode || 429,
    //       headers: {
    //         'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
    //         'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    //         'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    //         'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
    //       },
    //     }
    //   );

    // Crear respuesta con headers de rate limiting mejorados
    const response = NextResponse.next();

    // Agregar headers de seguridad avanzados
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(self), payment=()'
    );

    // ⚠️ TEMPORALMENTE DESHABILITADO: Estos headers bloqueaban la ejecución de Next.js
    // response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    // response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    // response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

    // Content Security Policy (CSP) optimizado para producción
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: blob: https: http: https://*.googleusercontent.com https://*.stripe.com https://ui-avatars.com https://images.unsplash.com",
      "connect-src 'self' https: wss: ws: https://api.stripe.com https://maps.googleapis.com https://*.adobesign.com https://*.docusign.net https://api.hellosign.com https://api.trustfactory.cl https://api.firmapro.cl https://api.digitalsign.cl",
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://*.docusign.net https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
      'block-all-mixed-content',
    ].join('; ');

    // Configuración CORS segura para producción
    const allowedOrigins =
      process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS || 'https://rent360.cl').split(',')
        : ['http://localhost:3000', 'http://localhost:3001'];

    const origin = request.headers.get('origin');
    const isAllowedOrigin = allowedOrigins.includes(origin || '');

    if (origin && !isAllowedOrigin) {
      return new Response('CORS policy violation', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Temporalmente deshabilitar CSP en producción para debugging
    if (process.env.NODE_ENV !== 'production') {
      response.headers.set('Content-Security-Policy', csp);
    }

    // Headers para forzar recarga del CSP y evitar cache
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // Agregar headers de performance
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

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
