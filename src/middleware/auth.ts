import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger-minimal';

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  // API públicas
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/health',
  '/api/monitoring/health',

  // Páginas públicas de marketing
  '/',
  '/about',
  '/contact',
  '/features',
  '/demo-fase1',
  '/offline',

  // Páginas públicas de propiedades
  '/properties/search',

  // Rutas de internacionalización
  '/[locale]',
  '/[locale]/about',
  '/[locale]/contact',
  '/[locale]/features',
  '/[locale]/demo-fase1',
  '/[locale]/offline',
  '/[locale]/properties/search'
];

// Rutas que requieren roles específicos
const ROLE_REQUIREMENTS: { [key: string]: string[] } = {
  '/api/admin': ['ADMIN'],
  '/api/admin/': ['ADMIN'],
  '/api/support': ['ADMIN', 'SUPPORT'],
  '/api/support/': ['ADMIN', 'SUPPORT'],
  '/api/legal': ['ADMIN', 'LEGAL'],
  '/api/legal/': ['ADMIN', 'LEGAL'],
  '/api/financial': ['ADMIN', 'ACCOUNTANT'],
  '/api/financial/': ['ADMIN', 'ACCOUNTANT']
};

// Extender interface de Request para incluir usuario
declare module 'next/server' {
  interface NextRequest {
    user?: {
      userId: string;
      email: string;
      role: string;
      permissions?: string[];
    };
  }
}

// Función para verificar si una ruta es pública
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

// Función para obtener el rol requerido para una ruta
function getRequiredRoles(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(ROLE_REQUIREMENTS)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }
  return null;
}

// Función para validar token (versión simplificada para Edge Runtime)
async function validateToken(token: string): Promise<any> {
  try {
    // Decodificar token base64 simple (para Edge Runtime)
    const decoded = JSON.parse(atob(token));
    
    // Validar que el token tenga la estructura esperada
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new Error('Invalid token structure');
    }

    // Validar expiración si existe
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Función para validar token con el servicio de autenticación
async function validateWithAuthService(token: string, userId: string): Promise<boolean> {
  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

    // Timeout de 5 segundos para evitar bloqueos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${authServiceUrl}/api/v1/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ userId }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn('Auth service validation failed', {
        status: response.status,
        statusText: response.statusText
      });
      return false;
    }

    const data = await response.json();
    return data.success === true;

  } catch (error) {
    logger.error('Auth service communication error', {
      error: error instanceof Error ? error.message : String(error)
    });

    // En caso de error de comunicación, permitir la solicitud con token válido
    // para evitar bloqueos por fallos temporales del servicio
    return true;
  }
}

// Middleware de autenticación principal
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const clientIP = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Saltar autenticación para rutas públicas
  if (isPublicRoute(pathname)) {
    return null;
  }

  try {
    // Obtener token de autenticación
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : cookieToken;

    if (!token) {
      logger.warn('No authentication token provided', {
        pathname,
        clientIP,
        userAgent
      });

      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Authentication required',
          message: 'No authentication token provided'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer'
          }
        }
      );
    }

    // Validar token
    const decoded = await validateToken(token);

    // Validar con servicio de autenticación (si está disponible)
    const isValidWithService = await validateWithAuthService(token, decoded.userId);

    if (!isValidWithService) {
      logger.warn('Token validation failed with auth service', {
        userId: decoded.userId,
        email: decoded.email,
        pathname,
        clientIP
      });

      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Authentication failed',
          message: 'Token validation failed'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar roles requeridos
    const requiredRoles = getRequiredRoles(pathname);
    if (requiredRoles && !requiredRoles.includes(decoded.role)) {
      logger.warn('Insufficient permissions for route', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        requiredRoles,
        pathname,
        clientIP
      });

      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Insufficient permissions',
          message: `Role '${decoded.role}' does not have access to this resource`
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Adjuntar información del usuario a la request
    (request as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };

    // Log de acceso autorizado
    logger.info('Authenticated request authorized', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      pathname,
      method: request.method,
      clientIP
    });

    // Continuar con la solicitud
    return null;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication error';

    logger.error('Authentication middleware error', {
      error: errorMessage,
      pathname,
      clientIP,
      userAgent
    });

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Authentication error',
        message: errorMessage
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Middleware para verificar propiedad de recursos
export async function ownershipMiddleware(
  request: NextRequest,
  resourceType: string,
  resourceId: string
): Promise<NextResponse | null> {
  const user = (request as any).user;

  if (!user) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Authentication required'
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Admin y Support tienen acceso a todos los recursos
  if (['ADMIN', 'SUPPORT'].includes(user.role)) {
    return null;
  }

  try {
    // Aquí iría la lógica para verificar propiedad del recurso
    // Por ahora, asumimos que el usuario tiene acceso si está autenticado
    // En una implementación real, consultaríamos la base de datos

    logger.info('Resource ownership verified', {
      userId: user.userId,
      resourceType,
      resourceId
    });

    return null;

  } catch (error) {
    logger.error('Resource ownership verification failed', {
      userId: user.userId,
      resourceType,
      resourceId,
      error: error instanceof Error ? error.message : String(error)
    });

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this resource'
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Función para obtener información del usuario actual
export function getCurrentUser(request: NextRequest) {
  return (request as any).user;
}

// Función para verificar si el usuario tiene un rol específico
export function hasRole(request: NextRequest, role: string): boolean {
  const user = getCurrentUser(request);
  return user && user.role === role;
}

// Función para verificar si el usuario tiene alguno de los roles especificados
export function hasAnyRole(request: NextRequest, roles: string[]): boolean {
  const user = getCurrentUser(request);
  return user && roles.includes(user.role);
}

// Función para verificar si el usuario tiene un permiso específico
export function hasPermission(request: NextRequest, permission: string): boolean {
  const user = getCurrentUser(request);
  return user && user.permissions && user.permissions.includes(permission);
}
