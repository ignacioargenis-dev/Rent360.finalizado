import { logger } from '@/lib/logger-edge';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { writeFile } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { validateFileMiddleware, FILE_TYPES } from '@/lib/file-validation';

  export async function POST(request: NextRequest) {
    try {
      const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string || 'documents';
    const tags = formData.getAll('tags') as string[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron archivos' }, { status: 400 });
    }

    // Determinar tipo de validación basado en la categoría
    const validationType = category === 'contracts' ? 'contracts' :
                          category === 'images' ? 'images' : 'documents';

    // Validar archivos
    const validation = await validateFileMiddleware(files, validationType);

    if (!validation.valid) {
      const errors = validation.results
        .map((r, index) => ({ result: r, file: files[index] }))
        .filter(({ result }) => !result.valid)
        .map(({ file, result }) => `${file.name}: ${result.errors.join(', ')}`);

      logger.warn('Archivos rechazados por validación:', {
        errors,
        category,
        validationType
      });

      return NextResponse.json({
        error: 'Archivos no válidos',
        details: errors,
        summary: validation.summary
      }, { status: 400 });
    }

    // Registrar warnings si existen
    const warnings = validation.results
      .map((r, index) => ({ result: r, file: files[index] }))
      .filter(({ result }) => result.warnings.length > 0)
      .map(({ file, result }) => `${file.name}: ${result.warnings.join(', ')}`);

    if (warnings.length > 0) {
      logger.warn('Warnings de validación de archivos:', { warnings });
    }

    const uploadedFiles: Array<{
      id: string;
      name: string;
      url: string;
      size: number;
      status: string;
    }> = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationResult = validation.results[i];

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generar nombre de archivo único
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = path.extname(file.name);
      const fileName = `${timestamp}_${randomId}${fileExtension}`;
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'documents', fileName);

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
          warnings: validationResult.warnings
        },
        security: {
          scanned: true,
          safe: true,
          integrityVerified: true
        },
        originalName: file.name,
        uploadTimestamp: new Date().toISOString()
      };

      // Guardar información en la base de datos
      const document = await db.document.create({
        data: {
          title: title || file.name,
          description: description || '',
          category: category || 'other',
          file_name: fileName, // Usar el nombre único generado
          file_path: `/uploads/documents/${fileName}`,
          file_size: file.size,
          file_type: file.type,
          tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
          uploaded_by: session.user?.email || 'unknown',
          status: 'active',
          metadata: JSON.stringify(metadata)
        },
      });

      uploadedFiles.push({
        id: document.id,
        name: document.file_name,
        url: `/uploads/documents/${fileName}`,
        size: document.file_size,
        status: 'completed',
        validation: validationResult
      });

      logger.info('Archivo subido exitosamente:', {
        documentId: document.id,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        validationPassed: validationResult.valid,
        warnings: validationResult.warnings.length
      });
    }

    return NextResponse.json({
      message: 'Documentos subidos exitosamente',
      files: uploadedFiles,
    });

  } catch (error) {
    logger.error('Error al subir documentos:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
         const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const where: any = {
      uploaded_by: session.user?.email || 'unknown',
      status: 'active',
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    const documents = await db.document.findMany({
      where,
      orderBy: { created_at: 'desc' },
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
    logger.error('Error al obtener documentos:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
