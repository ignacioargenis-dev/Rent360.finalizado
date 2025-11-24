import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getCloudStorageService } from '@/lib/cloud-storage';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/documents/[id]
 * Eliminar un documento
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const documentId = params.id;

    logger.info('Eliminación de documento solicitada:', {
      documentId,
      userId: user.id,
      userRole: user.role,
    });

    // Buscar el documento
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!document) {
      logger.warn('Documento no encontrado en la base de datos:', { documentId });
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Verificar permisos: solo el usuario que subió el documento, ADMIN o SUPPORT pueden eliminarlo
    const canDelete =
      user.role === 'ADMIN' || user.role === 'SUPPORT' || document.uploadedById === user.id;

    if (!canDelete) {
      logger.warn('Acceso denegado para eliminar documento:', {
        documentId,
        userId: user.id,
        userRole: user.role,
        uploadedById: document.uploadedById,
      });

      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este documento' },
        { status: 403 }
      );
    }

    // Eliminar el archivo físico si existe
    try {
      // Si es un archivo local
      if (document.filePath.startsWith('/uploads/') || document.filePath.startsWith('uploads/')) {
        let filePath: string;
        if (document.filePath.startsWith('/uploads/')) {
          filePath = path.join(process.cwd(), 'public', document.filePath);
        } else {
          filePath = path.join(process.cwd(), 'public', document.filePath);
        }

        if (existsSync(filePath)) {
          await unlink(filePath);
          logger.info('Archivo físico eliminado:', { filePath });
        } else {
          logger.warn('Archivo físico no encontrado (puede haber sido eliminado previamente):', {
            filePath,
          });
        }
      } else if (
        // Si está en cloud storage
        process.env.DO_SPACES_ACCESS_KEY &&
        process.env.DO_SPACES_SECRET_KEY &&
        (document.filePath.startsWith('documents/') ||
          document.filePath.startsWith('properties/') ||
          document.filePath.includes('digitaloceanspaces.com'))
      ) {
        try {
          const cloudStorage = getCloudStorageService();
          let key = document.filePath;

          // Extraer la key si es una URL
          if (key.startsWith('http://') || key.startsWith('https://')) {
            const urlObj = new URL(key);
            key = urlObj.pathname.substring(1);
          } else if (key.startsWith('/uploads/')) {
            key = key.replace('/uploads/', '');
          } else if (key.startsWith('/')) {
            key = key.substring(1);
          }

          await cloudStorage.deleteFile(key);
          logger.info('Archivo eliminado de cloud storage:', { key });
        } catch (cloudError) {
          logger.warn(
            'Error eliminando archivo de cloud storage (continuando con eliminación de BD):',
            {
              error: cloudError instanceof Error ? cloudError.message : String(cloudError),
            }
          );
        }
      }
    } catch (fileError) {
      logger.warn('Error eliminando archivo físico (continuando con eliminación de BD):', {
        error: fileError instanceof Error ? fileError.message : String(fileError),
      });
    }

    // Eliminar el registro de la base de datos
    await db.document.delete({
      where: { id: documentId },
    });

    logger.info('Documento eliminado exitosamente:', {
      documentId,
      fileName: document.fileName,
      deletedBy: user.id,
      userRole: user.role,
    });

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error eliminando documento:', {
      error: error instanceof Error ? error.message : String(error),
      documentId: params.id,
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
