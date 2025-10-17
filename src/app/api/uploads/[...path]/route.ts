import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const filePath = params.path.join('/');

    // Construir la ruta completa del archivo
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath);

    // Verificar que el archivo existe
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Leer el archivo
    const fileBuffer = await readFile(fullPath);

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
        'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    // Error serving file - log internally
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
