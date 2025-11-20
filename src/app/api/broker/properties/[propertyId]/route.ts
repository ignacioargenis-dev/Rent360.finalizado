import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { propertyId: string } }) {
  const propertyId = params.propertyId;

  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
        broker: {
          select: { id: true, name: true, email: true, phone: true },
        },
        contracts: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            tenant: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    const isBrokerOwner = property.ownerId === user.id;
    const hasManagementRecord = await db.brokerPropertyManagement.findFirst({
      where: {
        propertyId,
        brokerId: user.id,
        status: 'ACTIVE',
      },
      select: {
        managementType: true,
        commissionRate: true,
        exclusivity: true,
        startDate: true,
      },
    });

    if (!isBrokerOwner && !hasManagementRecord && property.brokerId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta propiedad.' },
        { status: 403 }
      );
    }

    const maintenanceHistory = await db.maintenance.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        maintenanceProvider: {
          select: {
            id: true,
            businessName: true,
            specialty: true,
            rating: true,
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    const paymentHistory = await db.payment.findMany({
      where: {
        contract: {
          propertyId,
        },
      },
      orderBy: { dueDate: 'desc' },
      take: 15,
    });

    const ownerInfo = property.owner;
    const currentTenant = property.contracts[0]?.tenant
      ? {
          id: property.contracts[0].tenant.id,
          name: property.contracts[0].tenant.name,
          email: property.contracts[0].tenant.email,
          phone: property.contracts[0].tenant.phone,
          leaseStart: property.contracts[0].startDate.toISOString().split('T')[0],
          leaseEnd: property.contracts[0].endDate.toISOString().split('T')[0],
          monthlyRent: property.contracts[0].monthlyRent,
        }
      : null;

    const maintenancePayload = maintenanceHistory.map(item => ({
      id: item.id,
      date: item.createdAt.toISOString(),
      category: item.category,
      type: item.category,
      description: item.description,
      status: item.status.toLowerCase(),
      cost: item.estimatedCost || 0,
      provider: item.maintenanceProvider
        ? {
            providerId: item.maintenanceProvider.id,
            businessName: item.maintenanceProvider.businessName,
            specialty: item.maintenanceProvider.specialty,
            rating: item.maintenanceProvider.rating,
            userId: item.maintenanceProvider.user?.id,
            userName: item.maintenanceProvider.user?.name,
            userEmail: item.maintenanceProvider.user?.email,
            userPhone: item.maintenanceProvider.user?.phone,
          }
        : null,
    }));

    const paymentPayload = paymentHistory.map(payment => ({
      id: payment.id,
      date: payment.dueDate.toISOString(),
      amount: payment.amount,
      status: payment.status.toLowerCase(),
      method: payment.method || 'no_definido',
      reference: payment.transactionId || 'N/A',
    }));

    const formattedProperty = {
      id: property.id,
      title: property.title,
      address: property.address,
      city: property.city,
      region: property.region,
      type: property.type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      price: property.price,
      currency: 'CLP',
      status: property.status.toLowerCase(),
      ownerName: ownerInfo?.name || 'No asignado',
      ownerEmail: ownerInfo?.email || '',
      ownerPhone: ownerInfo?.phone || '',
      ownerId: ownerInfo?.id,
      description: property.description,
      features: property.features ? JSON.parse(property.features) : [],
      images: property.images ? JSON.parse(property.images) : [],
      currentTenant,
      maintenanceHistory: maintenancePayload,
      paymentHistory: paymentPayload,
      financialData: {
        monthlyRevenue: currentTenant?.monthlyRent || property.price || 0,
        yearlyRevenue: (currentTenant?.monthlyRent || property.price || 0) * 12,
        occupancyRate: property.status === 'RENTED' ? 100 : 0,
        averageRating: 0,
      },
      documents: [],
      notes: [],
      viewings: [],
      furnished: property.furnished,
      petFriendly: property.petFriendly,
      parkingSpaces: property.parkingSpaces,
      availableFrom: property.availableFrom?.toISOString(),
      floor: property.floor,
      buildingName: property.buildingName,
      yearBuilt: property.yearBuilt,
      heating: property.heating,
      cooling: property.cooling,
      internet: property.internet,
      elevator: property.elevator,
      balcony: property.balcony,
      terrace: property.terrace,
      garden: property.garden,
      pool: property.pool,
      gym: property.gym,
      security: property.security,
      concierge: property.concierge,
      virtualTourEnabled: property.virtualTourEnabled || false,
      virtualTourData: property.virtualTourData,
      management: hasManagementRecord
        ? {
            type: hasManagementRecord.managementType,
            commissionRate: hasManagementRecord.commissionRate,
            exclusivity: hasManagementRecord.exclusivity,
            startDate: hasManagementRecord.startDate.toISOString(),
          }
        : null,
    };

    logger.info('✅ [BROKER_PROPERTY] Detalles generados correctamente', {
      propertyId,
      brokerId: user.id,
      canEdit: isBrokerOwner || !!hasManagementRecord,
    });

    return NextResponse.json({
      success: true,
      data: formattedProperty,
      canEdit: isBrokerOwner || !!hasManagementRecord || property.brokerId === user.id,
    });
  } catch (error) {
    logger.error('Error al obtener detalles para corredor', {
      error: error instanceof Error ? error.message : String(error),
      propertyId,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
