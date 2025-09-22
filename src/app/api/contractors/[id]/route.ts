import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema de validación para actualizar contractor
const updateContractorSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos').optional(),
  specialty: z.string().min(2, 'La especialidad es requerida').optional(),
  specialties: z.array(z.string()).min(1, 'Debe tener al menos una especialidad').optional(),
  hourlyRate: z.number().positive().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['AVAILABLE', 'BUSY', 'UNAVAILABLE', 'SUSPENDED']).optional(),
  verified: z.boolean().optional(),
});

// GET - Obtener prestador de servicios específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden ver detalles completos
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    const contractor = await db.maintenanceProvider.findUnique({
      where: { id: params.id },
      include: {
        maintenanceJobs: {
          include: {
            property: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { maintenanceJobs: true },
        },
      },
    });

    if (!contractor) {
      return NextResponse.json(
        { error: 'Prestador de servicios no encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      contractor: {
        ...contractor,
        specialties: JSON.parse(contractor.specialties || '[]'),
        documents: [],
        completedJobs: contractor._count.maintenanceJobs,
      },
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// PUT - Actualizar prestador de servicios
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden actualizar contractors
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = updateContractorSchema.parse(body);

    // Verificar si el contractor existe
    const existingContractor = await db.maintenanceProvider.findUnique({
      where: { id: params.id },
    });

    if (!existingContractor) {
      return NextResponse.json(
        { error: 'Prestador de servicios no encontrado' },
        { status: 404 },
      );
    }

    // Preparar datos para actualización
    const updateData: any = { ...validatedData };
    
    if (validatedData.specialties) {
      updateData.specialties = JSON.stringify(validatedData.specialties);
    }

    // Actualizar el contractor
    const contractor = await db.maintenanceProvider.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Prestador de servicios actualizado exitosamente',
      contractor: {
        ...contractor,
        specialties: JSON.parse(contractor.specialties || '[]'),
        documents: [],
      },
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE - Eliminar prestador de servicios
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden eliminar contractors
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    // Verificar si el contractor existe
    const existingContractor = await db.maintenanceProvider.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { maintenanceJobs: true },
        },
      },
    });

    if (!existingContractor) {
      return NextResponse.json(
        { error: 'Prestador de servicios no encontrado' },
        { status: 404 },
      );
    }

    // Verificar si tiene trabajos asignados
    if (existingContractor._count.maintenanceJobs > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un prestador de servicios con trabajos asignados' },
        { status: 400 },
      );
    }

    // Eliminar el contractor
    await db.maintenanceProvider.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Prestador de servicios eliminado exitosamente',
    });

  } catch (error) {
    return handleApiError(error);
  }
}
