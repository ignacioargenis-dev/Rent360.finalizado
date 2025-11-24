import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[id]
 * Obtiene información completa de un usuario por ID
 * Requiere autenticación y rol ADMIN o SUPPORT
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación y permisos
    const currentUser = await requireAuth(request);

    // Solo admins y soporte pueden ver detalles completos de usuarios
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPPORT') {
      return NextResponse.json(
        {
          success: false,
          error:
            'No autorizado. Solo administradores y personal de soporte pueden ver detalles de usuarios.',
        },
        { status: 403 }
      );
    }

    const userId = params.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneSecondary: true,
        emergencyContact: true,
        emergencyPhone: true,
        role: true,
        avatar: true,
        bio: true,
        address: true,
        city: true,
        commune: true,
        region: true,
        rut: true,
        rutVerified: true,
        dateOfBirth: true,
        gender: true,
        nationality: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        documents: {
          select: {
            id: true,
            name: true,
            type: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            propertyId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        bankAccounts: {
          select: {
            id: true,
            bank: true,
            accountType: true,
            accountNumber: true,
            holderName: true,
            rut: true,
            isVerified: true,
            isPrimary: true,
            createdAt: true,
          },
        },
        maintenanceProvider: {
          select: {
            id: true,
            businessName: true,
            specialty: true,
            status: true,
            isVerified: true,
            documents: true,
          },
        },
        serviceProvider: {
          select: {
            id: true,
            businessName: true,
            serviceType: true,
            status: true,
            isVerified: true,
            documents: true,
          },
        },
        ratingsReceived: {
          select: {
            id: true,
            fromUserId: true,
            contextType: true,
            contextId: true,
            overallRating: true,
            communicationRating: true,
            reliabilityRating: true,
            professionalismRating: true,
            qualityRating: true,
            punctualityRating: true,
            comment: true,
            positiveFeedback: true,
            improvementAreas: true,
            propertyId: true,
            contractId: true,
            isAnonymous: true,
            isPublic: true,
            createdAt: true,
            fromUser: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
              },
            },
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50, // Limitar a las últimas 50 calificaciones
        },
        ratingsGiven: {
          select: {
            id: true,
            toUserId: true,
            contextType: true,
            contextId: true,
            overallRating: true,
            communicationRating: true,
            reliabilityRating: true,
            professionalismRating: true,
            qualityRating: true,
            punctualityRating: true,
            comment: true,
            positiveFeedback: true,
            improvementAreas: true,
            propertyId: true,
            contractId: true,
            isAnonymous: true,
            isPublic: true,
            createdAt: true,
            toUser: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
              },
            },
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50, // Limitar a las últimas 50 calificaciones
        },
        properties: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            type: true,
            price: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        brokerProperties: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            type: true,
            price: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        contractsAsOwner: {
          select: {
            id: true,
            contractNumber: true,
            propertyId: true,
            tenantId: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            status: true,
            createdAt: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
        contractsAsTenant: {
          select: {
            id: true,
            contractNumber: true,
            propertyId: true,
            ownerId: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            status: true,
            createdAt: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
        contractsAsBroker: {
          select: {
            id: true,
            contractNumber: true,
            propertyId: true,
            ownerId: true,
            tenantId: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            status: true,
            createdAt: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    logger.error('Error obteniendo usuario:', {
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
