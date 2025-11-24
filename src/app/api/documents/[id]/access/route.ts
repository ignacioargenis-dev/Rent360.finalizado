import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getCloudStorageService } from '@/lib/cloud-storage';

/**
 * GET /api/documents/[id]/access
 * Verificar acceso y servir documento si el usuario tiene permisos
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const documentId = params.id;

    logger.info('Acceso a documento solicitado:', {
      documentId,
      userId: user.id,
      userRole: user.role,
    });

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
      logger.warn('Documento no encontrado en la base de datos:', { documentId });
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    logger.info('Documento encontrado:', {
      documentId,
      fileName: document.fileName,
      filePath: document.filePath,
      propertyId: document.propertyId,
    });

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

    // Verificar si el filePath es una URL de cloud storage
    if (document.filePath.startsWith('http://') || document.filePath.startsWith('https://')) {
      logger.info('Documento está en cloud storage, redirigiendo:', {
        documentId,
        filePath: document.filePath,
      });

      // Redirigir directamente a la URL de cloud storage
      return NextResponse.redirect(document.filePath);
    }

    // Si el filePath parece ser una key de cloud storage, intentar descargar desde cloud storage
    // Solo intentar si tenemos configuración de cloud storage
    if (process.env.DO_SPACES_ACCESS_KEY && process.env.DO_SPACES_SECRET_KEY) {
      try {
        const cloudStorage = getCloudStorageService();
        // Extraer la key del filePath
        // Si es /uploads/documents/..., convertir a documents/...
        let key = document.filePath;
        if (key.startsWith('/uploads/')) {
          key = key.replace('/uploads/', '');
        } else if (key.startsWith('/')) {
          key = key.substring(1);
        }

        logger.info('Intentando descargar desde cloud storage:', {
          key,
          originalFilePath: document.filePath,
        });

        const buffer = await cloudStorage.downloadFile(key);

        logger.info('Archivo descargado desde cloud storage:', {
          documentId,
          size: buffer.length,
        });

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': document.mimeType || 'application/octet-stream',
            'Content-Length': buffer.length.toString(),
            'Content-Disposition': `inline; filename="${document.fileName}"`,
            'Cache-Control': 'private, max-age=3600',
          },
        });
      } catch (cloudError) {
        logger.warn('Error descargando desde cloud storage, intentando sistema de archivos:', {
          documentId,
          error: cloudError instanceof Error ? cloudError.message : String(cloudError),
        });
        // Continuar con el intento de sistema de archivos local
      }
    }

    // Verificar que el archivo existe en el sistema de archivos local
    // El filePath se guarda como /uploads/... pero debe leerse desde public/uploads/...
    let filePath: string;
    if (document.filePath.startsWith('/uploads/')) {
      // Si es una ruta relativa que empieza con /uploads/, agregar 'public' al inicio
      filePath = path.join(process.cwd(), 'public', document.filePath);
    } else if (document.filePath.startsWith('uploads/')) {
      // Si es una ruta relativa que empieza con uploads/, agregar 'public' al inicio
      filePath = path.join(process.cwd(), 'public', document.filePath);
    } else if (document.filePath.startsWith('/')) {
      // Si es una ruta absoluta, usar directamente
      filePath = path.join(process.cwd(), document.filePath);
    } else {
      // Si es una ruta relativa sin /, asumir que está en public/uploads
      filePath = path.join(process.cwd(), 'public', 'uploads', document.filePath);
    }

    // Verificar que el archivo existe antes de intentar leerlo
    if (!existsSync(filePath)) {
      logger.warn('Archivo no encontrado en ruta principal, intentando rutas alternativas:', {
        documentId,
        filePath,
        originalFilePath: document.filePath,
        cwd: process.cwd(),
      });

      // Intentar rutas alternativas
      const alternativePaths: string[] = [];

      // Si el filePath original es /uploads/..., intentar diferentes variaciones
      if (document.filePath.startsWith('/uploads/')) {
        const pathWithoutLeading = document.filePath.substring(1); // Remover el / inicial
        alternativePaths.push(path.join(process.cwd(), 'public', pathWithoutLeading));
        alternativePaths.push(path.join(process.cwd(), pathWithoutLeading));
      } else if (document.filePath.startsWith('uploads/')) {
        alternativePaths.push(path.join(process.cwd(), 'public', document.filePath));
        alternativePaths.push(path.join(process.cwd(), document.filePath));
      }

      // Buscar en rutas alternativas
      let foundPath: string | null = null;
      for (const altPath of alternativePaths) {
        if (existsSync(altPath)) {
          foundPath = altPath;
          logger.info('Archivo encontrado en ruta alternativa:', { altPath });
          break;
        }
      }

      if (!foundPath) {
        logger.error('Archivo no encontrado en ninguna ruta:', {
          documentId,
          originalFilePath: document.filePath,
          triedPaths: [filePath, ...alternativePaths],
        });

        return NextResponse.json(
          {
            error: 'Archivo no encontrado en el servidor',
            details: `Rutas buscadas: ${[filePath, ...alternativePaths].join(', ')}`,
          },
          { status: 404 }
        );
      }

      filePath = foundPath;
    }

    let fileBuffer: Buffer;

    try {
      fileBuffer = await readFile(filePath);
    } catch (error) {
      logger.error('Error leyendo archivo:', {
        documentId,
        filePath,
        originalFilePath: document.filePath,
        error: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json({ error: 'Error al leer el archivo del servidor' }, { status: 500 });
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
  if (user.role === 'ADMIN') {
    return true;
  }

  // Usuarios de soporte tienen acceso a documentos de usuarios para resolución de problemas
  if (user.role === 'SUPPORT' || user.role === 'support') {
    // Si el documento está asociado a un usuario (a través de uploadedBy), permitir acceso
    if (document.uploadedById) {
      return true;
    }
    // También permitir acceso a documentos de propiedades para resolución de tickets
    if (document.propertyId) {
      return true;
    }
  }

  // El usuario que subió el documento siempre tiene acceso
  if (document.uploadedById === user.id) {
    return true;
  }

  // Si el documento está asociado a una propiedad, verificar permisos específicos
  if (document.propertyId) {
    const property = document.property;

    // Propietarios tienen acceso a documentos de sus propiedades
    if ((user.role === 'OWNER' || user.role === 'owner') && property.ownerId === user.id) {
      return true;
    }

    // Corredores tienen acceso a documentos de propiedades que manejan directamente o a través de BrokerPropertyManagement
    if (user.role === 'BROKER' || user.role === 'broker') {
      // Verificar si el broker gestiona la propiedad directamente
      if (property.brokerId === user.id) {
        return true;
      }

      // Verificar si el broker gestiona la propiedad a través de BrokerPropertyManagement
      const brokerManagement = await db.brokerPropertyManagement.findFirst({
        where: {
          brokerId: user.id,
          propertyId: document.propertyId,
          status: 'ACTIVE',
        },
      });

      if (brokerManagement) {
        return true;
      }
    }

    // Verificar si hay una solicitud de visita pendiente que permite acceso a documentos del inquilino
    if (
      (user.role === 'OWNER' || user.role === 'BROKER') &&
      document.uploadedById &&
      document.propertyId
    ) {
      // Verificar si el documento pertenece a un inquilino y hay una visita pendiente
      const tenantUser = await db.user.findUnique({
        where: { id: document.uploadedById },
        select: { role: true },
      });

      if (tenantUser?.role === 'TENANT') {
        // Verificar si el usuario es propietario o corredor de la propiedad
        const property = document.property;
        let hasPropertyAccess = false;

        if (user.role === 'OWNER' && property.ownerId === user.id) {
          hasPropertyAccess = true;
        } else if (user.role === 'BROKER') {
          // Verificar si el broker gestiona la propiedad directamente
          if (property.brokerId === user.id) {
            hasPropertyAccess = true;
          } else {
            // Verificar si el broker gestiona la propiedad a través de BrokerPropertyManagement
            const brokerManagement = await db.brokerPropertyManagement.findFirst({
              where: {
                brokerId: user.id,
                propertyId: document.propertyId,
                status: 'ACTIVE',
              },
            });
            if (brokerManagement) {
              hasPropertyAccess = true;
            }
          }
        }

        if (hasPropertyAccess) {
          // Verificar si hay una visita pendiente para esta propiedad e inquilino
          // Cuando se crea una visita pendiente, el runnerId se asigna temporalmente al propietario/corredor
          // Por lo tanto, buscamos visitas donde el runnerId es igual al usuario y el status es PENDING
          const pendingVisit = await db.visit.findFirst({
            where: {
              propertyId: document.propertyId,
              tenantId: document.uploadedById,
              status: 'PENDING',
              runnerId: user.id, // El runnerId temporal es el propietario/corredor
            },
          });

          if (pendingVisit) {
            return true;
          }
        }
      }
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

    // ✅ Prestadores de servicios de mantenimiento pueden acceder a documentos relacionados
    // Aceptar ambos formatos de roles de proveedor
    const isProvider = user.role === 'PROVIDER' || user.role === 'MAINTENANCE';

    if (isProvider) {
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

  return false;
}
