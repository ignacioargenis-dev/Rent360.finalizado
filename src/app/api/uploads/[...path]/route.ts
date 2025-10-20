import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const filePath = params.path.join('/');
    console.log('🔍 Requested file path:', filePath);

    // Construir la ruta completa del archivo
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath);
    console.log('📁 Full path:', fullPath);

    // Verificar que el archivo existe
    if (!existsSync(fullPath)) {
      console.log('❌ File not found at:', fullPath);
      // En lugar de devolver 404 inmediatamente, devolver una imagen placeholder o null
      // Esto evita errores 404 en el frontend cuando las imágenes no existen
      return new Response(null, { status: 204 }); // No Content
    }

    const finalPath = fullPath;

    // Leer el archivo
    const fileBuffer = await readFile(finalPath);

    // Determinar el tipo MIME basado en la extensión
    const extension = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';

    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'doc':
        contentType = 'application/msword';
        break;
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'txt':
        contentType = 'text/plain';
        break;
    }

    // Devolver el archivo con los headers apropiados
    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache por 1 hora con revalidación
        'Content-Length': fileBuffer.length.toString(),
        ETag: `"${filePath}-${fileBuffer.length}"`, // ETag para validación de caché
        'Last-Modified': new Date().toUTCString(),
      },
    });
  } catch (error) {
    // Error serving file - log internally
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
