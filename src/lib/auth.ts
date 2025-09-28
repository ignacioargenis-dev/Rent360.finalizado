import { logger } from '@/lib/logger';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

// JWT Secrets - Obligatorios en producción
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Validar que los secrets existen
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio. Configure la variable de entorno JWT_SECRET.');
}

if (!JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET es obligatorio. Configure la variable de entorno JWT_REFRESH_SECRET.');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Validar configuración de JWT (solo en producción)
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres por seguridad en producción');
  }

  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET debe tener al menos 32 caracteres por seguridad en producción');
  }

  // Validar que los secretos no sean idénticos
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET y JWT_REFRESH_SECRET no pueden ser idénticos');
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export interface DecodedToken {
  id: string;
  email: string;
  role: string;
  name: string;
  iat: number;
  exp: number;
}

export interface DecodedRefreshToken {
  id: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export function verifyToken(request: NextRequest): DecodedToken | null {
  try {
    // Obtener token de la cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token || !JWT_SECRET) {
      return null;
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded as DecodedToken;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(request: NextRequest): DecodedRefreshToken | null {
  try {
    // Obtener refresh token de la cookie
    const refreshToken = request.cookies.get('refresh-token')?.value;
    
    if (!refreshToken || !JWT_REFRESH_SECRET) {
      return null;
    }

    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    return decoded as DecodedRefreshToken;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<DecodedToken> {
  const decoded = verifyToken(request);
  
  if (!decoded) {
    throw new Error('No autorizado');
  }
  
  return decoded;
}

export async function requireRole(request: NextRequest, requiredRole: string): Promise<DecodedToken> {
  const decoded = await requireAuth(request);
  
  if (decoded.role !== requiredRole) {
    throw new Error('Acceso denegado: rol insuficiente');
  }
  
  return decoded;
}

export async function requireAnyRole(request: NextRequest, allowedRoles: string[]): Promise<DecodedToken> {
  const decoded = await requireAuth(request);
  
  if (!allowedRoles.includes(decoded.role)) {
    throw new Error('Acceso denegado: rol no permitido');
  }
  
  return decoded;
}

export function generateTokens(userId: string, email: string, role: string, name: string) {
  if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    logger.error('JWT secrets no configurados');
    throw new Error('Configuración de autenticación incompleta');
  }

  try {
    const accessToken = jwt.sign(
      { id: userId, email, role, name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any },
    );

    const refreshToken = jwt.sign(
      { id: userId, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN as any },
    );

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error('Error generando tokens:', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Error en la generación de tokens de autenticación');
  }
}

export function setAuthCookies(response: any, accessToken: string, refreshToken: string) {
  // Establecer cookie de acceso (HTTP-only, secure, SameSite=strict)
  response.cookies.set('auth-token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hora
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
  });

  // Establecer cookie de refresh (HTTP-only, secure, SameSite=strict)
  response.cookies.set('refresh-token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 días
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
  });
}

export function clearAuthCookies(response: any) {
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
  });

  response.cookies.set('refresh-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
  });
}
