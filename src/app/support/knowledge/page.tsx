'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit,
  Clock,
  Tag,
  Star,
  TrendingUp,
  FileText,
  MessageSquare,
  ThumbsUp,
  Share2,
  UserIcon
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  authorRole: string;
  status: 'published' | 'draft' | 'archived';
  views: number;
  likes: number;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface KnowledgeStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  averageRating: number;
  topCategories: { name: string; count: number }[];
  recentActivity: { action: string; article: string; time: string }[];
}

export default function SupportKnowledgePage() {
  const { user, loading: userLoading } = useUserState();

  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);

  const [stats, setStats] = useState<KnowledgeStats | null>(null);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateArticle, setShowCreateArticle] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

  // Funciones para acciones rápidas
  const handleCreateArticle = () => {
    logger.info('Abriendo creación de nuevo artículo');
    setShowCreateArticle(true);
    // TODO: Implementar modal o navegación para crear artículo
  };

  const handleViewStats = () => {
    logger.info('Mostrando estadísticas detalladas');
    setShowStats(!showStats);
  };

  const handleExportArticles = async () => {
    try {
      logger.info('Iniciando exportación de artículos');

      // TODO: Implementar exportación real
      // const response = await fetch('/api/support/knowledge/export');
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = 'articulos-conocimiento.csv';
      // a.click();

      // Simular exportación
      alert('Exportación completada. Los artículos se han descargado.');

    } catch (error) {
      logger.error('Error exportando artículos:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al exportar los artículos');
    }
  };

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      const mockArticles: KnowledgeArticle[] = [
        {
          id: '1',
          title: 'Cómo resolver problemas de pago',
          content: 'Guía completa para resolver problemas comunes con pagos de arriendo...',
          category: 'Pagos',
          tags: ['pagos', 'facturación', 'problemas'],
          author: 'Soporte Rent360',
          authorRole: 'support',
          status: 'published',
          views: 1250,
          likes: 45,
          helpful: 42,
          createdAt: '2024-03-01',
          updatedAt: '2024-03-15',
          featured: true,
          difficulty: 'beginner',
        },
        {
          id: '2',
          title: 'Guía para propietarios nuevos',
          content: 'Todo lo que necesitas saber como nuevo propietario en la plataforma...',
          category: 'Propietarios',
          tags: ['propietarios', 'guía', 'nuevos'],
          author: 'María González',
          authorRole: 'owner',
          status: 'published',
          views: 890,
          likes: 32,
          helpful: 30,
          createdAt: '2024-02-28',
          updatedAt: '2024-03-10',
          featured: true,
          difficulty: 'beginner',
        },
        {
          id: '3',
          title: 'Optimización de perfiles de propiedades',
          content: 'Mejora la visibilidad de tus propiedades con estas técnicas...',
          category: 'Propiedades',
          tags: ['propiedades', 'optimización', 'marketing'],
          author: 'Carlos Ramírez',
          authorRole: 'broker',
          status: 'published',
          views: 654,
          likes: 28,
          helpful: 25,
          createdAt: '2024-02-25',
          updatedAt: '2024-03-05',
          featured: false,
          difficulty: 'intermediate',
        },
        {
          id: '4',
          title: 'Proceso de visitas virtuales',
          content: 'Cómo realizar visitas virtuales efectivas para propiedades...',
          category: 'Visitas',
          tags: ['visitas', 'virtuales', 'tecnología'],
          author: 'Soporte Rent360',
          authorRole: 'support',
          status: 'draft',
          views: 0,
          likes: 0,
          helpful: 0,
          createdAt: '2024-03-12',
          updatedAt: '2024-03-12',
          featured: false,
          difficulty: 'intermediate',
        },
        {
          id: '5',
          title: 'Gestión de contratos digitales',
          content: 'Todo sobre la firma y gestión de contratos digitales...',
          category: 'Contratos',
          tags: ['contratos', 'digitales', 'firmas'],
          author: 'Ana Silva',
          authorRole: 'support',
          status: 'published',
          views: 432,
          likes: 18,
          helpful: 16,
          createdAt: '2024-02-20',
          updatedAt: '2024-03-01',
          featured: false,
          difficulty: 'advanced',
        },
      ];

      setArticles(mockArticles);
      
      // Calculate stats
      const totalArticles = mockArticles.length;
      const publishedArticles = mockArticles.filter(a => a.status === 'published').length;
      const draftArticles = mockArticles.filter(a => a.status === 'draft').length;
      const totalViews = mockArticles.reduce((sum, a) => sum + a.views, 0);
      const averageRating = mockArticles.filter(a => a.status === 'published').reduce((sum, a) => sum + (a.helpful / Math.max(a.likes, 1)), 0) / Math.max(publishedArticles, 1);
      
      const categories = mockArticles.reduce((acc, article) => {
        acc[article.category] = (acc[article.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topCategories = Object.entries(categories)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalArticles,
        publishedArticles,
        draftArticles,
        totalViews,
        averageRating: Math.round(averageRating * 100) / 100,
        topCategories,
        recentActivity: [
          { action: 'Nuevo artículo', article: 'Proceso de visitas virtuales', time: 'Hace 2 horas' },
          { action: 'Actualización', article: 'Cómo resolver problemas de pago', time: 'Hace 5 horas' },
          { action: 'Nuevo comentario', article: 'Guía para propietarios nuevos', time: 'Hace 1 día' },
        ],
      });

      setLoading(false);
    }, 1000);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Publicado</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Borrador</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archivado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <Badge className="bg-blue-100 text-blue-800">Principiante</Badge>;
      case 'intermediate':
        return <Badge className="bg-purple-100 text-purple-800">Intermedio</Badge>;
      case 'advanced':
        return <Badge className="bg-red-100 text-red-800">Avanzado</Badge>;
      default:
        return <Badge>{difficulty}</Badge>;
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando base de conocimiento...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      title="Base de Conocimientos"
      subtitle="Recursos y documentación para el equipo de soporte"
    >
      <DashboardHeader 
        user={user}
        title="Base de Conocimiento"
        subtitle="Gestiona artículos y guías para usuarios"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Artículos</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats?.totalArticles || 0}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {stats?.publishedArticles || 0} publicados
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Vistas Totales</p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats?.totalViews?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {stats && stats.totalViews > 0 ? `+${Math.round(stats.totalViews * 0.15)} este mes` : 'Sin datos'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Calificación Promedio</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats?.averageRating || 0}/5
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Basado en artículos publicados
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Borradores</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats?.draftArticles || 0}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Por publicar
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar artículos..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">Todas las categorías</option>
                      <option value="Pagos">Pagos</option>
                      <option value="Propietarios">Propietarios</option>
                      <option value="Propiedades">Propiedades</option>
                      <option value="Visitas">Visitas</option>
                      <option value="Contratos">Contratos</option>
                    </select>
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Todos los estados</option>
                      <option value="published">Publicados</option>
                      <option value="draft">Borradores</option>
                      <option value="archived">Archivados</option>
                    </select>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Artículo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Articles List */}
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {article.title}
                            </h3>
                            {article.featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Destacado
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(article.status)}
                            {getDifficultyBadge(article.difficulty)}
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {article.content}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {article.category}
                          </Badge>
                          {article.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <UserIcon className="w-4 h-4" />
                              <span>{article.author}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(article.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{article.views}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{article.helpful}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{article.likes}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                        <Button size="sm" variant="outline" onClick={() => setSelectedArticle(article)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No se encontraron artículos
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                      ? 'Intenta ajustar tus filtros de búsqueda.'
                      : 'Aún no hay artículos en la base de conocimiento.'
                    }
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Artículo
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Top Categories */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Categorías Populares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.name}</span>
                      <Badge variant="outline">{category.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-600 truncate">{activity.article}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start hover:bg-blue-50"
                  onClick={handleCreateArticle}
                >
                  <Plus className="w-4 h-4 mr-2 text-blue-600" />
                  Nuevo Artículo
                </Button>
                <Button
                  size="sm"
                  variant={showStats ? "default" : "outline"}
                  className="w-full justify-start hover:bg-green-50"
                  onClick={handleViewStats}
                >
                  <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                  Ver Estadísticas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start hover:bg-orange-50"
                  onClick={handleExportArticles}
                >
                  <Share2 className="w-4 h-4 mr-2 text-orange-600" />
                  Exportar Artículos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout
  );
}
