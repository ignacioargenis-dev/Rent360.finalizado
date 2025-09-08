import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { notificationService } from '@/lib/notifications';
import { handleError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Schema para crear/actualizar template
const templateSchema = z.object({
  id: z.string().min(1, 'ID requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  type: z.string().min(1, 'Tipo requerido'),
  title: z.string().min(1, 'Título requerido'),
  message: z.string().min(1, 'Mensaje requerido'),
  channels: z.array(z.string()).min(1, 'Al menos un canal requerido'),
  priority: z.string().min(1, 'Prioridad requerida'),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  aiOptimized: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 },
      );
    }

    // Obtener todos los templates disponibles
    const templates = Array.from(notificationService['templates'].values());

    return NextResponse.json({
      success: true,
      data: templates,
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = templateSchema.parse(body);

    // Crear nuevo template
    const newTemplate = {
      id: validatedData.id,
      name: validatedData.name,
      type: validatedData.type as any,
      title: validatedData.title,
      message: validatedData.message,
      channels: validatedData.channels as any[],
      priority: validatedData.priority as any,
      variables: validatedData.variables || [],
      aiOptimized: validatedData.aiOptimized ?? false,
    };

    // Agregar template al servicio
    notificationService['templates'].set(newTemplate.id, newTemplate);

    logger.info('Template de notificación creado', {
      templateId: newTemplate.id,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      data: newTemplate,
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = templateSchema.parse(body);

    // Verificar que el template existe
    const existingTemplate = notificationService['templates'].get(validatedData.id);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 },
      );
    }

    // Actualizar template
    const updatedTemplate = {
      ...existingTemplate,
      name: validatedData.name,
      type: validatedData.type as any,
      title: validatedData.title,
      message: validatedData.message,
      channels: validatedData.channels as any[],
      priority: validatedData.priority as any,
      variables: validatedData.variables || [],
      aiOptimized: validatedData.aiOptimized ?? existingTemplate.aiOptimized,
    };

    notificationService['templates'].set(updatedTemplate.id, updatedTemplate);

    logger.info('Template de notificación actualizado', {
      templateId: updatedTemplate.id,
      updatedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'ID de template requerido' },
        { status: 400 },
      );
    }

    // Verificar que el template existe
    const existingTemplate = notificationService['templates'].get(templateId);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 },
      );
    }

    // Eliminar template
    notificationService['templates'].delete(templateId);

    logger.info('Template de notificación eliminado', {
      templateId,
      deletedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Template eliminado exitosamente',
    });

  } catch (error) {
    return handleError(error);
  }
}
