import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/images',
  '/static',
];

// Mapeo de rutas protegidas y los roles permitidos
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/owner': ['OWNER', 'ADMIN'],
  '/tenant': ['TENANT', 'ADMIN'],
  '/broker': ['BROKER', 'ADMIN'],
  '/runner': ['RUNNER', 'ADMIN'],
  '/support': ['SUPPORT', 'ADMIN'],
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

function getRequiredRoles(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }
  return null;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Obtener token de las cookies
  const token = request.cookies.get('auth-token')?.value;

  // Si no hay token y la ruta requiere autenticación, redirigir a login
  const requiredRoles = getRequiredRoles(pathname);
  if (requiredRoles && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Verificar token y roles si es necesario
  if (token && requiredRoles) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        // JWT_SECRET no configurado - permitir acceso pero sin validación
        return NextResponse.next();
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Verificar si el usuario tiene el rol requerido
      if (!requiredRoles.includes(decoded.role)) {
        // Redirigir a página de acceso denegado o dashboard apropiado
        const url = request.nextUrl.clone();
        url.pathname = '/auth/access-denied';
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // Token inválido o expirado, redirigir a login
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('redirect', pathname);
      url.searchParams.set('expired', 'true');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/(es|en)/:path*',
    '/admin/:path*',
    '/owner/:path*',
    '/tenant/:path*',
    '/broker/:path*',
    '/runner/:path*',
    '/support/:path*',
  ],
};
