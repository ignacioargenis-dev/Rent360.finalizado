import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

export interface DecodedToken {
  id: string;
  email: string;
  role: string;
  name?: string;
  [key: string]: any;
}

/**
 * Valida el token JWT de una request
 * Extrae el token de cookies o headers y lo verifica
 *
 * @param request - NextRequest de Next.js
 * @returns Token decodificado o null si no es válido
 */
export async function validateAuthToken(request: NextRequest): Promise<DecodedToken | null> {
  try {
    // Buscar token en múltiples fuentes
    let token =
      request.cookies.get('auth-token')?.value ||
      request.cookies.get('next-auth.session-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    console.log('🔑 validateAuthToken: Buscando token...');
    console.log(
      '🔑 validateAuthToken: Cookies disponibles:',
      request.cookies.getAll().map(c => c.name)
    );
    console.log('🔑 validateAuthToken: Token encontrado:', !!token);

    if (!token) {
      console.error('❌ validateAuthToken: No se encontró token');
      return null;
    }

    console.log('✅ validateAuthToken: Token encontrado, longitud:', token.length);

    // Verificar que JWT_SECRET esté configurado
    if (!process.env.JWT_SECRET) {
      console.error('❌ validateAuthToken: JWT_SECRET no está configurado');
      return null;
    }

    console.log('🔑 validateAuthToken: JWT_SECRET configurado:', !!process.env.JWT_SECRET);

    // Verificar token JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;

      console.log('✅ validateAuthToken: Token verificado exitosamente');
      console.log('✅ validateAuthToken: Usuario:', decoded.email, 'Rol:', decoded.role);

      // Verificar estructura mínima
      if (!decoded.id || !decoded.email || !decoded.role) {
        console.error('❌ validateAuthToken: Token sin estructura válida');
        return null;
      }

      return decoded;
    } catch (jwtError) {
      console.error(
        '❌ validateAuthToken: Error verificando token:',
        jwtError instanceof Error ? jwtError.message : String(jwtError)
      );
      return null;
    }
  } catch (error) {
    console.error('❌ validateAuthToken: Error general:', error);
    return null;
  }
}

/**
 * Extrae el usuario de una request validando el token
 * Wrapper conveniente para usar en API handlers
 *
 * @param request - NextRequest de Next.js
 * @returns Usuario decodificado o null
 */
export async function getUserFromRequest(request: NextRequest): Promise<DecodedToken | null> {
  return validateAuthToken(request);
}
