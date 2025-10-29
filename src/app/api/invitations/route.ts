import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = { userId: user.id };

    if (status) {
      where.status = status;
    }

    const invitations = await db.brokerInvitation.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            avatar: true,
          },
        },
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        prospect: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    const total = await db.brokerInvitation.count({ where });

    return NextResponse.json({
      success: true,
      data: invitations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + invitations.length < total,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching user invitations', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener invitaciones' },
      { status: 500 }
    );
  }
}
