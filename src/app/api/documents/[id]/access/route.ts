import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * GET /api/documents/[id]/access
 * Verificar acceso y servir documento si el usuario tiene permisos
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const documentId = params.id;

    // Buscar el documento
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
            brokerId: true,
            title: true,
            address: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Verificar permisos de acceso
    const hasAccess = await checkDocumentAccess(user, document);

    if (!hasAccess) {
      logger.warn('Acceso denegado a documento:', {
        documentId,
        userId: user.id,
        userRole: user.role,
        propertyId: document.propertyId,
      });

      return NextResponse.json(
        { error: 'No tienes permisos para acceder a este documento' },
        { status: 403 }
      );
    }

    // Verificar que el archivo existe
    const filePath = path.join(process.cwd(), document.filePath);
    let fileBuffer: Buffer;

    try {
      fileBuffer = await readFile(filePath);
    } catch (error) {
      logger.error('Error leyendo archivo:', {
        documentId,
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json({ error: 'Archivo no encontrado en el servidor' }, { status: 404 });
    }

    // Registrar acceso para auditoría
    logger.info('Documento accedido:', {
      documentId,
      userId: user.id,
      userRole: user.role,
      documentType: document.type,
      propertyId: document.propertyId,
      fileName: document.fileName,
    });

    // Devolver el archivo con headers apropiados
    const response = new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': document.mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${document.fileName}"`,
        'Cache-Control': 'private, max-age=3600', // Cache por 1 hora
      },
    });

    return response;
  } catch (error) {
    logger.error('Error accediendo a documento:', {
      documentId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * Verificar si un usuario tiene permisos para acceder a un documento
 */
async function checkDocumentAccess(user: any, document: any): Promise<boolean> {
  // Admins tienen acceso a todo
  if (user.role === 'admin') {
    return true;
  }

  // El usuario que subió el documento siempre tiene acceso
  if (document.uploadedById === user.id) {
    return true;
  }

  // Si el documento está asociado a una propiedad, verificar permisos específicos
  if (document.propertyId) {
    const property = document.property;

    // Propietarios tienen acceso a documentos de sus propiedades
    if (user.role === 'owner' && property.ownerId === user.id) {
      return true;
    }

    // Corredores tienen acceso a documentos de propiedades que manejan
    if (user.role === 'broker' && property.brokerId === user.id) {
      return true;
    }

    // Inquilinos tienen acceso limitado a documentos relacionados con contratos activos
    if (user.role === 'tenant') {
      const activeContracts = await db.contract.findFirst({
        where: {
          propertyId: document.propertyId,
          tenantId: user.id,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      });

      if (activeContracts) {
        // Inquilinos solo pueden acceder a documentos públicos o relacionados con contratos
        return ['PROPERTY_DOCUMENT', 'UTILITY_BILL'].includes(document.type);
      }
    }

    // Prestadores de servicios de mantenimiento pueden acceder a documentos relacionados
    if (user.role === 'provider') {
      const relatedMaintenance = await db.maintenance.findFirst({
        where: {
          propertyId: document.propertyId,
          assignedTo: user.id,
          status: { in: ['IN_PROGRESS', 'COMPLETED'] },
        },
      });

      if (relatedMaintenance) {
        return true;
      }
    }
  }

  // Soporte técnico tiene acceso limitado para resolución de problemas
  if (user.role === 'support') {
    // Los usuarios de soporte solo pueden acceder a documentos de propiedades que están resolviendo tickets
    // Por ahora, denegar acceso hasta implementar lógica más específica
    return false;
  }

  return false;
}
