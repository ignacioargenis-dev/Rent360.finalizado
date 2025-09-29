import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { generateTokens, setAuthCookies, verifyPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

async function loginHandler(request: NextRequest) {
  let data: any;
  try {
    const startTime = Date.now();
    logger.info( 'Iniciando proceso de login', { request });
    
    data = await request.json();
    logger.debug('Datos de login recibidos', { email: data.email });

    // Validar los datos de entrada
    const validatedData = loginSchema.parse(data);
    logger.debug('Datos de login validados exitosamente');

    const { email, password } = validatedData;

    logger.debug('Buscando usuario en base de datos');
    
    // Usar Prisma para buscar usuario
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true,
        avatar: true,
      },
    });
    
    if (!user) {
      logger.warn('Intento de login con usuario inexistente', { email });

      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 },
      );
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      logger.warn('Intento de login con cuenta inactiva', { userId: user.id, email });

      return NextResponse.json(
        { error: 'Tu cuenta ha sido desactivada' },
        { status: 403 },
      );
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      logger.warn('Intento de login con contraseña incorrecta', { email });

      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 },
      );
    }

    // Determinar el rol del usuario
    const role = user.role.toLowerCase();

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.email,
      role,
      user.name,
    );

    // Crear respuesta con cookies
    const response = NextResponse.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
        avatar: user.avatar,
      },
    });

    // Establecer cookies HTTP-only
    setAuthCookies(response, accessToken, refreshToken);

    const duration = Date.now() - startTime;
    logger.info(
      'Login exitoso',
      {
        userId: user.id,
        userRole: role,
        duration,
      },
    );

    return response;
  } catch (error) {
    // Re-throw para que el wrapper maneje los errores
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    return await loginHandler(request);
  } catch (error) {
    logger.error('Error en API de login:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
