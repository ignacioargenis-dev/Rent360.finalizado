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

    // Construir filtros para la consulta
    const where: any = {};

    if (category !== 'all') {
      where.category = category;
    }

    if (status !== 'all') {
      if (status === 'published') {
        where.isPublished = true;
      } else if (status === 'draft') {
        where.isPublished = false;
      } else if (status === 'featured') {
        where.isFeatured = true;
      }
    }

    // Obtener artículos de la base de datos
    const articles = await db.knowledgeArticle.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Formatear artículos para la respuesta
    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      summary: article.summary,
      category: article.category,
      tags: article.tags,
      author: article.author.name,
      isPublished: article.isPublished,
      isFeatured: article.isFeatured,
      views: article.views,
      helpful: article.helpful,
      notHelpful: article.notHelpful,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    }));

    // Calcular estadísticas
    const totalArticles = await db.knowledgeArticle.count();
    const publishedArticles = await db.knowledgeArticle.count({ where: { isPublished: true } });
    const draftArticles = await db.knowledgeArticle.count({ where: { isPublished: false } });
    const featuredArticles = await db.knowledgeArticle.count({ where: { isFeatured: true } });
    const allArticlesForStats = await db.knowledgeArticle.findMany({
      select: { views: true, helpful: true, notHelpful: true },
    });
    const totalViews = allArticlesForStats.reduce((sum, a) => sum + a.views, 0);
    const totalHelpful = allArticlesForStats.reduce((sum, a) => sum + a.helpful, 0);

    const stats = {
      totalArticles,
      publishedArticles,
      draftArticles,
      featuredArticles,
      totalViews,
      totalHelpful,
    };

    return NextResponse.json({
      success: true,
      articles: formattedArticles,
      stats,
      pagination: {
        page: 1,
        limit,
        total: formattedArticles.length,
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
    const { title, content, summary, category, tags, isPublished, isFeatured } = body;

    if (!title || !content || !summary) {
      return NextResponse.json(
        { error: 'Título, contenido y resumen son obligatorios' },
        { status: 400 }
      );
    }

    logger.info('POST /api/support/knowledge - Creando artículo de conocimiento', {
      userId: user.id,
      title,
      category,
      isPublished: isPublished || false,
    });

    // Guardar el artículo en la base de datos
    const article = await db.knowledgeArticle.create({
      data: {
        title,
        content,
        summary,
        category: category || 'general',
        tags: tags || [],
        authorId: user.id,
        isPublished: isPublished || false,
        isFeatured: isFeatured || false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Artículo creado correctamente',
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        summary: article.summary,
        category: article.category,
        tags: article.tags,
        author: article.author.name,
        isPublished: article.isPublished,
        isFeatured: article.isFeatured,
        views: article.views,
        helpful: article.helpful,
        notHelpful: article.notHelpful,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error en POST /api/support/knowledge:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { articleId, isPublished, isFeatured, title, content, summary, category, tags } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'ID del artículo es obligatorio' }, { status: 400 });
    }

    logger.info('PUT /api/support/knowledge - Actualizando artículo de conocimiento', {
      userId: user.id,
      articleId,
      isPublished,
      isFeatured,
    });

    // Verificar que el artículo existe
    const existingArticle = await db.knowledgeArticle.findUnique({
      where: { id: articleId },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
    }

    // Construir datos de actualización
    const updateData: any = {};

    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
    }
    if (isFeatured !== undefined) {
      updateData.isFeatured = isFeatured;
    }
    if (title !== undefined) {
      updateData.title = title;
    }
    if (content !== undefined) {
      updateData.content = content;
    }
    if (summary !== undefined) {
      updateData.summary = summary;
    }
    if (category !== undefined) {
      updateData.category = category;
    }
    if (tags !== undefined) {
      updateData.tags = tags;
    }

    // Actualizar el artículo
    const updatedArticle = await db.knowledgeArticle.update({
      where: { id: articleId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Artículo actualizado correctamente',
      article: {
        id: updatedArticle.id,
        title: updatedArticle.title,
        content: updatedArticle.content,
        summary: updatedArticle.summary,
        category: updatedArticle.category,
        tags: updatedArticle.tags,
        author: updatedArticle.author.name,
        isPublished: updatedArticle.isPublished,
        isFeatured: updatedArticle.isFeatured,
        views: updatedArticle.views,
        helpful: updatedArticle.helpful,
        notHelpful: updatedArticle.notHelpful,
        createdAt: updatedArticle.createdAt.toISOString(),
        updatedAt: updatedArticle.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error en PUT /api/support/knowledge:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
