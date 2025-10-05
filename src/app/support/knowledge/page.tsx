'use client';

// Build fix - force update

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
            <Button variant="outline">
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

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Categorías
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
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
                            <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
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

                        <div className="flex items-center gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
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
      </div>
    </UnifiedDashboardLayout>
  );
}
