// import { logger } from '@/lib/logger'; // Logger no disponible
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    const propertyId = params.id;
    
    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
      },
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 },
      );
    }
    
    // Verificar permisos
    if (user.role !== 'admin' && 
        property.owner?.id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta propiedad' },
        { status: 403 },
      );
    }
    
    return NextResponse.json({ property });
  } catch (error) {
    logger.error('Error al obtener propiedad:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    const propertyId = params.id;
    
    // Verificar si la propiedad existe y si el usuario tiene permisos
    const existingProperty = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: true,
      },
    });
    
    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 },
      );
    }
    
    // Verificar permisos
    if (user.role !== 'admin' && 
        existingProperty.owner?.id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar esta propiedad' },
        { status: 403 },
      );
    }
    
    const data = await request.json();
    
    const {
      title,
      description,
      address,
      price,
      type,
      bedrooms,
      bathrooms,
      area,
      features,
      images,
      status,
    } = data;
    
    // Actualizar propiedad
    const property = await db.property.update({
      where: { id: propertyId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(address && { address }),
        ...(price && { price: parseFloat(price) }),
        ...(type && { type }),
        ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
        ...(bathrooms && { bathrooms: parseInt(bathrooms) }),
        ...(area && { area: parseFloat(area) }),
        ...(features && { features }),
        ...(images && { images }),
        ...(status && { status }),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      message: 'Propiedad actualizada exitosamente',
      property,
    });
  } catch (error) {
    logger.error('Error al actualizar propiedad:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    const propertyId = params.id;
    
    // Verificar si la propiedad existe y si el usuario tiene permisos
    const existingProperty = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: true,
      },
    });
    
    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 },
      );
    }
    
    // Verificar permisos
    if (user.role !== 'admin' && 
        existingProperty.owner?.id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta propiedad' },
        { status: 403 },
      );
    }
    
    // Eliminar propiedad
    await db.property.delete({
      where: { id: propertyId },
    });
    
    return NextResponse.json({
      message: 'Propiedad eliminada exitosamente',
    });
  } catch (error) {
    logger.error('Error al eliminar propiedad:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}