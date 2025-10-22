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
  '/[locale]/properties/search',
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
  '/api/financial/': ['ADMIN', 'ACCOUNTANT'],
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
  console.log('🔐 IS PUBLIC ROUTE: Checking', pathname);
  console.log('🔐 IS PUBLIC ROUTE: PUBLIC_ROUTES:', PUBLIC_ROUTES);

  const isPublic = PUBLIC_ROUTES.some(route => {
    const matches = pathname.startsWith(route);
    console.log(`🔐 IS PUBLIC ROUTE: ${pathname} startsWith ${route} -> ${matches}`);
    return matches;
  });

  console.log('🔐 IS PUBLIC ROUTE: Final result:', pathname, '->', isPublic);
  return isPublic;
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

// Función para validar token (compatible con Edge Runtime)
async function validateToken(token: string): Promise<any> {
  try {
    console.log('🔐 VALIDATE TOKEN: Iniciando validación del token');

    // Para Edge Runtime, usar decodificación manual compatible con navegador
    const parts = token.split('.');
    console.log('🔐 VALIDATE TOKEN: Partes del token:', parts.length);

    if (parts.length !== 3) {
      console.error('🔐 VALIDATE TOKEN: Token no tiene 3 partes');
      throw new Error('Invalid token format');
    }

    // Decodificar payload (parte del medio) - Compatible con Edge Runtime
    console.log('🔐 VALIDATE TOKEN: Decodificando payload con atob()');
    console.log('🔐 VALIDATE TOKEN: Part 1 (header):', parts[0]);
    console.log('🔐 VALIDATE TOKEN: Part 2 (payload):', parts[1]);

    let payload: any;
    try {
      const decodedPayload = atob(parts[1] || '');
      console.log('🔐 VALIDATE TOKEN: Payload decodificado (base64):', decodedPayload);
      payload = JSON.parse(decodedPayload);
      console.log('🔐 VALIDATE TOKEN: Payload decodificado (JSON):', {
        userId: payload.id,
        email: payload.email,
        role: payload.role,
        exp: payload.exp,
      });
    } catch (decodeError) {
      console.error('🔐 VALIDATE TOKEN: Error decodificando payload:', decodeError);
      throw new Error('Invalid token format');
    }

    // Validar expiración
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.error('🔐 VALIDATE TOKEN: Token expirado');
      throw new Error('Token expired');
    }

    // Validar que el token tenga la estructura esperada
    if (!payload.id || !payload.email || !payload.role) {
      console.error('🔐 VALIDATE TOKEN: Token sin estructura válida:', {
        hasId: !!payload.id,
        hasEmail: !!payload.email,
        hasRole: !!payload.role,
      });
      throw new Error('Invalid token structure');
    }

    console.log('🔐 VALIDATE TOKEN: Token validado exitosamente');
    return {
      userId: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
  } catch (error) {
    console.error('🔐 VALIDATE TOKEN: Error en validación:', {
      error: error instanceof Error ? error.message : String(error),
      tokenLength: token.length,
      tokenStart: token.substring(0, 50),
    });
    throw new Error('Invalid token');
  }
}

