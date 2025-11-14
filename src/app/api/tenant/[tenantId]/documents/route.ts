import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/tenant/[tenantId]/documents
 * Obtiene los documentos de un inquilino para evaluación por propietario/corredor
 * Solo accesible cuando hay una solicitud de visita pendiente
 */
export async function GET(request: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const user = await requireAuth(request);
    const { tenantId } = params;

    // Solo propietarios y corredores pueden ver documentos de inquilinos
    if (user.role !== 'OWNER' && user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Solo propietarios y corredores pueden ver documentos de inquilinos' },
        { status: 403 }
      );
    }

    // Verificar que existe una solicitud de visita pendiente relacionada
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId es requerido para verificar acceso' },
        { status: 400 }
      );
    }

    // Construir filtro de propiedad según el rol
    const propertyFilter: any = {};
    if (user.role === 'OWNER') {
      propertyFilter.ownerId = user.id;
    } else if (user.role === 'BROKER') {
      propertyFilter.brokerId = user.id;
    }

    // Verificar que existe una visita pendiente para esta propiedad e inquilino
    const pendingVisit = await db.visit.findFirst({
      where: {
        propertyId,
        tenantId,
        status: 'PENDING',
        property: propertyFilter,
      },
    });

    if (!pendingVisit) {
      return NextResponse.json(
        {
          error:
            'No tienes acceso a estos documentos. Solo puedes verlos cuando hay una solicitud de visita pendiente.',
        },
        { status: 403 }
      );
    }

    // Obtener documentos del inquilino
    const documents = await db.document.findMany({
      where: {
        uploadedById: tenantId,
        type: {
          in: ['IDENTIFICATION', 'INCOME_PROOF', 'CREDIT_REPORT', 'REFERENCE', 'OTHER_DOCUMENT'],
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('Documentos de inquilino obtenidos', {
      tenantId,
      propertyId,
      requestedBy: user.id,
      userRole: user.role,
      documentCount: documents.length,
    });

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        createdAt: doc.createdAt.toISOString(),
        uploadedBy: doc.uploadedBy,
      })),
      tenant: {
        id: tenantId,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo documentos de inquilino:', {
      error: error instanceof Error ? error.message : String(error),
      tenantId: params.tenantId,
    });
    return NextResponse.json(
      { error: 'Error al obtener los documentos del inquilino' },
      { status: 500 }
    );
  }
}
