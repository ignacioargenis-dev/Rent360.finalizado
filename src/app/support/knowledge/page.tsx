'use client';

// Build fix - force update

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  BookOpen,
  Search,
  FileText,
  HelpCircle,
  FolderOpen,
  Star,
  Eye,
  Clock,
  User,
  Plus,
  Filter,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Edit,
  Trash2,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  TrendingUp,
  Award,
  X,
  ChevronRight,
  Pin,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  helpful: number;
  isPublished: boolean;
}

interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  articleCount: number;
  icon: string;
  color: string;
}

interface SearchFilters {
  category: string;
  sortBy: 'relevance' | 'views' | 'recent' | 'helpful';
  query: string;
}

export default function SupportKnowledgePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    sortBy: 'relevance',
    query: '',
  });
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [recentViews, setRecentViews] = useState<KnowledgeArticle[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [votedArticles, setVotedArticles] = useState<{ [key: string]: 'up' | 'down' | undefined }>({});
  const [creatingArticle, setCreatingArticle] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const loadKnowledgeData = async () => {
      try {
        // Mock categories
        const mockCategories: KnowledgeCategory[] = [
          {
            id: '1',
            name: 'Solución de Problemas',
            description: 'Guías para resolver problemas comunes',
            articleCount: 45,
            icon: 'HelpCircle',
            color: 'blue',
          },
          {
            id: '2',
            name: 'Configuración',
            description: 'Cómo configurar y personalizar el sistema',
            articleCount: 32,
            icon: 'Settings',
            color: 'green',
          },
          {
            id: '3',
            name: 'API y Desarrollo',
            description: 'Documentación técnica para desarrolladores',
            articleCount: 28,
            icon: 'FileText',
            color: 'purple',
          },
          {
            id: '4',
            name: 'Preguntas Frecuentes',
            description: 'Respuestas a preguntas comunes',
            articleCount: 67,
            icon: 'HelpCircle',
            color: 'orange',
          },
        ];

        // Mock articles
        const mockArticles: KnowledgeArticle[] = [
          {
            id: '1',
            title: 'Cómo resolver problemas de conexión a la base de datos',
            content: 'Guía completa para diagnosticar y solucionar problemas de conexión...',
            category: 'Solución de Problemas',
            tags: ['base de datos', 'conexión', 'PostgreSQL'],
            author: 'María González',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            views: 245,
            helpful: 18,
            isPublished: true,
          },
          {
            id: '2',
            title: 'Configuración de notificaciones por email',
            content: 'Aprende a configurar las notificaciones automáticas por email...',
            category: 'Configuración',
            tags: ['email', 'notificaciones', 'SMTP'],
            author: 'Carlos Rodríguez',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            views: 189,
            helpful: 24,
            isPublished: true,
          },
          {
            id: '3',
            title: 'API de autenticación - Guía completa',
            content: 'Documentación completa de los endpoints de autenticación...',
            category: 'API y Desarrollo',
            tags: ['API', 'autenticación', 'JWT'],
            author: 'Ana López',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            views: 312,
            helpful: 31,
            isPublished: true,
          },
          {
            id: '4',
            title: '¿Cómo cambiar mi contraseña?',
            content: 'Pasos sencillos para cambiar tu contraseña de usuario...',
            category: 'Preguntas Frecuentes',
            tags: ['contraseña', 'seguridad', 'cuenta'],
            author: 'Pedro Martínez',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
            views: 456,
            helpful: 67,
            isPublished: true,
          },
        ];

        setCategories(mockCategories);
        setArticles(mockArticles);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading knowledge data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadKnowledgeData();
  }, []);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
  };

  const handleCategoryFilter = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const getFilteredArticles = () => {
    let filtered = articles;

    if (filters.category !== 'all') {
      filtered = filtered.filter(article => article.category === filters.category);
    }

    if (filters.query) {
      filtered = filtered.filter(
        article =>
          article.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          article.content.toLowerCase().includes(filters.query.toLowerCase()) ||
          article.tags.some(tag => tag.toLowerCase().includes(filters.query.toLowerCase()))
      );
    }

    // Sort articles
    switch (filters.sortBy) {
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'helpful':
        filtered.sort((a, b) => b.helpful - a.helpful);
        break;
      default:
        // relevance - keep original order
        break;
    }

    return filtered;
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'HelpCircle':
        return <HelpCircle className="w-6 h-6" />;
      case 'Settings':
        return <BookOpen className="w-6 h-6" />;
      case 'FileText':
        return <FileText className="w-6 h-6" />;
      default:
        return <FolderOpen className="w-6 h-6" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewArticle = (article: KnowledgeArticle) => {
    // Increment view count
    setArticles(prev => prev.map(a =>
      a.id === article.id ? { ...a, views: a.views + 1 } : a
    ));

    // Add to recent views
    setRecentViews(prev => {
      const filtered = prev.filter(a => a.id !== article.id);
      return [article, ...filtered].slice(0, 5);
    });

    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  const handleVoteArticle = (articleId: string, vote: 'up' | 'down') => {
    const currentVote = votedArticles[articleId];
    let helpfulChange = 0;

    if (currentVote === vote) {
      // Remove vote
      delete votedArticles[articleId];
      helpfulChange = vote === 'up' ? -1 : 0; // Only decrease if it was an upvote
    } else if (currentVote) {
      // Change vote
      helpfulChange = vote === 'up' ? 2 : -1; // up: +2 (remove down, add up), down: -1 (remove up)
    } else {
      // New vote
      helpfulChange = vote === 'up' ? 1 : 0; // Only increase for upvotes
    }

    setVotedArticles(prev => ({
      ...prev,
      [articleId]: currentVote === vote ? undefined : vote
    }));

    setArticles(prev => prev.map(a =>
      a.id === articleId ? { ...a, helpful: Math.max(0, a.helpful + helpfulChange) } : a
    ));
  };

  const handleToggleFavorite = (articleId: string) => {
    setFavorites(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleCreateArticle = () => {
    setEditingArticle(null);
    setShowCreateModal(true);
  };

  const handleEditArticle = (article: KnowledgeArticle) => {
    setEditingArticle(article);
    setShowCreateModal(true);
  };

  const handleSaveArticle = async (articleData: Partial<KnowledgeArticle>) => {
    try {
      setCreatingArticle(true);

      if (editingArticle) {
        // Update existing article
        setArticles(prev => prev.map(a =>
          a.id === editingArticle.id
            ? { ...a, ...articleData, updatedAt: new Date().toISOString() }
            : a
        ));
      } else {
        // Create new article
        const newArticle: KnowledgeArticle = {
          id: String(Date.now()),
          title: articleData.title || '',
          content: articleData.content || '',
          category: articleData.category || '',
          tags: articleData.tags || [],
          author: user?.name || 'Usuario',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          views: 0,
          helpful: 0,
          isPublished: true,
        };
        setArticles(prev => [newArticle, ...prev]);
      }

      setShowCreateModal(false);
      setEditingArticle(null);
    } catch (error) {
      logger.error('Error saving article:', { error });
    } finally {
      setCreatingArticle(false);
    }
  };

  const handleShareArticle = (article: KnowledgeArticle) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: `Artículo de conocimiento: ${article.title}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/support/knowledge/${article.id}`);
    }
  };

  const getFeaturedArticles = () => {
    return articles
      .filter(a => a.isPublished)
      .sort((a, b) => (b.helpful + b.views / 10) - (a.helpful + a.views / 10))
      .slice(0, 3);
  };

  const getArticleStats = () => {
    const totalArticles = articles.length;
    const publishedArticles = articles.filter(a => a.isPublished).length;
    const totalViews = articles.reduce((sum, a) => sum + a.views, 0);
    const totalHelpful = articles.reduce((sum, a) => sum + a.helpful, 0);

    return {
      totalArticles,
      publishedArticles,
      totalViews,
      totalHelpful,
      averageRating: totalArticles > 0 ? (totalHelpful / totalArticles).toFixed(1) : '0',
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando base de conocimientos...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Base de Conocimientos"
      subtitle="Recursos y documentación para el equipo de soporte"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with search and filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Base de Conocimientos</h1>
            <p className="text-gray-600">Recursos y documentación para el equipo de soporte</p>
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar artículos..."
                value={filters.query}
                onChange={e => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleCreateArticle}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Artículo
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={filters.category} onValueChange={handleCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevancia</SelectItem>
              <SelectItem value="views">Más visto</SelectItem>
              <SelectItem value="recent">Más reciente</SelectItem>
              <SelectItem value="helpful">Más útil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(() => {
            const stats = getArticleStats();
            return (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Artículos</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalArticles}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.publishedArticles} publicados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Vistas</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      En todos los artículos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.averageRating}</div>
                    <p className="text-xs text-muted-foreground">
                      Votos positivos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Artículos Útiles</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalHelpful}</div>
                    <p className="text-xs text-muted-foreground">
                      Votos positivos totales
                    </p>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>

        {/* Featured Articles */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pin className="w-5 h-5 text-blue-600" />
              Artículos Destacados
            </CardTitle>
            <CardDescription>
              Los artículos más útiles y populares de la base de conocimientos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getFeaturedArticles().map(article => (
                <div
                  key={article.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleViewArticle(article)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 line-clamp-2">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-1 ml-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">{article.helpful}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {article.content.substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{article.category}</span>
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      <span>{article.views}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Categorías
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        filters.category === 'all'
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleCategoryFilter('all')}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-sm">Todas las categorías</span>
                      </div>
                      <p className="text-xs text-gray-600">{articles.length} artículos</p>
                    </div>
                    {categories.map(category => (
                      <div
                        key={category.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          filters.category === category.name
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleCategoryFilter(category.name)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`p-1 rounded ${
                              category.color === 'blue'
                                ? 'bg-blue-100 text-blue-600'
                                : category.color === 'green'
                                  ? 'bg-green-100 text-green-600'
                                  : category.color === 'purple'
                                    ? 'bg-purple-100 text-purple-600'
                                    : 'bg-orange-100 text-orange-600'
                            }`}
                          >
                            {getCategoryIcon(category.icon)}
                          </div>
                          <span className="font-medium text-sm">{category.name}</span>
                        </div>
                        <p className="text-xs text-gray-600">{category.articleCount} artículos</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Views */}
              {recentViews.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Vistos Recientemente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentViews.map(article => (
                        <div
                          key={article.id}
                          className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleViewArticle(article)}
                        >
                          <h5 className="font-medium text-sm text-gray-900 line-clamp-1">
                            {article.title}
                          </h5>
                          <p className="text-xs text-gray-600">{article.category}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Favorites */}
              {favorites.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookmarkCheck className="w-5 h-5 text-red-500" />
                      Favoritos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {favorites.slice(0, 5).map(articleId => {
                        const article = articles.find(a => a.id === articleId);
                        if (!article) return null;
                        return (
                          <div
                            key={article.id}
                            className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleViewArticle(article)}
                          >
                            <h5 className="font-medium text-sm text-gray-900 line-clamp-1">
                              {article.title}
                            </h5>
                            <p className="text-xs text-gray-600">{article.category}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Articles List */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {getFilteredArticles().length === 0 ? (
                <Card>
                  <CardContent className="pt-8 pb-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {filters.query
                        ? 'No se encontraron artículos'
                        : 'No hay artículos en esta categoría'}
                    </h3>
                    <p className="text-gray-600">
                      {filters.query
                        ? 'Intenta con otros términos de búsqueda'
                        : 'Esta categoría aún no tiene artículos publicados'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                getFilteredArticles().map(article => (
                  <Card key={article.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3
                              className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer flex-1"
                              onClick={() => handleViewArticle(article)}
                            >
                              {article.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {article.category}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {article.content.substring(0, 150)}...
                          </p>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {article.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {article.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{article.tags.length - 3}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{article.author}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(article.updatedAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{article.views}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                <span>{article.helpful}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVoteArticle(article.id, 'up')}
                            className={votedArticles[article.id] === 'up' ? 'bg-green-50 border-green-200' : ''}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVoteArticle(article.id, 'down')}
                            className={votedArticles[article.id] === 'down' ? 'bg-red-50 border-red-200' : ''}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleFavorite(article.id)}
                            className={favorites.includes(article.id) ? 'bg-red-50 border-red-200' : ''}
                          >
                            {favorites.includes(article.id) ? (
                              <BookmarkCheck className="w-4 h-4 text-red-500" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShareArticle(article)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditArticle(article)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal para ver artículo completo */}
        {showArticleModal && selectedArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedArticle.title}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedArticle.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(selectedArticle.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {selectedArticle.views} vistas
                    </span>
                    <Badge variant="outline">{selectedArticle.category}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVoteArticle(selectedArticle.id, 'up')}
                    className={votedArticles[selectedArticle.id] === 'up' ? 'bg-green-50 border-green-200' : ''}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {selectedArticle.helpful}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleFavorite(selectedArticle.id)}
                    className={favorites.includes(selectedArticle.id) ? 'bg-red-50 border-red-200' : ''}
                  >
                    {favorites.includes(selectedArticle.id) ? (
                      <BookmarkCheck className="w-4 h-4 text-red-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShareArticle(selectedArticle)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditArticle(selectedArticle)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowArticleModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="prose prose-gray max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {selectedArticle.content}
                  </div>
                </div>

                {selectedArticle.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium text-gray-700 mb-2">Etiquetas:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-700 mb-4">¿Te resultó útil este artículo?</h4>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleVoteArticle(selectedArticle.id, 'up')}
                      className={votedArticles[selectedArticle.id] === 'up' ? 'bg-green-50 border-green-200' : ''}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Sí, muy útil
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleVoteArticle(selectedArticle.id, 'down')}
                      className={votedArticles[selectedArticle.id] === 'down' ? 'bg-red-50 border-red-200' : ''}
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      No, necesita mejoras
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para crear/editar artículo */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingArticle ? 'Editar Artículo' : 'Crear Nuevo Artículo'}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const articleData = {
                    title: formData.get('title') as string,
                    content: formData.get('content') as string,
                    category: formData.get('category') as string,
                    tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()) || [],
                  };
                  handleSaveArticle(articleData);
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título *
                      </label>
                      <Input
                        name="title"
                        defaultValue={editingArticle?.title || ''}
                        placeholder="Título del artículo"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría *
                      </label>
                      <Select name="category" defaultValue={editingArticle?.category || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contenido *
                      </label>
                      <Textarea
                        name="content"
                        defaultValue={editingArticle?.content || ''}
                        placeholder="Contenido del artículo..."
                        rows={15}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Etiquetas (separadas por comas)
                      </label>
                      <Input
                        name="tags"
                        defaultValue={editingArticle?.tags?.join(', ') || ''}
                        placeholder="ej: base de datos, configuración, api"
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={creatingArticle}
                      >
                        {creatingArticle ? 'Guardando...' : (editingArticle ? 'Actualizar Artículo' : 'Crear Artículo')}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
