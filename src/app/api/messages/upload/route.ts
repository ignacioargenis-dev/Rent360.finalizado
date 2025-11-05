import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger-minimal';
import { getUserFromRequest } from '@/lib/auth-token-validator';
import { CloudStorageService } from '@/lib/cloud-storage';
import { db } from '@/lib/db';
import { z } from 'zod';

// Forzar renderizado dinámico para evitar caché
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuración de validación para archivos
const fileValidationSchema = z.object({
  size: z.number().max(10 * 1024 * 1024, 'El archivo no puede superar los 10MB'),
  type: z.string().refine(type => {
    const allowedTypes = [
      // Imágenes
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      // Documentos
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      // Otros
      'application/octet-stream',
    ];
    return allowedTypes.includes(type);
  }, 'Tipo de archivo no permitido'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('📎 UPLOAD API: Iniciando subida de archivo para mensaje');

    // Validar token
    const decoded = await getUserFromRequest(request);

    if (!decoded) {
      logger.error('📎 /api/messages/upload: Token inválido o no presente');
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
          message: 'Token de autenticación inválido o no presente',
        },
        { status: 401 }
      );
    }

    const user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    console.log('✅ UPLOAD API: Usuario autenticado:', user.email);

    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const messageId = formData.get('messageId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se encontró el archivo' },
        { status: 400 }
      );
    }

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'ID del mensaje requerido' },
        { status: 400 }
      );
    }

    console.log(
      '📎 UPLOAD API: Archivo recibido:',
      file.name,
      'Tamaño:',
      file.size,
      'Tipo:',
      file.type
    );

    // Validar el archivo
    try {
      fileValidationSchema.parse({
        size: file.size,
        type: file.type,
      });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Archivo inválido',
            details: validationError.format(),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Verificar que el mensaje existe y pertenece al usuario
    const message = await db.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        attachmentUrl: true,
      },
    });

    if (!message) {
      return NextResponse.json({ success: false, error: 'Mensaje no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario es el remitente del mensaje
    if (message.senderId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para adjuntar archivos a este mensaje' },
        { status: 403 }
      );
    }

    // Verificar que el mensaje no tenga ya un archivo adjunto
    if (message.attachmentUrl) {
      return NextResponse.json(
        { success: false, error: 'Este mensaje ya tiene un archivo adjunto' },
        { status: 400 }
      );
    }

    // Inicializar el servicio de cloud storage
    const cloudStorageConfig: any = {
      bucket: process.env.DO_SPACES_BUCKET || 'rent360-files',
      region: process.env.DO_SPACES_REGION || 'nyc3',
      accessKey: process.env.DO_SPACES_ACCESS_KEY || '',
      secretKey: process.env.DO_SPACES_SECRET_KEY || '',
    };

    if (process.env.DO_SPACES_ENDPOINT) {
      cloudStorageConfig.endpoint = process.env.DO_SPACES_ENDPOINT;
    }

    const cloudStorage = new CloudStorageService(cloudStorageConfig);

    // Generar nombre único para el archivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueFileName = `messages/${messageId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    console.log('📎 UPLOAD API: Subiendo archivo a:', uniqueFileName);

    // Convertir el archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir el archivo a DigitalOcean Spaces
    let uploadResult;
    try {
      uploadResult = await cloudStorage.uploadFile(buffer, uniqueFileName, file.type, {
        originalName: file.name,
        uploadedBy: user.id,
        messageId: messageId,
      });
      console.log('✅ UPLOAD API: Archivo subido exitosamente:', uploadResult.url);
    } catch (uploadError) {
      logger.error('📎 Error subiendo archivo:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Error al subir el archivo' },
        { status: 500 }
      );
    }

    // Determinar el tipo de archivo para categorización
    let attachmentType = 'document';
    if (file.type.startsWith('image/')) {
      attachmentType = 'image';
    } else if (file.type === 'application/pdf') {
      attachmentType = 'pdf';
    }

    // Actualizar el mensaje con la información del archivo adjunto
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: {
        attachmentUrl: uploadResult.url,
        attachmentName: file.name,
        attachmentSize: file.size,
        attachmentType: attachmentType,
      },
      select: {
        id: true,
        attachmentUrl: true,
        attachmentName: true,
        attachmentSize: true,
        attachmentType: true,
      },
    });

    console.log('✅ UPLOAD API: Archivo subido exitosamente:', uploadResult.url);

    logger.info('Archivo adjunto subido a mensaje', {
      messageId,
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      attachmentType,
      url: uploadResult.url,
    });

    return NextResponse.json({
      success: true,
      message: 'Archivo adjunto subido exitosamente',
      data: {
        messageId,
        attachment: {
          url: uploadResult.url,
          name: file.name,
          size: file.size,
          type: attachmentType,
        },
      },
    });
  } catch (error) {
    logger.error('📎 Error en subida de archivo:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
