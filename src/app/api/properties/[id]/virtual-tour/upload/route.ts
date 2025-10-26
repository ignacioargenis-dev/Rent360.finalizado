import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id;
    const decoded = await requireAnyRole(request, ['OWNER', 'BROKER', 'ADMIN']);

    // Verificar que la propiedad existe y pertenece al usuario
    const property = await db.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: decoded.id }, { brokerId: decoded.id }],
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o no tienes acceso' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo de imagen' }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
    }

    // Validar tamaño del archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande (máximo 10MB)' },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomId}.${extension}`;

    // Crear directorio específico para el tour virtual de la propiedad
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'virtual-tours', propertyId);
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // El directorio ya existe
    }

    // Guardar el archivo
    const filepath = join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Crear URLs accesibles
    const imageUrl = `/uploads/virtual-tours/${propertyId}/${filename}`;
    const thumbnailUrl = imageUrl; // Por ahora usar la misma imagen como thumbnail

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnailUrl,
      filename,
    });
  } catch (error) {
    console.error('Error uploading virtual tour image:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
