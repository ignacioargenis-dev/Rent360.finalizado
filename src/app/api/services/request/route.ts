import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { serviceType, description, urgency, preferredDate, budget } = body;

    // Validación básica
    if (!serviceType || !description) {
      return NextResponse.json(
        { error: 'El tipo de servicio y descripción son obligatorios' },
        { status: 400 }
      );
    }

    // Solo propietarios, inquilinos y corredores pueden solicitar servicios
    if (!['OWNER', 'TENANT', 'BROKER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para solicitar servicios' },
        { status: 403 }
      );
    }

    // En un futuro real, crearíamos la solicitud en la base de datos
    const serviceRequest = {
      id: Date.now().toString(),
      requesterId: user.id,
      requesterName: user.name,
      serviceType,
      description,
      urgency: urgency || 'Media',
      preferredDate: preferredDate || null,
      budget: budget || null,
      status: 'Pendiente',
      createdAt: new Date().toISOString()
    };

    logger.info('Nueva solicitud de servicio creada:', {
      requesterId: user.id,
      serviceType,
      requestId: serviceRequest.id
    });

    return NextResponse.json({
      success: true,
      request: serviceRequest,
      message: 'Solicitud de servicio enviada exitosamente. Los proveedores disponibles recibirán tu solicitud.'
    });

  } catch (error) {
    logger.error('Error creando solicitud de servicio:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Mock data para solicitudes de servicio
    const mockRequests = [
      {
        id: '1',
        requesterName: 'María González',
        serviceType: 'Plomería',
        description: 'Reparación de fuga en baño principal',
        urgency: 'Alta',
        status: 'Pendiente',
        createdAt: '2024-12-14T10:00:00Z'
      },
      {
        id: '2',
        requesterName: 'Carlos Rodríguez',
        serviceType: 'Electricidad',
        description: 'Instalación de tomacorrientes adicionales',
        urgency: 'Media',
        status: 'En proceso',
        createdAt: '2024-12-13T14:30:00Z'
      }
    ];

    return NextResponse.json({
      success: true,
      requests: user.role === 'PROVIDER' ? mockRequests : []
    });

  } catch (error) {
    logger.error('Error obteniendo solicitudes de servicio:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
