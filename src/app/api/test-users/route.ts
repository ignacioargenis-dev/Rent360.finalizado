import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('Test users endpoint called - no auth required');

    // Obtener todos los usuarios sin filtros
    const allUsers = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Obtener usuarios activos
    const activeUsers = await db.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    logger.info('Test endpoint results', {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      data: {
        totalUsers: allUsers.length,
        activeUsers: activeUsers.length,
        allUsers: allUsers.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt.toISOString(),
        })),
        activeUsersList: activeUsers.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    logger.error('Error in test-users endpoint:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
