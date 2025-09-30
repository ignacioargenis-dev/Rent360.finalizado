import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Mock data para trabajos del proveedor
const mockJobs = [
  {
    id: '1',
    title: 'Reparación de cañerías',
    client: 'Propiedad Las Condes 123',
    status: 'En progreso',
    priority: 'Alta',
    dueDate: '2024-12-15T14:00:00Z',
    description: 'Reparación de fuga en baño principal',
    price: 75000,
    createdAt: '2024-12-10T10:00:00Z'
  },
  {
    id: '2',
    title: 'Mantenimiento eléctrico',
    client: 'Edificio Providencia',
    status: 'Programado',
    priority: 'Media',
    dueDate: '2024-12-16T10:00:00Z',
    description: 'Revisión completa del sistema eléctrico',
    price: 120000,
    createdAt: '2024-12-12T09:00:00Z'
  },
  {
    id: '3',
    title: 'Instalación de calefacción',
    client: 'Casa Vitacura',
    status: 'Pendiente',
    priority: 'Baja',
    dueDate: '2024-12-18T09:00:00Z',
    description: 'Instalación de sistema de calefacción central',
    price: 250000,
    createdAt: '2024-12-14T11:00:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    // En un futuro real, consultaríamos la base de datos
    // Por ahora retornamos datos mock
    return NextResponse.json({
      success: true,
      jobs: mockJobs
    });

  } catch (error) {
    logger.error('Error obteniendo trabajos del proveedor:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, client, description, price, dueDate, priority } = body;

    // Validación básica
    if (!title || !client || !description) {
      return NextResponse.json(
        { error: 'Los campos título, cliente y descripción son obligatorios' },
        { status: 400 }
      );
    }

    // En un futuro real, crearíamos el trabajo en la base de datos
    const newJob = {
      id: Date.now().toString(),
      title,
      client,
      description,
      price: price || 0,
      dueDate: dueDate || new Date().toISOString(),
      priority: priority || 'Media',
      status: 'Pendiente',
      createdAt: new Date().toISOString()
    };

    logger.info('Nuevo trabajo creado por proveedor:', { providerId: user.id, jobId: newJob.id });

    return NextResponse.json({
      success: true,
      job: newJob,
      message: 'Trabajo creado exitosamente'
    });

  } catch (error) {
    logger.error('Error creando trabajo:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
