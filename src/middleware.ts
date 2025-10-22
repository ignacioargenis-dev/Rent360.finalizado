import { NextResponse, type NextRequest } from 'next/server';
import { authMiddleware } from '@/middleware/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔧 Middleware: Procesando request', {
    pathname,
    method: request.method,
    fullUrl: request.url,
  });

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

  // Debug específico para rutas de mensajes
  if (pathname.startsWith('/api/messages')) {
    console.log('🔧 Middleware: Ruta de mensajes detectada, procesando autenticación');
  }

  // Usar el middleware de autenticación correcto que decodifica JWT
  const authResponse = await authMiddleware(request);
  if (authResponse) {
    // Si authMiddleware retorna una respuesta, significa que hay un error de autenticación
    console.log('🔧 Middleware: Error de autenticación detectado');
    console.log('🔧 Middleware: Auth response status:', authResponse.status);
    return authResponse;
  }

  console.log('🔧 Middleware: Autenticación exitosa, continuando...');
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
