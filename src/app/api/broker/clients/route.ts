import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar que sea un corredor
    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      rut,
      address,
      city,
      commune,
      region,
      budgetMin,
      budgetMax,
      propertyTypes,
      preferredLocations,
      urgencyLevel,
      financing,
      notes,
      source,
    } = body;

    // Validar campos obligatorios
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Nombre, apellido y email son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar si el cliente ya existe
    const existingClient = await db.user.findFirst({
      where: {
        OR: [{ email: email }, ...(rut ? [{ rut: rut }] : [])],
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email o RUT' },
        { status: 400 }
      );
    }

    logger.info('Creando nuevo cliente para corredor', {
      brokerId: user.id,
      clientEmail: email,
      clientName: `${firstName} ${lastName}`,
    });

    // Crear el cliente como un usuario con rol TENANT (ya que no hay rol CLIENT)
    const client = await db.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: email,
        password: '$2b$10$dummy.password.for.client.user', // Contraseña dummy, será cambiada por el cliente
        phone: phone || null,
        rut: rut || null,
        address: address || null,
        city: city || null,
        commune: commune || null,
        region: region || null,
        role: 'TENANT', // Usar TENANT ya que CLIENT no existe
        bio: notes || null,
        isActive: true,
      },
    });

    // Crear una entrada en la tabla de relaciones broker-client si es necesario
    // Por ahora, solo guardamos la información básica

    logger.info('Cliente creado exitosamente', {
      clientId: client.id,
      brokerId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Cliente creado exitosamente',
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        createdAt: client.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error creando cliente:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
