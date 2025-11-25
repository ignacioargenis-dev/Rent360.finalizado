import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { identityVerificationService, DocumentType } from '@/lib/identity-verification-service';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const uploadDocumentSchema = z.object({
  verificationId: z.string(),
  documentType: z.enum([
    'cedula_identidad',
    'passport',
    'drivers_license',
    'proof_of_address',
    'selfie',
    'selfie_with_id',
    'video_verification',
  ]),
  fileName: z.string(),
  fileData: z.string(), // Base64 encoded file
  mimeType: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const validatedData = uploadDocumentSchema.parse(body);

    // Validar tamaño del archivo (máximo 10MB en base64)
    if (validatedData.fileData.length > 14_000_000) {
      // ~10MB en base64
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB.' },
        { status: 400 }
      );
    }

    // Validar tipo MIME
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'video/mp4',
      'video/webm',
    ];

    if (!allowedMimeTypes.includes(validatedData.mimeType)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    // Convertir base64 a Buffer
    const fileBuffer = Buffer.from(validatedData.fileData, 'base64');

    // En producción, subir el archivo a un storage (AWS S3, DigitalOcean Spaces, etc.)
    // Por ahora, simular la subida
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileUrl = `https://storage.rent360.cl/kyc/${user.id}/${documentId}`;

    // Verificar el documento automáticamente
    const verificationResult = await identityVerificationService.verifyDocument(
      validatedData.verificationId,
      documentId,
      validatedData.documentType as DocumentType
    );

    logger.info('Documento subido y verificado', {
      userId: user.id,
      verificationId: validatedData.verificationId,
      documentId,
      documentType: validatedData.documentType,
      verificationSuccess: verificationResult.success,
      confidence: verificationResult.confidence,
    });

    return NextResponse.json({
      success: true,
      message: 'Documento subido y verificado exitosamente',
      document: {
        id: documentId,
        type: validatedData.documentType,
        fileName: validatedData.fileName,
        fileUrl,
        uploadedAt: new Date().toISOString(),
        verificationResult,
      },
    });
  } catch (error) {
    logger.error('Error subiendo documento:', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
