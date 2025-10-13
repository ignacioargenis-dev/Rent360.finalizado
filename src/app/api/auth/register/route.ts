import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { z } from 'zod';
import { generateTokens, setAuthCookies, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json();

    // Validar los datos de entrada
    let validatedData;
    try {
      validatedData = registerSchema.parse(rawData);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        // Crear mensajes de error más específicos
        const errorMessages = validationError.issues.map(issue => {
          const field = issue.path.join('.');
          switch (field) {
            case 'name':
              return 'El nombre es obligatorio y debe tener al menos 2 caracteres';
            case 'email':
              return 'El email debe tener un formato válido';
            case 'password':
              return 'La contraseña debe tener al menos 8 caracteres';
            case 'rut':
              return 'El RUT debe tener un formato válido (ej: 12.345.678-9)';
            case 'phone':
              return 'El teléfono debe tener formato chileno válido';
            default:
              return `${field}: ${issue.message}`;
          }
        });

        return NextResponse.json(
          { error: errorMessages.join('. ') },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const {
      name,
      email,
      password,
      role,
      rut,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      commune,
      region,
      phoneSecondary,
      emergencyContact,
      emergencyPhone
    } = validatedData;

    if (!name || !email || !password || !role || !rut) {
      return NextResponse.json(
        { error: 'Los campos obligatorios son requeridos' },
        { status: 400 }
      );
    }

    // Roles permitidos para registro público
    const allowedPublicRoles = ['TENANT', 'OWNER', 'BROKER', 'RUNNER'];

    // Evitar que los usuarios se registren con roles no permitidos
    if (!allowedPublicRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rol de usuario no permitido para registro público' },
        { status: 403 },
      );
    }

    // Verificar si el usuario ya existe por email
    const existingUserByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 409 },
      );
    }

    // Verificar si el RUT ya existe
    const existingUserByRut = await db.user.findUnique({
      where: { rut },
    });

    if (existingUserByRut) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este RUT' },
        { status: 409 },
      );
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario con todos los campos
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role.toUpperCase(),
      avatar: null, // Los usuarios pueden subir su avatar después del registro
      // Campos obligatorios
      rut,
      // Campos opcionales
      phone: phone || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || null,
      address: address || null,
      city: city || null,
      commune: commune || null,
      region: region || null,
      // Campos adicionales de contacto
      phoneSecondary: phoneSecondary || null,
      emergencyContact: emergencyContact || null,
      emergencyPhone: emergencyPhone || null,
    };

    const user = await db.user.create({
      data: userData,
    });

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.email,
      user.role.toLowerCase(),
      user.name,
    );

    // Crear respuesta con cookies
    const response = NextResponse.json({
      message: 'Registro exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        avatar: user.avatar,
      },
    });

    // Establecer cookies HTTP-only
    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    logger.error('Error en registro:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
