import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const user = await requireAuth(request);

    // Solo propietarios pueden acceder
    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo propietarios pueden acceder.' },
        { status: 403 }
      );
    }

    const clientId = params.clientId;

    // Obtener el cliente corredor
    const brokerClient = await db.brokerClient.findFirst({
      where: {
        id: clientId,
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    if (!brokerClient) {
      return NextResponse.json({ error: 'Cliente corredor no encontrado.' }, { status: 404 });
    }

    // Parsear managedPropertyIds si existe
    let managedPropertyIds = null;
    if (brokerClient.managedPropertyIds) {
      try {
        managedPropertyIds = JSON.parse(brokerClient.managedPropertyIds);
      } catch (error) {
        logger.warn('Error parsing managedPropertyIds', { clientId, error });
        managedPropertyIds = [];
      }
    }

    return NextResponse.json({
      success: true,
      client: {
        ...brokerClient,
        managedPropertyIds,
      },
    });
  } catch (error) {
    logger.error('Error fetching broker client:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
