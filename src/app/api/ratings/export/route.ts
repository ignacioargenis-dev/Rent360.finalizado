import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { UserRatingService } from '@/lib/user-rating-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { RatingContextType } from '@/types/index';

/**
 * GET /api/ratings/export
 * Exportar calificaciones en formato CSV o PDF
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const format = searchParams.get('format') || 'csv'; // csv o pdf
    const userId = searchParams.get('userId') || user.id;
    const contextType = searchParams.get('contextType') as RatingContextType | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Obtener todas las calificaciones (sin límite para exportación)
    const filters: any = {
      limit: 10000, // Límite alto para exportación
      offset: 0,
    };

    if (contextType) {
      filters.contextType = contextType;
    }
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const { ratings } = await UserRatingService.getUserRatings(userId, filters);

    if (format === 'csv') {
      // Generar CSV
      const headers = [
        'ID',
        'Fecha',
        'De Usuario',
        'Para Usuario',
        'Contexto',
        'Calificación General',
        'Comunicación',
        'Confiabilidad',
        'Profesionalismo',
        'Calidad',
        'Puntualidad',
        'Comentario',
        'Respuesta',
        'Fecha Respuesta',
        'Verificado',
        'Público',
        'Anónimo',
      ];

      const rows = ratings.map(rating => [
        rating.id,
        rating.createdAt.toISOString(),
        rating.fromUser?.name || 'N/A',
        rating.toUser?.name || 'N/A',
        rating.contextType,
        rating.overallRating,
        rating.communicationRating || '',
        rating.reliabilityRating || '',
        rating.professionalismRating || '',
        rating.qualityRating || '',
        rating.punctualityRating || '',
        (rating.comment || '').replace(/"/g, '""'), // Escapar comillas
        (rating.response || '').replace(/"/g, '""'),
        rating.responseDate?.toISOString() || '',
        rating.isVerified ? 'Sí' : 'No',
        rating.isPublic ? 'Sí' : 'No',
        rating.isAnonymous ? 'Sí' : 'No',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="calificaciones_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // Para PDF, devolver JSON que el frontend puede convertir
      // O usar una librería como pdfkit en el servidor
      return NextResponse.json({
        success: true,
        message: 'Exportación PDF disponible próximamente',
        data: ratings,
        format: 'json', // Por ahora devolver JSON
      });
    } else {
      return NextResponse.json(
        { error: 'Formato no soportado. Use "csv" o "pdf"' },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Error exportando calificaciones:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
