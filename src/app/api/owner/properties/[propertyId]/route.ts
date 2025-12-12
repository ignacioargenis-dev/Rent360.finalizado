import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { propertyId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de propietario.' },
        { status: 403 }
      );
    }

    const propertyId = params.propertyId;

    // Obtener detalles de la propiedad
    const property = await db.property.findUnique({
      where: {
        id: propertyId,
        ownerId: user.id, // Asegurar que el propietario es el dueño
      },
      include: {
        // Incluir inquilino actual si existe
        contracts: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
        // Incluir broker si existe
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        // Incluir documentos de la propiedad
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            name: true,
            type: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o no tienes permisos para acceder' },
        { status: 404 }
      );
    }

    // Obtener historial de mantenimiento
    const maintenanceHistory = await db.maintenance.findMany({
      where: {
        propertyId: propertyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        maintenanceProvider: {
          select: {
            id: true,
            businessName: true,
            specialty: true,
            rating: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Obtener historial de pagos
    const paymentHistory = await db.payment.findMany({
      where: {
        contract: {
          propertyId: propertyId,
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
      take: 10,
    });

    // Calcular tasa de ocupación real basada en contratos activos
    // Para una propiedad individual: 100% si tiene contrato activo, 0% si no
    const hasActiveContract = property.contracts.length > 0;
    const occupancyRate = hasActiveContract ? 100 : 0;

    // Calcular datos financieros reales
    const monthlyRevenue = property.contracts[0]?.monthlyRent || property.price || 0;
    const totalMaintenanceCosts = maintenanceHistory.reduce(
      (sum, m) => sum + (m.estimatedCost || 0),
      0
    );
    const yearlyRevenue = monthlyRevenue * 12;
    const netIncome = yearlyRevenue - totalMaintenanceCosts;

    // Transformar datos al formato esperado
    const propertyDetail = {
      id: property.id,
      title: property.title,
      address: property.address,
      city: property.city,
      region: property.region,
      type: property.type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      monthlyRent: property.price,
      currency: 'CLP',
      status: property.status.toLowerCase(),
      description: property.description,
      features: property.features ? JSON.parse(property.features) : [],
      images: property.images ? JSON.parse(property.images) : [],
      currentTenant: property.contracts[0]?.tenant
        ? {
            id: property.contracts[0].tenant.id,
            name: property.contracts[0].tenant.name,
            email: property.contracts[0].tenant.email,
            phone: property.contracts[0].tenant.phone,
            leaseStart: property.contracts[0].startDate.toISOString().split('T')[0],
            leaseEnd: property.contracts[0].endDate.toISOString().split('T')[0],
            monthlyRent: property.contracts[0].monthlyRent,
          }
        : null,
      broker: property.broker
        ? {
            id: property.broker.id,
            name: property.broker.name,
            email: property.broker.email,
            phone: property.broker.phone,
            commission: 0, // Calcular basado en configuración
          }
        : null,
      maintenanceHistory: maintenanceHistory.map(maintenance => ({
        id: maintenance.id,
        date: maintenance.createdAt.toISOString().split('T')[0],
        category: maintenance.category,
        description: maintenance.description,
        status: maintenance.status.toLowerCase(),
        cost: maintenance.estimatedCost || 0,
        provider: maintenance.maintenanceProvider
          ? {
              providerId: maintenance.maintenanceProvider.id,
              userId: maintenance.maintenanceProvider.user?.id,
              name: maintenance.maintenanceProvider.user?.name,
              email: maintenance.maintenanceProvider.user?.email,
              phone: maintenance.maintenanceProvider.user?.phone,
              businessName: maintenance.maintenanceProvider.businessName,
              specialty: maintenance.maintenanceProvider.specialty,
              rating: maintenance.maintenanceProvider.rating,
            }
          : null,
      })),
      paymentHistory: paymentHistory.map(payment => ({
        id: payment.id,
        date: payment.dueDate.toISOString().split('T')[0],
        amount: payment.amount,
        status: payment.status.toLowerCase(),
        method: payment.method || 'No especificado',
        reference: payment.transactionId || 'N/A',
      })),
      // Información adicional de la propiedad
      furnished: property.furnished,
      petFriendly: property.petFriendly,
      parkingSpaces: property.parkingSpaces,
      availableFrom: property.availableFrom?.toISOString().split('T')[0],
      floor: property.floor,
      buildingName: property.buildingName,
      yearBuilt: property.yearBuilt,
      heating: property.heating,
      cooling: property.cooling,
      internet: property.internet,
      elevator: property.elevator,
      balcony: property.balcony,
      terrace: property.terrace,
      concierge: property.concierge,
      virtualTourEnabled: property.virtualTourEnabled || false,
      virtualTourData: property.virtualTourData,
      // Datos financieros calculados
      financialData: {
        monthlyRevenue,
        yearlyRevenue,
        occupancyRate,
        maintenanceCosts: totalMaintenanceCosts,
        netIncome,
      },
      // Documentos de la propiedad
      documents: property.documents.map(doc => {
        // Función auxiliar para formatear tamaño de archivo
        const formatSize = (bytes: number): string => {
          if (bytes === 0) {
            return '0 Bytes';
          }
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        return {
          id: doc.id,
          name: doc.name,
          type: doc.type,
          uploadDate: doc.createdAt.toISOString().split('T')[0],
          size: formatSize(doc.fileSize),
          fileName: doc.fileName,
          filePath: doc.filePath,
          mimeType: doc.mimeType,
        };
      }),
    };

    logger.info('Detalles de propiedad obtenidos', {
      ownerId: user.id,
      propertyId,
      maintenanceCount: maintenanceHistory.length,
      paymentsCount: paymentHistory.length,
    });

    return NextResponse.json({
      success: true,
      data: propertyDetail,
    });
  } catch (error) {
    logger.error('Error obteniendo detalles de propiedad:', {
      error: error instanceof Error ? error.message : String(error),
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
