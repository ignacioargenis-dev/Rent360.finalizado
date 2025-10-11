import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';
import { validateQueryParams, validateSecurityHeaders } from '@/lib/security/input-validator';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'es',
  localeDetection: true,
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  // Skip middleware for static files and API routes - versión simplificada para producción
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/ping') ||
    pathname.startsWith('/api/test-users') ||
    pathname.startsWith('/api/test-settings') ||
    pathname.startsWith('/api/test-auth') ||
    pathname.startsWith('/api/debug') ||
    pathname.startsWith('/api/debug-simple') ||
    pathname.startsWith('/api/auth-status') ||
    pathname.startsWith('/api/debug-auth') ||
    pathname.startsWith('/api/debug-users') ||
    pathname.startsWith('/debug-auth.html') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/sw.js') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // CORS simplificado para producción
  const corsResponse = NextResponse.next();

  // Configuración CORS básica
  const origin = request.headers.get('origin') || '';
  const host = request.headers.get('host') || '';

  if (origin && (origin.includes(host) || host.includes('ondigitalocean.app'))) {
    corsResponse.headers.set('Access-Control-Allow-Origin', origin);
    corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    corsResponse.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    corsResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Manejar preflight requests
  if (request.method === 'OPTIONS') {
    return corsResponse;
  }

  // Validaciones simplificadas para resolver problemas en producción
  // Rate limiting y validaciones de seguridad desactivadas temporalmente
  // TODO: Reactivar después de resolver problemas iniciales de autenticación

  /*
  // Rate limiting
  const rateLimitResult = rateLimiter.checkLimit(request, 'default');
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded', {
      context: 'middleware.rate-limit',
      pathname,
      clientIP:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
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
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      }
    );
  }

  // Validate security headers
  const securityValidation = validateSecurityHeaders(request);
  if (!securityValidation.isValid) {
    logger.warn('Security validation failed', {
      warnings: securityValidation.warnings,
      pathname,
      context: 'middleware.security',
    });
  }

  // Validate query parameters for API routes
  if (pathname.startsWith('/api/')) {
    const queryValidation = validateQueryParams(request.nextUrl.searchParams);
    if (!queryValidation.isValid) {
      logger.warn('Query parameter validation failed', {
        error: queryValidation.error,
        pathname,
        context: 'middleware.query_validation',
      });

      return NextResponse.json(
        { error: queryValidation.error || 'Invalid query parameters' },
        { status: 400 }
      );
    }
  }
  */

  // Apply internationalization middleware
  const intlResult = intlMiddleware(request);

  // El intlMiddleware puede devolver NextResponse o el request original
  // Si devuelve NextResponse, usamos esa respuesta, si no, creamos una nueva
  let response: NextResponse;
  if (intlResult instanceof NextResponse) {
    response = intlResult;
  } else {
    response = NextResponse.next();
  }

  // Add security headers - Configuración de seguridad mejorada
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(self), usb=(), magnetometer=(), gyroscope=()'
  );
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Content Security Policy (CSP) - Configuración de seguridad mejorada
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://maps.googleapis.com https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://platform.twitter.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://*.stripe.com https://ui-avatars.com https://drive.google.com https://lh3.googleusercontent.com https://images.unsplash.com https://*.facebook.com https://*.twitter.com",
    "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://*.adobesign.com https://*.docusign.net https://api.hellosign.com https://api.trustfactory.cl https://api.firmapro.cl https://api.digitalsign.cl https://*.facebook.com https://*.twitter.com",
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://*.docusign.net https://www.google.com https://www.facebook.com https://platform.twitter.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
    'block-all-mixed-content',
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Debug CSP - temporal
  console.log('CSP applied:', csp);

  // Rate limiting headers (desactivado temporalmente)
  // response.headers.set('X-RateLimit-Limit', '100');
  // response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  // response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

  // Log request for monitoring
  const responseTime = Date.now() - startTime;
  if (responseTime > 1000) {
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
}

export const config = {
  matcher: ['/', '/(es|en)/:path*', '/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
