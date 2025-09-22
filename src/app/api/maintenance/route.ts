import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { z } from 'zod';

// Schema de validación para crear solicitud de mantenimiento
const maintenanceSchema = z.object({
  propertyId: z.string().min(1, 'ID de propiedad requerido'),
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  category: z.string().min(1, 'Categoría requerida'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedCost: z.number().positive().optional(),
  scheduledDate: z.string().datetime().optional(),
  images: z.array(z.string()).optional(),
});

// Schema para asignar contractor
const assignContractorSchema = z.object({
  contractorId: z.string().min(1, 'ID de prestador de servicios requerido'),
  estimatedCost: z.number().positive().optional(),
  scheduledDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// GET - Listar solicitudes de mantenimiento
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const propertyId = searchParams.get('propertyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Construir filtros basados en el rol del usuario
    const where: any = {};
    
    if (user.role === 'TENANT') {
      // Inquilinos solo ven sus propias solicitudes
      where.requestedBy = user.id;
    } else if (user.role === 'OWNER') {
      // Propietarios ven solicitudes de sus propiedades
      where.property = {
        ownerId: user.id,
      };
    } else if (user.role === 'BROKER') {
      // Brokers ven solicitudes de propiedades que manejan
      where.property = {
        brokerId: user.id,
      };
    }
    // Admins ven todas las solicitudes
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (propertyId) {
      where.propertyId = propertyId;
    }

    // Obtener solicitudes con paginación
    const [maintenanceRequests, total] = await Promise.all([
      db.maintenance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      db.maintenance.count({ where }),
    ]);

    // Calcular estadísticas
    const stats = await db.maintenance.aggregate({
      where,
      _count: { id: true },
      _sum: { estimatedCost: true, actualCost: true },
    });

    return NextResponse.json({
      maintenanceRequests: maintenanceRequests.map(request => ({
        ...request,
        images: JSON.parse(request.images || '[]'),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: stats._count.id,
        totalEstimatedCost: stats._sum.estimatedCost || 0,
        totalActualCost: stats._sum.actualCost || 0,
      },
    });

  } catch (error) {
    return handleError(error);
  }
}

// POST - Crear nueva solicitud de mantenimiento
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo inquilinos pueden crear solicitudes
    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Solo los inquilinos pueden crear solicitudes de mantenimiento' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = maintenanceSchema.parse(body);

    // Verificar que la propiedad existe y el inquilino tiene acceso
    const property = await db.property.findFirst({
      where: {
        id: validatedData.propertyId,
        contracts: {
          some: {
            tenantId: user.id,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o no tienes acceso' },
        { status: 404 },
      );
    }

    // Construir objeto de datos compatible con Prisma
    const maintenanceData: any = {
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      priority: validatedData.priority,
      propertyId: validatedData.propertyId,
      requestedBy: user.id,
      images: JSON.stringify(validatedData.images || []),
    };

    if (validatedData.estimatedCost !== undefined) {
      maintenanceData.estimatedCost = validatedData.estimatedCost;
    }

    if (validatedData.scheduledDate !== undefined) {
      maintenanceData.scheduledDate = new Date(validatedData.scheduledDate);
    }

    // Crear la solicitud de mantenimiento
    const maintenanceRequest = await db.maintenance.create({
      data: maintenanceData,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Solicitud de mantenimiento creada exitosamente',
      maintenanceRequest: {
        ...maintenanceRequest,
        images: JSON.parse(maintenanceRequest.images || '[]'),
      },
    }, { status: 201 });

  } catch (error) {
    return handleError(error);
  }
}
