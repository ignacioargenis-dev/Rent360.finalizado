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

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/sw.js') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // CORS: permitir mismo origen y dominios de preview sin requerir configuración previa
  try {
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    const protocol = request.nextUrl.protocol || 'https:';
    const requestOrigin = `${protocol}//${host}`;

    const isSameOrigin = origin !== '' && origin === requestOrigin;
    const isPreviewHost = host.endsWith('.pages.dev') || host.endsWith('.vercel.app');

    const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
    const isEnvAllowed = origin !== '' && envAllowedOrigins.includes(origin);

    // Permitir si es mismo origen, si el host es de preview conocido o si está en la lista de env
    const isCorsAllowed = !origin || isSameOrigin || isPreviewHost || isEnvAllowed;

    if (!isCorsAllowed) {
      return new NextResponse('CORS policy violation', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  } catch {
    // En caso de fallo al evaluar CORS, continuar para no bloquear el preview
  }

  // Rate limiting
  const rateLimitResult = rateLimiter.checkLimit(request, 'default');
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded', {
      context: 'middleware.rate-limit',
      pathname,
      clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: rateLimitResult.message,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      },
      {
        status: rateLimitResult.statusCode || 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      }
    );
  }

  // Validate security headers
  const securityValidation = validateSecurityHeaders(request);
  if (!securityValidation.isValid) {
    logger.warn('Security validation failed', {
      warnings: securityValidation.warnings,
      pathname,
      context: 'middleware.security'
    });
  }

  // Validate query parameters for API routes
  if (pathname.startsWith('/api/')) {
    const queryValidation = validateQueryParams(request.nextUrl.searchParams);
    if (!queryValidation.isValid) {
      logger.warn('Query parameter validation failed', {
        error: queryValidation.error,
        pathname,
        context: 'middleware.query_validation'
      });

      return NextResponse.json(
        { error: queryValidation.error || 'Invalid query parameters' },
        { status: 400 }
      );
    }
  }

  // Apply internationalization middleware
  const response = intlMiddleware(request);

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()');
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

  // Content Security Policy (CSP)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://*.stripe.com https://ui-avatars.com",
    "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://*.adobesign.com https://*.docusign.net https://api.hellosign.com",
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://*.docusign.net",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Add rate limiting headers
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

  // Log request for monitoring
  const responseTime = Date.now() - startTime;
  if (responseTime > 1000) {
    logger.warn('Slow request detected', {
      context: 'middleware.performance',
      pathname,
      method: request.method,
      responseTime,
      userAgent: request.headers.get('user-agent') || 'unknown',
      clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/(es|en)/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
