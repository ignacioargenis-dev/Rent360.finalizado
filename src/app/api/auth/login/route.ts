import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { generateTokens, setAuthCookies, verifyPassword } from '@/lib/auth';
import { db } from '@/lib/db';

async function loginHandler(request: NextRequest) {
  let data: any;
  try {
    console.log('🔐 Iniciando proceso de login');

    data = await request.json();
    console.log('📧 Datos de login recibidos', { email: data.email });

    // Validar los datos de entrada
    const validatedData = loginSchema.parse(data);
    console.log('✅ Datos de login validados exitosamente');

    const { email, password } = validatedData;

    console.log('🔍 Buscando usuario en base de datos');
    
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
      console.warn('⚠️ Intento de login con usuario inexistente', { email });

      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 },
      );
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      console.warn('⚠️ Intento de login con cuenta inactiva', { userId: user.id, email });

      return NextResponse.json(
        { error: 'Tu cuenta ha sido desactivada' },
        { status: 403 },
      );
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      console.warn('⚠️ Intento de login con contraseña incorrecta', { email });

      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 },
      );
    }

    // Determinar el rol del usuario
    const role = user.role.toLowerCase();

    // Generar tokens
    console.log('🔑 Generando tokens para usuario', { email });
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.email,
      role,
      user.name,
    );

    // Crear respuesta con cookies
    console.log('✅ Login exitoso, creando respuesta');
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

    console.log('🎉 Login completado exitosamente');

    return response;
  } catch (error) {
    console.error('❌ Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await loginHandler(request);
  } catch (error) {
    console.error('❌ Error crítico en API de login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
