import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema para actualizar solicitud de mantenimiento
const updateMaintenanceSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').optional(),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').optional(),
  category: z.string().min(1, 'Categoría requerida').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  estimatedCost: z.number().positive().optional(),
  actualCost: z.number().positive().optional(),
  scheduledDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  contractorId: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  notes: z.string().optional(),
  images: z.array(z.string()).optional(),
});

// GET - Obtener solicitud de mantenimiento específica
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    const maintenanceRequest = await db.maintenance.findUnique({
      where: { id: params.id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        maintenanceProvider: {
          select: {
            id: true,
            businessName: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        visitSchedules: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            scheduledDate: true,
            scheduledTime: true,
            estimatedDuration: true,
            status: true,
            proposedBy: true,
            contactPerson: true,
            contactPhone: true,
            specialInstructions: true,
            acceptedAt: true,
            acceptedBy: true,
          },
        },
      },
    });

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Solicitud de mantenimiento no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos según el rol
    const isAdmin = user.role === 'ADMIN';
    const isTenant = user.role === 'TENANT' || user.role === 'tenant';
    const isOwner = user.role === 'OWNER' || user.role === 'owner';
    const isBroker = user.role === 'BROKER' || user.role === 'broker';
    const isMaintenance = user.role === 'MAINTENANCE' || user.role === 'maintenance';

    // Admin tiene acceso completo
    if (isAdmin) {
      // Continuar sin restricciones
    } else if (isTenant) {
      // Inquilinos solo pueden ver sus propias solicitudes
      if (maintenanceRequest.requestedBy !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    } else if (isOwner) {
      // Propietarios pueden ver solicitudes de sus propiedades
      if (maintenanceRequest.property?.owner?.id !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    } else if (isBroker) {
      // Brokers pueden ver solicitudes de propiedades que gestionan
      const brokerManagement = await db.brokerPropertyManagement.findFirst({
        where: {
          brokerId: user.id,
          propertyId: maintenanceRequest.propertyId,
          status: 'ACTIVE',
        },
      });
      // Si no gestiona la propiedad y no es el propietario, denegar acceso
      if (!brokerManagement && maintenanceRequest.property?.owner?.id !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    } else if (isMaintenance) {
      // Proveedores de mantenimiento pueden ver solicitudes asignadas a ellos
      if (maintenanceRequest.maintenanceProviderId) {
        const maintenanceProvider = await db.maintenanceProvider.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (
          maintenanceProvider &&
          maintenanceRequest.maintenanceProviderId !== maintenanceProvider.id
        ) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }
      } else {
        // Si no hay proveedor asignado, solo el solicitante puede ver
        if (maintenanceRequest.requestedBy !== user.id) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }
      }
    } else {
      // Otros roles no tienen acceso
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const latestVisit = maintenanceRequest.visitSchedules?.[0];
    const { visitSchedules, ...rest } = maintenanceRequest as any;

    return NextResponse.json({
      maintenanceRequest: {
        ...rest,
        images: JSON.parse(maintenanceRequest.images || '[]'),
        visitProposal: latestVisit
          ? {
              id: latestVisit.id,
              scheduledDate: latestVisit.scheduledDate?.toISOString() || null,
              scheduledTime: latestVisit.scheduledTime,
              estimatedDuration: latestVisit.estimatedDuration,
              status: latestVisit.status,
              proposedBy: latestVisit.proposedBy,
              contactPerson: latestVisit.contactPerson,
              contactPhone: latestVisit.contactPhone,
              specialInstructions: latestVisit.specialInstructions,
              acceptedAt: latestVisit.acceptedAt?.toISOString() || null,
              acceptedBy: latestVisit.acceptedBy,
            }
          : undefined,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT - Actualizar solicitud de mantenimiento
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const validatedData = updateMaintenanceSchema.parse(body);

    // Verificar que la solicitud existe
    const existingRequest = await db.maintenance.findUnique({
      where: { id: params.id },
      include: {
        property: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Solicitud de mantenimiento no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos según el rol
    if (user.role === 'TENANT') {
      // Inquilinos solo pueden actualizar sus propias solicitudes y solo ciertos campos
      if (existingRequest.requestedBy !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      // Inquilinos solo pueden actualizar rating y feedback
      const allowedFields = ['rating', 'feedback'];
      const hasUnauthorizedFields = Object.keys(validatedData).some(
        key => !allowedFields.includes(key)
      );

      if (hasUnauthorizedFields) {
        return NextResponse.json(
          { error: 'Solo puedes actualizar la calificación y comentarios' },
          { status: 403 }
        );
      }
    } else if (user.role === 'OWNER') {
      // Propietarios solo pueden actualizar solicitudes de sus propiedades
      if (existingRequest.property.ownerId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    } else if (user.role !== 'ADMIN' && user.role !== 'BROKER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Preparar datos para actualización
    const updateData: any = { ...validatedData };

    if (validatedData.images) {
      updateData.images = JSON.stringify(validatedData.images);
    }

    // Si se está asignando un contractor, verificar que existe
    if (validatedData.contractorId) {
      const contractor = await db.maintenanceProvider.findUnique({
        where: { id: validatedData.contractorId },
      });

      if (!contractor) {
        return NextResponse.json(
          { error: 'Prestador de servicios no encontrado' },
          { status: 404 }
        );
      }
    }

    // Actualizar la solicitud
    const maintenanceRequest = await db.maintenance.update({
      where: { id: params.id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
          },
        },
        // contractor: {
        //   select: {
        //     id: true,
        //     name: true,
        //     specialty: true,
        //     rating: true,
        //     phone: true,
        //     email: true
        //   }
        // }
      },
    });

    return NextResponse.json({
      message: 'Solicitud de mantenimiento actualizada exitosamente',
      maintenanceRequest: {
        ...maintenanceRequest,
        images: JSON.parse(maintenanceRequest.images || '[]'),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE - Eliminar solicitud de mantenimiento
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    // Verificar que la solicitud existe
    const existingRequest = await db.maintenance.findUnique({
      where: { id: params.id },
      include: {
        property: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Solicitud de mantenimiento no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (user.role === 'TENANT') {
      // Inquilinos solo pueden eliminar sus propias solicitudes si están abiertas
      if (existingRequest.requestedBy !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      if (existingRequest.status !== 'OPEN') {
        return NextResponse.json(
          { error: 'Solo se pueden eliminar solicitudes abiertas' },
          { status: 400 }
        );
      }
    } else if (user.role === 'OWNER') {
      // Propietarios solo pueden eliminar solicitudes de sus propiedades
      if (existingRequest.property.ownerId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    } else if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Eliminar la solicitud
    await db.maintenance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Solicitud de mantenimiento eliminada exitosamente',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
