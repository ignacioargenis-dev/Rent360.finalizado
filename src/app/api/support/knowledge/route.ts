import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    logger.info('GET /api/support/knowledge - Obteniendo artículos de conocimiento', {
      userId: user.id,
      category,
      status,
      limit,
    });

    // Por ahora, como no tenemos un modelo específico para artículos de conocimiento,
    // devolveremos datos simulados basados en tickets y categorías comunes
    // En una implementación real, habría una tabla KnowledgeArticle en la base de datos

    const mockArticles = [
      {
        id: '1',
        title: 'Cómo crear una cuenta en Rent360',
        content: 'Guía paso a paso para registrarse como usuario en la plataforma...',
        summary: 'Aprende a crear tu cuenta y comenzar a usar Rent360',
        category: 'account',
        isPublished: true,
        isFeatured: true,
        views: 245,
        helpful: 23,
        notHelpful: 2,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        author: 'Equipo de Soporte',
        tags: ['registro', 'cuenta', 'inicio'],
      },
      {
        id: '2',
        title: 'Proceso de verificación de identidad',
        content: 'Información sobre cómo verificar tu identidad en la plataforma...',
        summary: 'Guía completa del proceso de verificación KYC',
        category: 'account',
        isPublished: true,
        isFeatured: false,
        views: 189,
        helpful: 18,
        notHelpful: 1,
        createdAt: '2024-01-12T09:15:00Z',
        updatedAt: '2024-01-12T09:15:00Z',
        author: 'Equipo Legal',
        tags: ['verificación', 'KYC', 'identidad'],
      },
      {
        id: '3',
        title: 'Cómo pagar tu arriendo',
        content: 'Métodos de pago disponibles y proceso para pagar tu arriendo mensual...',
        summary: 'Todas las formas de pagar tu arriendo de manera segura',
        category: 'billing',
        isPublished: true,
        isFeatured: true,
        views: 312,
        helpful: 45,
        notHelpful: 3,
        createdAt: '2024-01-08T16:20:00Z',
        updatedAt: '2024-01-14T11:45:00Z',
        author: 'Equipo de Pagos',
        tags: ['pago', 'arriendo', 'facturación'],
      },
      {
        id: '4',
        title: 'Solución de problemas técnicos comunes',
        content: 'Resolución de los problemas más frecuentes en la plataforma...',
        summary: 'Soluciones para los errores más comunes',
        category: 'technical',
        isPublished: true,
        isFeatured: false,
        views: 156,
        helpful: 28,
        notHelpful: 4,
        createdAt: '2024-01-13T13:30:00Z',
        updatedAt: '2024-01-13T13:30:00Z',
        author: 'Equipo Técnico',
        tags: ['errores', 'técnico', 'problemas'],
      },
      {
        id: '5',
        title: 'Política de cancelación de contratos',
        content: 'Información sobre cómo cancelar un contrato de arriendo...',
        summary: 'Procedimiento legal para cancelar contratos',
        category: 'general',
        isPublished: false,
        isFeatured: false,
        views: 0,
        helpful: 0,
        notHelpful: 0,
        createdAt: '2024-01-16T10:00:00Z',
        updatedAt: '2024-01-16T10:00:00Z',
        author: 'Equipo Legal',
        tags: ['contrato', 'cancelación', 'legal'],
      },
    ];

    // Filtrar por categoría y estado
    let filteredArticles = mockArticles;

    if (category !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.category === category);
    }

    if (status !== 'all') {
      filteredArticles = filteredArticles.filter(article =>
        status === 'published' ? article.isPublished : !article.isPublished
      );
    }

    // Limitar resultados
    filteredArticles = filteredArticles.slice(0, limit);

    // Calcular estadísticas
    const stats = {
      totalArticles: mockArticles.length,
      publishedArticles: mockArticles.filter(a => a.isPublished).length,
      draftArticles: mockArticles.filter(a => !a.isPublished).length,
      featuredArticles: mockArticles.filter(a => a.isFeatured).length,
      totalViews: mockArticles.reduce((sum, a) => sum + a.views, 0),
      totalHelpful: mockArticles.reduce((sum, a) => sum + a.helpful, 0),
    };

    return NextResponse.json({
      success: true,
      articles: filteredArticles,
      stats,
      pagination: {
        page: 1,
        limit,
        total: filteredArticles.length,
        hasNext: false,
        hasPrev: false,
      },
    });
  } catch (error) {
    logger.error('Error en GET /api/support/knowledge:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, summary, category, isPublished } = body;

    logger.info('POST /api/support/knowledge - Creando artículo de conocimiento', {
      userId: user.id,
      title,
      category,
    });

    // En una implementación real, aquí se guardaría el artículo en la base de datos
    // Por ahora, solo devolvemos una respuesta de éxito

    return NextResponse.json({
      success: true,
      message: 'Artículo creado correctamente',
      articleId: `article-${Date.now()}`,
    });
  } catch (error) {
    logger.error('Error en POST /api/support/knowledge:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
