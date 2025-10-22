import { NextResponse, type NextRequest } from 'next/server';
import { authMiddleware } from '@/middleware/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔧 Middleware: Procesando request', {
    pathname,
    method: request.method,
  });

  // Debug: mostrar cookies
  const authToken = request.cookies.get('auth-token');
  console.log('🔧 Middleware: Cookie auth-token encontrada:', !!authToken);
  if (authToken) {
    console.log('🔧 Middleware: Token length:', authToken.value.length);
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
