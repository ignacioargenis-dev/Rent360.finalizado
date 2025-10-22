import { NextResponse, type NextRequest } from 'next/server';
import { authMiddleware } from '@/middleware/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔧 Middleware: Procesando request', {
    pathname,
    method: request.method,
  });

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
     * Match API routes specifically for authentication
     */
    '/api/messages/:path*',
    '/api/auth/me',
    '/api/properties/:path*',
    '/api/contracts/:path*',
    '/api/users/:path*',
    '/api/admin/:path*',
    '/api/support/:path*',
    '/api/legal/:path*',
    '/api/financial/:path*',
    // Add other protected API routes as needed
  ],
};
