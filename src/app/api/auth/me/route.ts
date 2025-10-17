import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Buscar token en múltiples fuentes
    let token =
      request.cookies.get('auth-token')?.value ||
      request.cookies.get('next-auth.session-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    // Debug: mostrar todas las cookies disponibles
    const allCookies = request.cookies.getAll();
    console.error(
      '🔍 /api/auth/me: Debug cookies disponibles:',
      allCookies.map(c => ({ name: c.name, valueLength: c.value.length }))
    );

    // Si no hay token, devolver error de no autorizado
    if (!token) {
      console.error('❌ /api/auth/me: No se encontró token en cookies ni headers');
      console.error(
        '🔍 Cookies disponibles:',
        allCookies.map(c => c.name)
      );
      return NextResponse.json(
        {
          error: 'No autorizado',
          debug: 'No token found',
          availableCookies: allCookies.map(c => c.name),
        },
        { status: 401 }
      );
    }

    console.error('✅ /api/auth/me: Token encontrado, longitud:', token.length);
    console.error(
      '🔑 JWT_SECRET configurado:',
      !!process.env.JWT_SECRET,
      'Longitud:',
      process.env.JWT_SECRET?.length
    );

    // Verificar que JWT_SECRET esté configurado
    if (!process.env.JWT_SECRET) {
      console.error('❌ /api/auth/me: JWT_SECRET no está configurado');
      return NextResponse.json(
        { error: 'Configuración de autenticación incompleta' },
        { status: 500 }
      );
    }

    // Verificar token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      console.error(
        '✅ /api/auth/me: Token verificado exitosamente para usuario:',
        decoded.email,
        'Rol:',
        decoded.role
      );
    } catch (jwtError) {
      console.error(
        '❌ /api/auth/me: Error verificando token:',
        jwtError instanceof Error ? jwtError.message : String(jwtError)
      );
      console.error('Token (primeros 50 caracteres):', token.substring(0, 50));
      return NextResponse.json(
        {
          error: 'Token inválido o expirado',
          debug: jwtError instanceof Error ? jwtError.message : String(jwtError),
        },
        { status: 401 }
      );
    }

    // Verificar que el usuario existe y tiene datos válidos
    if (!decoded || !decoded.id || !decoded.role) {
      // Token JWT no contiene datos de usuario válidos
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // ✅ CORREGIDO: Consultar la base de datos para obtener datos actualizados del usuario
    try {
      const user = await db.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          rut: true,
          rutVerified: true,
          isActive: true,
          emailVerified: true,
          phoneVerified: true,
          phone: true,
          address: true,
          city: true,
          region: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        console.error('❌ /api/auth/me: Usuario no encontrado en la base de datos:', decoded.id);
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      console.error('✅ /api/auth/me: Usuario encontrado en BD:', user.email, 'Rol:', user.role);

      // Devolver información actualizada del usuario desde la base de datos
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          rut: user.rut,
          rutVerified: user.rutVerified,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          phone: user.phone,
          address: user.address,
          city: user.city,
          region: user.region,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (dbError) {
      console.error('❌ /api/auth/me: Error consultando base de datos:', dbError);
      // Fallback a datos del token si falla la consulta a la BD
      return NextResponse.json({
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          avatar: decoded.avatar,
          rut: decoded.rut,
          rutVerified: decoded.rutVerified,
          isActive: decoded.isActive,
          emailVerified: decoded.emailVerified,
          phoneVerified: decoded.phoneVerified,
          phone: decoded.phone,
          address: decoded.address,
          city: decoded.city,
          region: decoded.region,
          createdAt: decoded.createdAt,
          updatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
