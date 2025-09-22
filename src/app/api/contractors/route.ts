import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema de validación para crear/actualizar contractor
const contractorSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  specialty: z.string().min(2, 'La especialidad es requerida'),
  specialties: z.array(z.string()).min(1, 'Debe tener al menos una especialidad'),
  hourlyRate: z.number().positive().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  description: z.string().optional(),
  verified: z.boolean().optional(),
});

// GET - Listar prestadores de servicios
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden ver todos los contractors
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const specialty = searchParams.get('specialty');
    const verified = searchParams.get('verified');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (specialty) {
      where.specialties = { contains: specialty, mode: 'insensitive' };
    }
    
    if (verified !== null) {
      where.verified = verified === 'true';
    }

    // Obtener contractors con paginación
    const [contractors, total] = await Promise.all([
      db.maintenanceProvider.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
        include: {
          _count: {
            select: { maintenanceJobs: true },
          },
        },
      }),
      db.maintenanceProvider.count({ where }),
    ]);

    // Calcular estadísticas
    const stats = await db.maintenanceProvider.aggregate({
      _count: { id: true },
      _avg: { rating: true },
      _sum: { completedJobs: true, totalEarnings: true },
    });

    return NextResponse.json({
      contractors: contractors.map(contractor => ({
        ...contractor,
        specialties: JSON.parse(contractor.specialties || '[]'),
        documents: [],
        completedJobs: contractor._count.maintenanceJobs,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: stats._count.id,
        averageRating: stats._avg.rating || 0,
        totalCompletedJobs: stats._sum.completedJobs || 0,
        totalEarnings: stats._sum.totalEarnings || 0,
      },
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Crear nuevo prestador de servicios
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden crear contractors
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = contractorSchema.parse(body);

    // Verificar si el email ya existe
    const existingContractor = await db.maintenanceProvider.findFirst({
      where: { user: { email: validatedData.email } },
    });

    if (existingContractor) {
      return NextResponse.json(
        { error: 'Ya existe un prestador de servicios con este email' },
        { status: 400 },
      );
    }

    // Crear el contractor
    const contractor = await db.maintenanceProvider.create({
      data: {
        businessName: validatedData.name,
        rut: 'N/A', // RUT will be updated later
        specialty: validatedData.specialty,
        specialties: JSON.stringify(validatedData.specialties),
        hourlyRate: validatedData.hourlyRate || 0,
        address: validatedData.address ?? null,
        city: validatedData.city ?? null,
        region: validatedData.region ?? null,
        description: validatedData.description ?? null,
        availability: JSON.stringify({}),
        userId: user.id,
        status: 'PENDING_VERIFICATION',
        isVerified: false,
      },
    });

    return NextResponse.json({
      message: 'Prestador de servicios creado exitosamente',
      contractor: {
        ...contractor,
        specialties: JSON.parse(contractor.specialties || '[]'),
        documents: [],
      },
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}
