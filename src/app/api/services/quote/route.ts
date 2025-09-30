import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Solo proveedores pueden enviar cotizaciones' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { requestId, price, estimatedTime, availabilityDate, notes } = body;

    // Validación básica
    if (!requestId || !price) {
      return NextResponse.json(
        { error: 'El ID de solicitud y precio son obligatorios' },
        { status: 400 }
      );
    }

    // En un futuro real, crearíamos la cotización en la base de datos
    const quote = {
      id: Date.now().toString(),
      requestId,
      providerId: user.id,
      providerName: user.name,
      price: parseFloat(price),
      estimatedTime,
      availabilityDate,
      notes,
      status: 'Enviada',
      createdAt: new Date().toISOString()
    };

    logger.info('Nueva cotización enviada:', {
      providerId: user.id,
      requestId,
      quoteId: quote.id
    });

    return NextResponse.json({
      success: true,
      quote,
      message: 'Cotización enviada exitosamente al cliente'
    });

  } catch (error) {
    logger.error('Error creando cotización:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
