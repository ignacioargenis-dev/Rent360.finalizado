import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Mock data para trabajos de mantenimiento
const mockMaintenanceJobs = [
  {
    id: '1',
    title: 'Mantenimiento preventivo - Ascensor',
    property: 'Edificio Las Condes Tower',
    type: 'Preventivo',
    status: 'En progreso',
    urgency: 'Programado',
    dueDate: '2024-12-15T14:00:00Z',
    technician: 'Juan Pérez',
    description: 'Revisión completa y mantenimiento del ascensor principal',
    estimatedCost: 150000,
    createdAt: '2024-12-10T10:00:00Z'
  },
  {
    id: '2',
    title: 'Reparación urgente - Calefacción',
    property: 'Casa Providencia 456',
    type: 'Correctivo',
    status: 'Pendiente',
    urgency: 'Alta',
    dueDate: '2024-12-15T16:00:00Z',
    technician: 'María González',
    description: 'Sistema de calefacción dejó de funcionar',
    estimatedCost: 80000,
    createdAt: '2024-12-14T08:00:00Z'
  },
  {
    id: '3',
    title: 'Inspección mensual - Electricidad',
    property: 'Departamento Santiago Centro',
    type: 'Preventivo',
    status: 'Programado',
    urgency: 'Media',
    dueDate: '2024-12-16T11:00:00Z',
    technician: 'Carlos Rodríguez',
    description: 'Inspección rutinaria de instalaciones eléctricas',
    estimatedCost: 50000,
    createdAt: '2024-12-12T09:00:00Z'
  },
  {
    id: '4',
    title: 'Limpieza de conductos de ventilación',
    property: 'Oficina Vitacura',
    type: 'Preventivo',
    status: 'Pendiente',
    urgency: 'Baja',
    dueDate: '2024-12-18T08:00:00Z',
    technician: 'Ana Silva',
    description: 'Limpieza profunda del sistema de ventilación',
    estimatedCost: 120000,
    createdAt: '2024-12-13T10:00:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'MAINTENANCE') {
      return NextResponse.json(
        { error: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    // En un futuro real, consultaríamos la base de datos
    return NextResponse.json({
      success: true,
      jobs: mockMaintenanceJobs
    });

  } catch (error) {
    logger.error('Error obteniendo trabajos de mantenimiento:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'MAINTENANCE') {
      return NextResponse.json(
        { error: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, property, type, description, estimatedCost, dueDate, technician, urgency } = body;

    // Validación básica
    if (!title || !property || !type || !description) {
      return NextResponse.json(
        { error: 'Los campos título, propiedad, tipo y descripción son obligatorios' },
        { status: 400 }
      );
    }

    // En un futuro real, crearíamos el trabajo en la base de datos
    const newJob = {
      id: Date.now().toString(),
      title,
      property,
      type,
      description,
      estimatedCost: estimatedCost || 0,
      dueDate: dueDate || new Date().toISOString(),
      technician: technician || 'Por asignar',
      urgency: urgency || 'Media',
      status: 'Pendiente',
      createdAt: new Date().toISOString()
    };

    logger.info('Nuevo trabajo de mantenimiento creado:', { maintenanceId: user.id, jobId: newJob.id });

    return NextResponse.json({
      success: true,
      job: newJob,
      message: 'Trabajo de mantenimiento creado exitosamente'
    });

  } catch (error) {
    logger.error('Error creando trabajo de mantenimiento:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