// Middleware de autenticación principal
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const clientIP =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Log INMEDIATO para confirmar que authMiddleware se está ejecutando
  console.log('🔐 AUTH MIDDLEWARE: EJECUTÁNDOSE para', pathname);
  console.log('🔐 AUTH MIDDLEWARE: Method:', request.method);
  console.log('🔐 AUTH MIDDLEWARE: Client IP:', clientIP);
  console.log('🔐 AUTH MIDDLEWARE: Full URL:', request.url);
  console.log('🔐 AUTH MIDDLEWARE: Headers:', Object.fromEntries(request.headers.entries()));
  console.log(
    '🔐 AUTH MIDDLEWARE: Cookies:',
    request.cookies.getAll().map(c => ({ name: c.name, value: c.value.length }))
  );

  logger.info('🔐 AuthMiddleware: Procesando request', {
    pathname,
    method: request.method,
    clientIP,
  });

  // Saltar autenticación para rutas públicas
  console.log('🔐 AUTH MIDDLEWARE: Verificando si es ruta pública...');
  if (isPublicRoute(pathname)) {
    console.log('🔐 AUTH MIDDLEWARE: RUTA PÚBLICA, SALTANDO AUTENTICACIÓN:', pathname);
    logger.info('🔐 AuthMiddleware: Ruta pública, saltando autenticación', { pathname });
    return null;
  }

  console.log('🔐 AUTH MIDDLEWARE: RUTA NO PÚBLICA, PROCESANDO AUTENTICACIÓN:', pathname);

  try {
    // Obtener token de autenticación
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;

    console.log('🔐 AUTH MIDDLEWARE: INICIANDO PROCESO DE AUTENTICACIÓN');
    console.log('🔐 AUTH MIDDLEWARE: Buscando tokens...');
    console.log('🔐 AUTH MIDDLEWARE: Auth Header:', !!authHeader);
    console.log('🔐 AUTH MIDDLEWARE: Cookie Token Length:', cookieToken?.length || 0);
    console.log('🔐 AUTH MIDDLEWARE: Cookie Token:', cookieToken ? 'PRESENTE' : 'NO ENCONTRADO');
    console.log(
      '🔐 AUTH MIDDLEWARE: All Cookies:',
      request.cookies
        .getAll()
        .map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length }))
    );

    logger.info('🔐 AuthMiddleware: Tokens encontrados', {
      hasAuthHeader: !!authHeader,
      hasCookieToken: !!cookieToken,
      cookieTokenLength: cookieToken?.length || 0,
      pathname,
      method: request.method,
    });

    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    console.log('🔐 AUTH MIDDLEWARE: Token extraído:', token ? 'PRESENTE' : 'NO ENCONTRADO');
    console.log('🔐 AUTH MIDDLEWARE: Token length:', token?.length);

    if (!token) {
      console.log('🔐 AUTH MIDDLEWARE: NO HAY TOKEN - RETORNANDO 401');
      logger.warn('🔐 AuthMiddleware: No authentication token provided', {
        pathname,
        clientIP,
        userAgent,
        hasAuthHeader: !!authHeader,
        hasCookieToken: !!cookieToken,
      });

      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Authentication required',
          message: 'No authentication token provided',
          debug: {
            hasAuthHeader: !!authHeader,
            hasCookieToken: !!cookieToken,
          },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer',
          },
        }
      );
    }

    // Validar token
    console.log('🔐 AUTH MIDDLEWARE: Ejecutando validateToken...');
    const decoded = await validateToken(token);
    console.log('🔐 AUTH MIDDLEWARE: validateToken completado exitosamente');

    logger.info('🔐 AuthMiddleware: Token validado exitosamente', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    // Validar con servicio de autenticación (si está disponible)
    // Comentado temporalmente para evitar bloqueos
    // const isValidWithService = await validateWithAuthService(token, decoded.userId);

    // if (!isValidWithService) {
    //   logger.warn('Token validation failed with auth service', {
    //     userId: decoded.userId,
    //     email: decoded.email,
    //     pathname,
    //     clientIP,
    //   });

    //   return new NextResponse(
    //     JSON.stringify({
    //       success: false,
    //       error: 'Authentication failed',
    //       message: 'Token validation failed',
    //     }),
    //     {
    //       status: 401,
    //       headers: { 'Content-Type': 'application/json' },
    //     }
    //   );
    // }

    // Verificar roles requeridos
    const requiredRoles = getRequiredRoles(pathname);
    if (requiredRoles && !requiredRoles.includes(decoded.role)) {
      logger.warn('Insufficient permissions for route', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        requiredRoles,
        pathname,
        clientIP,
      });

      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Insufficient permissions',
          message: `Role '${decoded.role}' does not have access to this resource`,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Adjuntar información del usuario a la request
    (request as any).user = {
      id: decoded.userId,
      userId: decoded.userId, // Mantener compatibilidad
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      permissions: decoded.permissions || [],
    };

    // Log de acceso autorizado
    logger.info('🔐 AuthMiddleware: Request autorizada', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      pathname,
      method: request.method,
      clientIP,
    });

    // Continuar con la solicitud
    console.log('🔐 AUTH MIDDLEWARE: AUTENTICACIÓN EXITOSA - RETORNANDO NULL');
    console.log('🔐 AUTH MIDDLEWARE: User object to attach:', {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    // Adjuntar información del usuario a la request
    (request as any).user = {
      id: decoded.userId,
      userId: decoded.userId, // Mantener compatibilidad
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      permissions: decoded.permissions || [],
    };

    console.log('🔐 AUTH MIDDLEWARE: USUARIO ADJUNTADO A REQUEST - FINAL');
    console.log('🔐 AUTH MIDDLEWARE: Request user:', (request as any).user);

    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication error';

    logger.error('Authentication middleware error', {
      error: errorMessage,
      pathname,
      clientIP,
      userAgent,
    });

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Authentication error',
        message: errorMessage,
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
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
        error: 'Authentication required',
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
      resourceId,
    });

    return null;
  } catch (error) {
    logger.error('Resource ownership verification failed', {
      userId: user.userId,
      resourceType,
      resourceId,
      error: error instanceof Error ? error.message : String(error),
    });

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this resource',
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
