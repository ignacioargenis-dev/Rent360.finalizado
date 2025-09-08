import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { DocumentType } from '@prisma/client';

// Esquemas de validación
const uploadDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  fileName: z.string().min(1, 'Nombre de archivo es requerido'),
  fileUrl: z.string().url('URL de archivo inválida'),
  fileSize: z.number().min(1, 'Tamaño de archivo debe ser mayor a 0'),
  mimeType: z.string().min(1, 'Tipo MIME es requerido'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Monto debe ser mayor o igual a 0').optional(),
});

// POST - Subir documento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id } = params;
    const body = await request.json();

    const validatedData = uploadDocumentSchema.parse(body);

    // Verificar que la solicitud de devolución existe
    const refund = await db.depositRefund.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
          }
        },
        tenant: true,
        owner: true,
      }
    });

    if (!refund) {
      return NextResponse.json(
        { error: 'Solicitud de devolución no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (user.role !== 'ADMIN' && 
        user.id !== refund.tenantId && 
        user.id !== refund.ownerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para subir documentos a esta solicitud' },
        { status: 403 }
      );
    }

    // Verificar que la solicitud no esté procesada
    if (refund.status === 'PROCESSED') {
      return NextResponse.json(
        { error: 'No se pueden subir documentos a una solicitud ya procesada' },
        { status: 400 }
      );
    }

    // Validar tamaño de archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (validatedData.fileSize > maxSize) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 5MB' },
        { status: 400 }
      );
    }

    // Validar tipos de archivo permitidos
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedMimeTypes.includes(validatedData.mimeType)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se aceptan PDF e imágenes' },
        { status: 400 }
      );
    }

    // Crear el documento
    const document = await db.refundDocument.create({
      data: {
        refundId: id,
        uploadedBy: user.id,
        documentType: validatedData.documentType,
        fileName: validatedData.fileName,
        fileUrl: validatedData.fileUrl,
        fileSize: validatedData.fileSize,
        mimeType: validatedData.mimeType,
        description: validatedData.description,
        amount: validatedData.amount,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    // Crear log de auditoría
    await db.refundAuditLog.create({
      data: {
        refundId: id,
        userId: user.id,
        action: 'DOCUMENT_UPLOADED',
        details: `Documento subido: ${validatedData.fileName} (${validatedData.documentType})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });

    // Enviar notificaciones
    const otherPartyId = user.id === refund.tenantId ? refund.ownerId : refund.tenantId;
    
    await db.notification.create({
      data: {
        userId: otherPartyId,
        title: 'Nuevo Documento Subido',
        message: `${user.name} ha subido un nuevo documento: ${validatedData.fileName}`,
        type: 'INFO',
        data: JSON.stringify({
          refundId: id,
          documentId: document.id,
          documentType: validatedData.documentType,
          uploadedBy: user.name,
        }),
      }
    });

    logger.info('Documento subido:', {
      refundId: id,
      documentId: document.id,
      userId: user.id,
      fileName: validatedData.fileName,
      documentType: validatedData.documentType,
    });

    return NextResponse.json({
      success: true,
      data: document,
      message: 'Documento subido exitosamente'
    });

  } catch (error) {
    logger.error('Error subiendo documento:', {
      error: error instanceof Error ? error.message : String(error),
      refundId: params.id,
      userId: request.headers.get('user-id'),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Listar documentos
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id } = params;
    const { searchParams } = new URL(request.url);

    const documentType = searchParams.get('documentType') as DocumentType | null;

    // Verificar que la solicitud de devolución existe
    const refund = await db.depositRefund.findUnique({
      where: { id },
      include: {
        tenant: true,
        owner: true,
      }
    });

    if (!refund) {
      return NextResponse.json(
        { error: 'Solicitud de devolución no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (user.role !== 'ADMIN' && 
        user.id !== refund.tenantId && 
        user.id !== refund.ownerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver documentos de esta solicitud' },
        { status: 403 }
      );
    }

    // Construir filtros
    const where: any = { refundId: id };
    if (documentType) {
      where.documentType = documentType;
    }

    // Obtener documentos
    const documents = await db.refundDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    logger.info('Documentos listados:', {
      refundId: id,
      userId: user.id,
      count: documents.length,
      documentType,
    });

    return NextResponse.json({
      success: true,
      data: documents
    });

  } catch (error) {
    logger.error('Error listando documentos:', {
      error: error instanceof Error ? error.message : String(error),
      refundId: params.id,
      userId: request.headers.get('user-id'),
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
