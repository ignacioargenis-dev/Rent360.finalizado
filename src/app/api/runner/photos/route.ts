import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/runner/photos
 * Obtiene todos los reportes fotográficos del runner autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';
    const dateFilter = searchParams.get('dateFilter') || 'all';

    // Obtener todas las visitas del runner
    const whereClause: any = {
      runnerId: user.id,
    };

    if (statusFilter !== 'all') {
      whereClause.status = statusFilter;
    }

    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause.scheduledAt = {
        gte: today,
      };
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      whereClause.scheduledAt = {
        gte: weekAgo,
      };
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      whereClause.scheduledAt = {
        gte: monthAgo,
      };
    }

    const visits = await db.visit.findMany({
      where: whereClause,
      include: {
        property: {
          include: {
            propertyImages: true,
            owner: true,
          },
        },
        tenant: true,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Transformar visitas en PhotoReport
    const photoReports = visits.map((visit) => {
      // Obtener fotos asociadas a esta visita desde PropertyImage
      // Las fotos tienen metadata JSON en el campo 'alt' con visitId
      const visitPhotos = visit.property.propertyImages
        .map((img) => {
          try {
            const metadata = img.alt ? JSON.parse(img.alt) : null;
            if (metadata && metadata.visitId === visit.id) {
              return {
                id: img.id,
                url: img.url,
                filename: img.url.split('/').pop() || 'image.jpg',
                size: 0, // No tenemos tamaño en PropertyImage
                uploadedAt: img.createdAt.toISOString(),
                category: metadata.category || 'general',
                description: metadata.description || '',
                isMain: metadata.isMain || false,
              };
            }
            return null;
          } catch {
            // Si no es JSON válido, ignorar
            return null;
          }
        })
        .filter((photo) => photo !== null) as any[];

      // Determinar status basado en la visita y fotos
      let status: 'PENDING' | 'UPLOADED' | 'REVIEWED' | 'APPROVED' | 'REJECTED' = 'PENDING';
      if (visit.status === 'COMPLETED' && visitPhotos.length > 0) {
        status = 'UPLOADED';
        // Si la visita tiene rating, considerarla aprobada
        if (visit.rating && visit.rating >= 4) {
          status = 'APPROVED';
        } else if (visit.rating && visit.rating < 3) {
          status = 'REJECTED';
        } else if (visit.clientFeedback) {
          status = 'REVIEWED';
        }
      } else if (visit.status === 'COMPLETED' && visitPhotos.length === 0) {
        status = 'PENDING';
      }

      return {
        id: visit.id,
        visitId: visit.id,
        propertyTitle: visit.property.title || 'Propiedad sin título',
        propertyAddress: visit.property.address || '',
        clientName: visit.tenant?.name || visit.property.owner?.name || 'Cliente no asignado',
        visitDate: visit.scheduledAt.toISOString().split('T')[0],
        photos: visitPhotos,
        status,
        earnings: visit.earnings || 0,
        notes: visit.notes || undefined,
        reviewerFeedback: visit.clientFeedback || undefined,
        createdAt: visit.createdAt.toISOString(),
        updatedAt: visit.updatedAt.toISOString(),
      };
    });

    // Calcular estadísticas
    const totalPhotos = photoReports.reduce((sum, report) => sum + report.photos.length, 0);
    const pendingUploads = photoReports.filter((report) => report.status === 'PENDING').length;
    const now = new Date();
    const uploadedThisMonth = photoReports
      .filter((report) => {
        const uploadDate = new Date(report.createdAt);
        return (
          uploadDate.getMonth() === now.getMonth() &&
          uploadDate.getFullYear() === now.getFullYear() &&
          report.photos.length > 0
        );
      })
      .reduce((sum, report) => sum + report.photos.length, 0);
    const approvedPhotos = photoReports
      .filter((report) => report.status === 'APPROVED')
      .reduce((sum, report) => sum + report.photos.length, 0);
    const totalEarnings = photoReports
      .filter((report) => report.status === 'APPROVED')
      .reduce((sum, report) => sum + report.earnings, 0);

    // Calcular promedio de ratings
    const ratedVisits = visits.filter((v) => v.rating !== null);
    const averageRating =
      ratedVisits.length > 0
        ? ratedVisits.reduce((sum, v) => sum + (v.rating || 0), 0) / ratedVisits.length
        : 0;

    const completionRate =
      photoReports.length > 0
        ? ((photoReports.length - pendingUploads) / photoReports.length) * 100
        : 0;

    return NextResponse.json({
      photoReports,
      stats: {
        totalPhotos,
        pendingUploads,
        uploadedThisMonth,
        approvedPhotos,
        totalEarnings,
        averageRating: Number(averageRating.toFixed(1)),
        completionRate: Number(completionRate.toFixed(1)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching runner photos:', error);
    return NextResponse.json(
      { error: 'Error al obtener las fotos del runner', details: error.message },
      { status: 500 }
    );
  }
}

