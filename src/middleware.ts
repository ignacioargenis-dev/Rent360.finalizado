import { NextResponse, type NextRequest } from 'next/server';
import { authMiddleware } from '@/middleware/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log INMEDIATO para CONFIRMAR EJECUCIÓN - ANTES DE CUALQUIER OTRA COSA
  console.log(`🔧 MIDDLEWARE EJECUTÁNDOSE: ${request.method} ${pathname}`);
  console.log(`🔧 MIDDLEWARE MATCHER ACTIVO PARA: ${pathname}`);

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
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match ALL API routes to ensure middleware runs
     * Edge Runtime sometimes has issues with complex patterns
     */
    '/api/:path*',
    // Also include the specific failing routes
    '/api/messages',
    '/api/messages/conversations',
    '/api/messages/:path*',
  ],
};
