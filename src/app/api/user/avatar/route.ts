import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCloudStorageService, generateFileKey } from '@/lib/cloud-storage';
import { db } from '@/lib/db';
import { validateFileMiddleware } from '@/lib/file-validation';

export async function POST(request: NextRequest) {
  try {
    logger.info('Iniciando subida de avatar...');

    const user = await requireAuth(request);
    logger.info('Usuario autenticado:', { userId: user.id, role: user.role });

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo de avatar' }, { status: 400 });
    }

    logger.info('Archivo recibido:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validar archivo de imagen
    const validationResult = await validateFileMiddleware([file], 'images');
    if (!validationResult.valid) {
      const errors = validationResult.results.flatMap(r => r.errors);
      logger.error('Archivo no válido:', errors);
      return NextResponse.json(
        {
          error: 'Archivo no válido',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Verificar tamaño máximo (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'El archivo es demasiado grande. Máximo 5MB permitido.',
        },
        { status: 400 }
      );
    }

    // Generar key único para el avatar
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileKey = `avatars/${user.id}_${Date.now()}.${fileExtension}`;

    logger.info('Subiendo avatar a cloud storage...', { fileKey });

    // Obtener servicio de cloud storage
    const cloudStorage = getCloudStorageService();

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a cloud storage
    const uploadResult = await cloudStorage.uploadFile(buffer, fileKey, file.type, {
      originalName: file.name,
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
    });

    logger.info('Avatar subido exitosamente a cloud storage', {
      key: fileKey,
      url: uploadResult.url,
    });

    // Obtener usuario completo de la base de datos para verificar avatar anterior
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { avatar: true },
    });

    // Eliminar avatar anterior si existía
    if (currentUser?.avatar) {
      try {
        // Extraer key del avatar anterior (si es una URL de nuestro cloud storage)
        const oldKeyMatch = currentUser.avatar.match(/\/avatars\/([^?]+)/);
        if (oldKeyMatch && oldKeyMatch[1]) {
          const oldKey = oldKeyMatch[1];
          await cloudStorage.deleteFile(oldKey);
          logger.info('Avatar anterior eliminado', { oldKey });
        }
      } catch (deleteError) {
        logger.warn('Error eliminando avatar anterior (ignorando):', deleteError);
        // No fallar si no se puede eliminar el anterior
      }
    }

    // Actualizar avatar del usuario en la base de datos
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        avatar: uploadResult.url,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        avatar: true,
        updatedAt: true,
      },
    });

    logger.info('Avatar actualizado en base de datos', {
      userId: user.id,
      avatarUrl: updatedUser.avatar,
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar actualizado exitosamente',
      avatar: {
        url: updatedUser.avatar,
        uploadedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error subiendo avatar:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: 'Error interno del servidor al subir el avatar',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    logger.info('Eliminando avatar...');

    const user = await requireAuth(request);
    logger.info('Usuario autenticado:', { userId: user.id, role: user.role });

    // Obtener usuario completo de la base de datos
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { avatar: true },
    });

    if (!currentUser?.avatar) {
      return NextResponse.json(
        {
          error: 'El usuario no tiene avatar para eliminar',
        },
        { status: 400 }
      );
    }

    // Extraer key del avatar
    const keyMatch = currentUser.avatar.match(/\/avatars\/([^?]+)/);
    if (!keyMatch || !keyMatch[1]) {
      return NextResponse.json(
        {
          error: 'No se puede identificar el archivo de avatar',
        },
        { status: 400 }
      );
    }

    const fileKey = keyMatch[1];
    logger.info('Eliminando avatar del cloud storage...', { fileKey });

    // Obtener servicio de cloud storage
    const cloudStorage = getCloudStorageService();

    // Eliminar del cloud storage
    await cloudStorage.deleteFile(fileKey);

    // Actualizar usuario en base de datos
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        avatar: null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        avatar: true,
        updatedAt: true,
      },
    });

    logger.info('Avatar eliminado exitosamente', {
      userId: user.id,
      oldAvatarUrl: currentUser.avatar,
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error eliminando avatar:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: 'Error interno del servidor al eliminar el avatar',
      },
      { status: 500 }
    );
  }
}
