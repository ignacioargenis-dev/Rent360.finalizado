import { NextResponse, type NextRequest } from 'next/server';
import { authMiddleware } from '@/middleware/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log INMEDIATO para CONFIRMAR EJECUCIÓN - ANTES DE CUALQUIER OTRA COSA
  console.log(`🔧 MIDDLEWARE EJECUTÁNDOSE: ${request.method} ${pathname}`);
  console.log(`🔧 MIDDLEWARE MATCHER ACTIVO PARA: ${pathname}`);
  console.log(`🔧 MIDDLEWARE FULL URL: ${request.url}`);
  console.log(
    `🔧 MIDDLEWARE ALL COOKIES:`,
    request.cookies.getAll().map(c => c.name)
  );

  // Verificar si el pathname coincide con nuestro matcher
  const matcherPatterns = [
    '/api/messages',
    '/api/messages/conversations',
    '/api/messages/:path*',
    '/api/auth/me',
    '/api/properties/:path*',
    '/api/contracts/:path*',
    '/api/users/:path*',
  ];

  const matches = matcherPatterns.filter(pattern => {
    if (pattern.includes(':path*')) {
      return pathname.startsWith(pattern.replace('/:path*', ''));
    }
    return pathname === pattern || pathname.startsWith(pattern + '/');
  });

  console.log(`🔧 MIDDLEWARE MATCHER CHECK: ${pathname} matches:`, matches);
  console.log(`🔧 MIDDLEWARE REQUEST HEADERS:`, Object.fromEntries(request.headers.entries()));

  // Log básico para TODAS las requests - MÁS SIMPLE
  console.log(`🔧 MIDDLEWARE START: ${request.method} ${pathname}`);
  console.log(`🔧 MIDDLEWARE URL: ${request.url}`);
  console.log(
    `🔧 MIDDLEWARE COOKIES:`,
    request.cookies.getAll().map(c => c.name)
  );

  // Debug específico para rutas de mensajes
  if (pathname.startsWith('/api/messages')) {
    console.log(`🔧 MIDDLEWARE: RUTA DE MENSAJES DETECTADA - ${pathname}`);
    console.log(`🔧 MIDDLEWARE: Method: ${request.method}`);
    console.log(`🔧 MIDDLEWARE: Full URL: ${request.url}`);
    console.log(`🔧 MIDDLEWARE: Headers:`, Object.fromEntries(request.headers.entries()));
    console.log(
      `🔧 MIDDLEWARE: Cookies:`,
      request.cookies.getAll().map(c => ({ name: c.name, value: c.value.length }))
    );
  }

  // Debug para rutas de auth
  if (pathname.startsWith('/api/auth')) {
    console.log(`🔧 MIDDLEWARE: RUTA DE AUTH DETECTADA - ${pathname}`);
  }

  // Debug para cualquier otra ruta API
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/messages') &&
    !pathname.startsWith('/api/auth')
  ) {
    console.log(`🔧 MIDDLEWARE: OTRA RUTA API DETECTADA - ${pathname}`);
  }

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/api/health',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/monitoring/health',
  ];

  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    console.log('🔧 Middleware: Ruta pública, saltando autenticación');
    return NextResponse.next();
  }

  // Usar el middleware de autenticación correcto que decodifica JWT
  console.log('🔧 MIDDLEWARE: Ejecutando authMiddleware para', pathname);

  try {
    const authResponse = await authMiddleware(request);

    if (authResponse) {
      // Si authMiddleware retorna una respuesta, significa que hay un error de autenticación
      console.log('🔧 MIDDLEWARE: ERROR DE AUTENTICACIÓN DETECTADO');
      console.log('🔧 MIDDLEWARE: Auth response status:', authResponse.status);
      const responseBody = await authResponse.text();
      console.log('🔧 MIDDLEWARE: Auth response body:', responseBody);
      return authResponse;
    }

    console.log('🔧 MIDDLEWARE: Autenticación exitosa, continuando...');
    console.log('🔧 MIDDLEWARE: User attached:', (request as any).user ? 'YES' : 'NO');
  } catch (error) {
    console.error('🔧 MIDDLEWARE: ERROR EN AUTH MIDDLEWARE:', error);
    console.error('🔧 MIDDLEWARE: Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack',
    });
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          pathname,
          method: request.method,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.log('🔧 MIDDLEWARE: Completando middleware exitosamente');
  console.log(
    '🔧 MIDDLEWARE: Final user check:',
    (request as any).user ? 'USER ATTACHED' : 'NO USER'
  );
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match ALL API routes - simplest possible pattern
     * Edge Runtime should recognize this basic pattern
     */
    '/api/(.*)',
  ],
};
