import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Obtener token de la cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 },
      );
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    
    // Buscar usuario en la base de datos usando Prisma
    const user = await db.User.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      );
    }

    // Determinar el rol del usuario
    const role = user.role.toLowerCase();

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error al verificar token:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 },
        );
      }
      if (error.name === 'TokenExpiredError') {
        return NextResponse.json(
          { error: 'Token expirado' },
          { status: 401 },
        );
      }
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
