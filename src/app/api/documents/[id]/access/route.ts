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
      select: {
        id: true,
        name: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        mimeType: true,
        type: true,
        uploadedById: true, // ✅ Asegurar que uploadedById esté incluido
        propertyId: true,
        createdAt: true,
        updatedAt: true,
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
      uploadedById: document.uploadedById,
      uploadedBy: document.uploadedBy
        ? { id: document.uploadedBy.id, name: document.uploadedBy.name }
        : null,
    });

    // Verificar permisos de acceso
    const hasAccess = await checkDocumentAccess(user, document);

    if (!hasAccess) {
      logger.warn('Acceso denegado a documento:', {
        documentId,
        userId: user.id,
        userRole: user.role,
        propertyId: document.propertyId,
        uploadedById: document.uploadedById,
        documentType: document.type,
      });

      return NextResponse.json(
        { error: 'No tienes permisos para acceder a este documento' },
        { status: 403 }
      );
    }

    // Verificar si el filePath es una URL de cloud storage (http/https)
    if (document.filePath.startsWith('http://') || document.filePath.startsWith('https://')) {
      logger.info('Documento está en cloud storage, descargando para servir:', {
        documentId,
        filePath: document.filePath,
      });

      try {
        // En lugar de redirigir (que causa problemas de CORS), descargar y servir el archivo
        const response = await fetch(document.filePath);

        if (!response.ok) {
          throw new Error(`Error al descargar archivo: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        logger.info('Archivo descargado desde cloud storage y servido:', {
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
            // Agregar headers CORS para evitar problemas
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
          },
        });
      } catch (error) {
        logger.error('Error descargando archivo desde cloud storage:', {
          documentId,
          filePath: document.filePath,
          error: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
          { error: 'Error al descargar el archivo desde cloud storage' },
          { status: 500 }
        );
      }
    }

    // Verificar si tenemos configuración de cloud storage disponible
    const hasCloudStorage = process.env.DO_SPACES_ACCESS_KEY && process.env.DO_SPACES_SECRET_KEY;

    // Si el filePath empieza con /uploads/, es un archivo local
    const isLocalFile =
      document.filePath.startsWith('/uploads/') || document.filePath.startsWith('uploads/');

    // ESTRATEGIA: Primero verificar si existe localmente, si no, intentar cloud storage como fallback
    if (isLocalFile && hasCloudStorage) {
      // Construir path local para verificación
      const localFilePath = document.filePath.startsWith('/uploads/')
        ? path.join(process.cwd(), 'public', document.filePath)
        : path.join(process.cwd(), 'public', 'uploads', document.filePath);

      // Si el archivo NO existe localmente, intentar cloud storage como fallback
      if (!existsSync(localFilePath)) {
        logger.info('Archivo no existe localmente, intentando cloud storage como fallback:', {
          documentId,
          originalFilePath: document.filePath,
          triedLocalPath: localFilePath,
        });

        try {
          const cloudStorage = getCloudStorageService();
          // Convertir path local a key de cloud storage
          let key = document.filePath;

          // Si es /uploads/documents/..., convertir a documents/...
          if (key.startsWith('/uploads/')) {
            key = key.replace('/uploads/', '');
          } else if (key.startsWith('uploads/')) {
            // Ya está en formato correcto
            key = key.replace('uploads/', '');
          }

          logger.info('Verificando existencia en cloud storage:', {
            key,
            originalFilePath: document.filePath,
          });

          // Verificar si el archivo existe en cloud storage
          const existsInCloud = await cloudStorage.fileExists(key);

          if (existsInCloud) {
            logger.info('✅ Archivo encontrado en cloud storage (fallback exitoso):', { key });
            const buffer = await cloudStorage.downloadFile(key);

            logger.info('Archivo descargado desde cloud storage:', {
              documentId,
              size: buffer.length,
            });

            return new NextResponse(new Uint8Array(buffer), {
              status: 200,
              headers: {
                'Content-Type': document.mimeType || 'application/octet-stream',
                'Content-Length': buffer.length.toString(),
                'Content-Disposition': `inline; filename="${document.fileName}"`,
                'Cache-Control': 'private, max-age=3600',
              },
            });
          } else {
            logger.warn('Archivo no existe ni localmente ni en cloud storage:', {
              documentId,
              key,
              originalFilePath: document.filePath,
            });
          }
        } catch (cloudError) {
          logger.warn('Error intentando fallback a cloud storage:', {
            documentId,
            error: cloudError instanceof Error ? cloudError.message : String(cloudError),
          });
        }
      }
    }

    // Si el filePath parece ser una key de cloud storage directa (no local), intentar descargar
    if (
      !isLocalFile &&
      hasCloudStorage &&
      (document.filePath.startsWith('documents/') ||
        document.filePath.startsWith('properties/') ||
        document.filePath.includes('digitaloceanspaces.com'))
    ) {
      try {
        const cloudStorage = getCloudStorageService();
        // Extraer la key del filePath
        let key = document.filePath;

        // Si es una URL, extraer la key de la URL
        if (key.startsWith('http://') || key.startsWith('https://')) {
          const urlObj = new URL(key);
          key = urlObj.pathname.substring(1); // Remover leading slash
        } else if (key.startsWith('/')) {
          key = key.substring(1);
        }

        logger.info('Verificando existencia en cloud storage:', {
          key,
          originalFilePath: document.filePath,
        });

        // Verificar primero si el archivo existe en cloud storage
        const existsInCloud = await cloudStorage.fileExists(key);

        if (existsInCloud) {
          logger.info('Archivo encontrado en cloud storage, descargando:', { key });
          const buffer = await cloudStorage.downloadFile(key);

          logger.info('Archivo descargado desde cloud storage:', {
            documentId,
            size: buffer.length,
          });

          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              'Content-Type': document.mimeType || 'application/octet-stream',
              'Content-Length': buffer.length.toString(),
              'Content-Disposition': `inline; filename="${document.fileName}"`,
              'Cache-Control': 'private, max-age=3600',
            },
          });
        } else {
          logger.info('Archivo no existe en cloud storage, usando sistema de archivos local:', {
            key,
            originalFilePath: document.filePath,
          });
        }
      } catch (cloudError) {
        logger.warn('Error verificando cloud storage, intentando sistema de archivos:', {
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
          fileName: document.fileName,
          originalFilePath: document.filePath,
          triedPaths: [filePath, ...alternativePaths],
          uploadedAt: document.createdAt,
          uploadedBy: document.uploadedById,
        });

        return NextResponse.json(
          {
            error: 'Archivo no encontrado en el servidor',
            message:
              'El archivo físico no existe. Puede haber sido eliminado o nunca se subió correctamente.',
            details: {
              fileName: document.fileName,
              filePath: document.filePath,
              triedPaths: [filePath, ...alternativePaths],
            },
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
  logger.info('Verificando acceso a documento:', {
    userId: user.id,
    userRole: user.role,
    documentId: document.id,
    uploadedById: document.uploadedById,
    propertyId: document.propertyId,
  });

  // Admins y usuarios de soporte tienen acceso a todos los documentos
  // SUPPORT necesita acceso completo para poder dar soporte técnico y resolver problemas
  if (user.role === 'ADMIN' || user.role === 'SUPPORT' || user.role === 'support') {
    logger.info(`Acceso concedido: usuario es ${user.role}`);
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
