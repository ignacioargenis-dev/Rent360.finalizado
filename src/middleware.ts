import { NextResponse, type NextRequest } from 'next/server';
import { authMiddleware } from '@/middleware/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log básico para TODAS las requests
  console.log(`🔧 MIDDLEWARE: ${request.method} ${pathname} - START`);

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
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all API routes for authentication
     */
    '/api/messages/:path*',
    '/api/auth/:path*',
    '/api/properties/:path*',
    '/api/contracts/:path*',
    '/api/users/:path*',
    '/api/admin/:path*',
    '/api/support/:path*',
    '/api/legal/:path*',
    '/api/financial/:path*',
  ],
};
