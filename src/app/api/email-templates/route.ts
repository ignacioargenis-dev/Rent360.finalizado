import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, 'admin');
    
    const templates = await db.emailTemplate.findMany({
      orderBy: {
        category: 'asc',
      },
    });
    
    return NextResponse.json({
      templates,
    });
  } catch (error) {
    logger.error('Error al obtener plantillas:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 },
        );
      }
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, 'admin');
    const { name, subject, content, category, variables } = await request.json();
    
    const template = await db.emailTemplate.create({
      data: {
        name,
        subject,
        content,
        category,
        variables: variables ? JSON.stringify(variables) : null,
      },
    });
    
    return NextResponse.json({
      message: 'Plantilla creada exitosamente',
      template,
    }, { status: 201 });
  } catch (error) {
    logger.error('Error al crear plantilla:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 },
        );
      }
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
