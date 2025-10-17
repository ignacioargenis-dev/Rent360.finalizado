import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

import { writeFile } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { validateFileMiddleware, FILE_TYPES } from '@/lib/file-validation';

export async function POST(request: NextRequest) {
  try {
    logger.info('Iniciando subida de documentos...');

    const user = await requireAuth(request);
    logger.info('Usuario autenticado:', { userId: user.id, role: user.role });

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = (formData.get('category') as string) || 'documents';
    const tags = formData.getAll('tags') as string[];
    const propertyId = formData.get('propertyId') as string;
    const documentType = formData.get('type') as string;

    logger.info('Datos recibidos:', {
      filesCount: files.length,
      title,
      category,
      documentType,
      propertyId,
      files: files.map(f => ({ name: f.name, type: f.type, size: f.size })),
    });

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron archivos' }, { status: 400 });
    }

    // Determinar tipo de validación basado en la categoría y tipo de archivo
    let validationType: 'documents' | 'images' | 'contracts' = 'documents';

    if (category === 'contracts') {
      validationType = 'contracts';
    } else if (category === 'images') {
      validationType = 'images';
    } else {
      // Para categorías como 'personal', determinar por el tipo de archivo
      const firstFile = files[0];
      if (firstFile && firstFile.type.startsWith('image/')) {
        validationType = 'images';
      } else {
        validationType = 'documents';
      }
    }

    logger.info('Iniciando validación de archivos:', { validationType, category });

    // Validar archivos
    const validation = await validateFileMiddleware(files, validationType);

    logger.info('Resultado de validación:', {
      valid: validation.valid,
      summary: validation.summary,
      results: validation.results.map(r => ({
        valid: r.valid,
        errors: r.errors,
        warnings: r.warnings,
      })),
    });

    if (!validation.valid) {
      const errors = validation.results
        .map((result, index) => ({
          result,
          file: files[index],
          fileName: files[index]?.name || `Archivo ${index + 1}`,
        }))
        .filter(({ result }) => !result.valid)
        .map(({ fileName, result }) => `${fileName}: ${result.errors.join(', ')}`);

      logger.warn('Archivos rechazados por validación:', {
        errors,
        category,
        validationType,
      });

      return NextResponse.json(
        {
          error: 'Archivos no válidos',
          details: errors,
          summary: validation.summary,
        },
        { status: 400 }
      );
    }

    // Registrar warnings si existen
    const warnings = validation.results
      .map((result, index) => ({
        result,
        file: files[index],
        fileName: files[index]?.name || `Archivo ${index + 1}`,
      }))
      .filter(({ result }) => result.warnings.length > 0)
      .map(({ fileName, result }) => `${fileName}: ${result.warnings.join(', ')}`);

    if (warnings.length > 0) {
      logger.warn('Warnings de validación de archivos:', { warnings });
    }

    const uploadedFiles: Array<{
      id: string;
      name: string;
      url: string;
      size: number;
      status: string;
      validation: any;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationResult = validation.results[i];

      if (!file || !validationResult) {
        logger.error('Archivo o resultado de validación no encontrado', {
          index: i,
          totalFiles: files.length,
        });
        continue;
      }

      if (!file) {
        logger.error('Archivo no encontrado en índice', { index: i, totalFiles: files.length });
        continue;
      }

      if (!validationResult) {
        logger.error('Resultado de validación no encontrado en índice', {
          index: i,
          totalResults: validation.results.length,
        });
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generar nombre de archivo único
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = path.extname(file.name);
      const fileName = `${timestamp}_${randomId}${fileExtension}`;

      // Determinar directorio según el tipo de archivo
      const uploadDir = validationType === 'images' ? 'images' : 'documents';
      const filePath = path.join(process.cwd(), 'public', 'uploads', uploadDir, fileName);

      // Crear directorio si no existe
      const fs = await import('fs');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Guardar archivo
      await writeFile(filePath, buffer);

      // Preparar metadatos adicionales
      const metadata = {
        validation: {
          hash: validationResult.metadata.hash,
          checksum: validationResult.metadata.checksum,
          warnings: validationResult.warnings,
        },
        security: {
          scanned: true,
          safe: true,
          integrityVerified: true,
        },
        originalName: file.name,
        uploadTimestamp: new Date().toISOString(),
      };

      // Guardar información en la base de datos
      const documentData = {
        name: title || file.name,
        type: documentType || category || 'OTHER_DOCUMENT',
        fileName: fileName, // Usar el nombre único generado
        filePath: `/uploads/${uploadDir}/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: user.id,
        propertyId: propertyId || null, // ✅ AGREGADO: Asociar con propiedad si se proporciona
      };

      logger.info('Creando documento en la base de datos:', documentData);

      const document = await db.document.create({
        data: documentData,
      });

      logger.info('Documento creado exitosamente:', { documentId: document.id });

      uploadedFiles.push({
        id: document.id,
        name: document.fileName,
        url: `/uploads/${uploadDir}/${fileName}`,
        size: document.fileSize,
        status: 'completed',
        validation: validationResult,
      });

      logger.info('Archivo subido exitosamente:', {
        documentId: document.id,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        validationPassed: validationResult.valid,
        warnings: validationResult.warnings.length,
      });
    }

    return NextResponse.json({
      message: 'Documentos subidos exitosamente',
      files: uploadedFiles,
    });
  } catch (error) {
    logger.error('Error al subir documentos:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const where: any = {
      uploadedById: user.id,
    };

    if (category && category !== 'all') {
      where.type = category;
    }

    const documents = await db.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const total = await db.document.count({ where });

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error al obtener documentos:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
