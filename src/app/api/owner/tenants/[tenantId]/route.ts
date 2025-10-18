import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de propietario.' },
        { status: 403 }
      );
    }

    const tenantId = params.tenantId;

    // Obtener detalles del inquilino con información relacionada
    const tenant = await db.user.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
        dateOfBirth: true,
        address: true,
        city: true,
        commune: true,
        region: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        // Información de contacto de emergencia
        phoneSecondary: true,
        emergencyContact: true,
        emergencyPhone: true,
      }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado' },
        { status: 404 }
      );
    }

    // Obtener contratos activos del inquilino con el propietario
    const contracts = await db.contract.findMany({
      where: {
        tenantId: tenantId,
        ownerId: user.id,
        status: 'ACTIVE'
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            region: true,
            price: true,
            type: true,
            bedrooms: true,
            bathrooms: true,
            area: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Obtener historial de pagos
    const payments = await db.payment.findMany({
      where: {
        contract: {
          tenantId: tenantId,
          ownerId: user.id
        }
      },
      orderBy: {
        dueDate: 'desc'
      },
      take: 10
    });

    // Transformar datos al formato esperado
    const tenantDetail = {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      rut: tenant.rut,
      birthDate: tenant.dateOfBirth?.toISOString().split('T')[0],
      occupation: tenant.bio || 'No especificado',
      income: 0, // No disponible en el modelo actual
      status: 'ACTIVE',
      paymentStatus: 'CURRENT', // Calcular basado en pagos
      registrationDate: tenant.createdAt.toISOString().split('T')[0],
      lastContact: tenant.updatedAt.toISOString().split('T')[0],
      emergencyContact: {
        name: tenant.emergencyContact || 'No especificado',
        phone: tenant.emergencyPhone || 'No especificado',
        relationship: 'No especificado',
      },
      properties: contracts.map(contract => ({
        id: contract.property.id,
        title: contract.property.title,
        address: `${contract.property.address}, ${contract.property.commune}, ${contract.property.city}`,
        leaseStart: contract.startDate.toISOString().split('T')[0],
        leaseEnd: contract.endDate.toISOString().split('T')[0],
        monthlyRent: contract.monthlyRent,
        status: contract.status.toLowerCase(),
        brokerName: 'No asignado', // Se puede obtener del broker si existe
      })),
      paymentHistory: payments.map(payment => ({
        id: payment.id,
        date: payment.dueDate.toISOString().split('T')[0],
        amount: payment.amount,
        status: payment.status.toLowerCase(),
        method: payment.method || 'No especificado',
        reference: payment.transactionId || 'N/A',
      })),
    };

    logger.info('Detalles de inquilino obtenidos', {
      ownerId: user.id,
      tenantId,
      contractsCount: contracts.length,
      paymentsCount: payments.length
    });

    return NextResponse.json({
      success: true,
      data: tenantDetail
    });

  } catch (error) {
    logger.error('Error obteniendo detalles de inquilino:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
