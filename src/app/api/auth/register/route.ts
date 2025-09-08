import { logger } from '@/lib/logger';
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
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.issues },
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
    const allowedPublicRoles = ['tenant', 'owner', 'broker', 'runner'];
    
    // Evitar que los usuarios se registren con roles no permitidos
    if (!allowedPublicRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rol de usuario no permitido para registro público' },
        { status: 403 },
      );
    }

    // Verificar si el usuario ya existe por email
    const existingUserByEmail = await db.User.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 409 },
      );
    }

    // Verificar si el RUT ya existe
    const existingUserByRut = await db.User.findUnique({
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
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.replace(/[^a-zA-Z0-9\s]/g, ''))}&background=0D8ABC&color=fff`,
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

    const user = await db.User.create({
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
