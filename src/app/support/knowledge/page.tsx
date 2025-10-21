'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HelpCircle,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  FileText,
  Video,
  Image,
  Download,
  Star,
  StarOff,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Tag,
  Calendar,
  User,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: 'general' | 'billing' | 'technical' | 'account' | 'troubleshooting';
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  helpful: number;
  notHelpful: number;
  isPublished: boolean;
  isFeatured: boolean;
  attachments?: Attachment[];
  relatedArticles?: string[];
}

interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'document';
  size: number;
  url: string;
}

interface KnowledgeStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  featuredArticles: number;
  totalViews: number;
  averageRating: number;
}

export default function SupportKnowledgePage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [stats, setStats] = useState<KnowledgeStats>({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    featuredArticles: 0,
    totalViews: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'general' as const,
    tags: [] as string[],
    isPublished: false,
    isFeatured: false,
  });

  useEffect(() => {
    loadKnowledgeData();
  }, []);

  const loadKnowledgeData = async () => {
    try {
      setLoading(true);

      // Simular carga de datos de base de conocimiento
      const mockArticles: KnowledgeArticle[] = [
        {
          id: '1',
          title: 'Cómo crear una cuenta en Rent360',
          content: `
# Cómo crear una cuenta en Rent360

## Pasos para registrarse

1. **Visita la página de registro**
   - Ve a rent360.cl/registro
   - Haz clic en "Crear cuenta"

2. **Completa el formulario**
   - Ingresa tu nombre completo
   - Proporciona un email válido
   - Crea una contraseña segura
   - Selecciona tu tipo de usuario (Propietario, Inquilino, Corredor)

3. **Verifica tu email**
   - Revisa tu bandeja de entrada
   - Haz clic en el enlace de verificación

4. **Completa tu perfil**
   - Sube una foto de perfil
   - Completa la información adicional
   - Verifica tu identidad si es necesario

## Requisitos

- Email válido
- Contraseña de al menos 8 caracteres
- Documento de identidad (para verificación)

## Problemas comunes

**No recibo el email de verificación**
- Revisa tu carpeta de spam
- Espera unos minutos
- Contacta soporte si persiste el problema

**Error al crear contraseña**
- Asegúrate de usar al menos 8 caracteres
- Incluye mayúsculas, minúsculas y números
- Evita contraseñas comunes
          `,
          summary:
            'Guía paso a paso para crear una cuenta en Rent360, incluyendo verificación de email y completar perfil.',
          category: 'account',
          tags: ['registro', 'cuenta', 'verificación', 'perfil'],
          author: 'Equipo Rent360',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-15T14:30:00Z',
          views: 1250,
          helpful: 89,
          notHelpful: 12,
          isPublished: true,
          isFeatured: true,
          relatedArticles: ['2', '3'],
        },
        {
          id: '2',
          title: 'Cómo buscar propiedades',
          content: `
# Cómo buscar propiedades en Rent360

## Filtros de búsqueda

### Ubicación
- Ciudad
- Comuna
- Región
- Radio de búsqueda

### Características
- Número de dormitorios
- Número de baños
- Área mínima
- Tipo de propiedad

### Precio
- Rango de precio mensual
- Incluye gastos comunes
- Depósito requerido

## Consejos de búsqueda

1. **Usa filtros específicos** para encontrar exactamente lo que buscas
2. **Guarda búsquedas** para recibir notificaciones de nuevas propiedades
3. **Revisa las fotos** y descripción detallada
4. **Contacta al propietario** para más información

## Funciones avanzadas

- **Búsqueda por mapa**: Visualiza propiedades en el mapa
- **Tour virtual**: Explora propiedades con recorrido 360°
- **Favoritos**: Guarda propiedades de interés
- **Comparar**: Compara hasta 3 propiedades
          `,
          summary:
            'Guía completa para buscar propiedades usando filtros, mapas y funciones avanzadas.',
          category: 'general',
          tags: ['búsqueda', 'filtros', 'propiedades', 'mapa'],
          author: 'Equipo Rent360',
          createdAt: '2024-01-12T10:30:00Z',
          updatedAt: '2024-01-14T16:45:00Z',
          views: 980,
          helpful: 76,
          notHelpful: 8,
          isPublished: true,
          isFeatured: false,
          relatedArticles: ['1', '4'],
        },
        {
          id: '3',
          title: 'Problemas de pago - Solución de errores',
          content: `
# Solución de problemas de pago

## Errores comunes y soluciones

### Error: "Tarjeta rechazada"
**Posibles causas:**
- Fondos insuficientes
- Tarjeta bloqueada
- Datos incorrectos
- Límite de transacción

**Soluciones:**
1. Verifica el saldo de tu cuenta
2. Contacta a tu banco
3. Revisa los datos ingresados
4. Intenta con otra tarjeta

### Error: "Transacción expirada"
**Causa:** El tiempo límite de la transacción se agotó

**Solución:**
- Intenta el pago nuevamente
- Asegúrate de tener buena conexión a internet
- Completa el proceso rápidamente

### Error: "Método de pago no disponible"
**Causa:** El método de pago no está habilitado

**Soluciones:**
- Usa otro método de pago
- Contacta soporte para habilitar el método
- Verifica que tu cuenta esté verificada

## Métodos de pago aceptados

- Tarjetas de crédito (Visa, Mastercard, American Express)
- Tarjetas de débito
- Transferencia bancaria
- Khipu (Chile)
- PayPal

## Contacto de soporte

Si persisten los problemas, contacta a soporte:
- Email: soporte@rent360.cl
- Teléfono: +56 2 2345 6789
- Chat en vivo: Disponible 24/7
          `,
          summary: 'Guía para resolver problemas comunes de pago y métodos de pago aceptados.',
          category: 'billing',
          tags: ['pago', 'errores', 'tarjeta', 'transferencia'],
          author: 'Equipo Rent360',
          createdAt: '2024-01-08T14:20:00Z',
          updatedAt: '2024-01-16T11:15:00Z',
          views: 750,
          helpful: 65,
          notHelpful: 15,
          isPublished: true,
          isFeatured: true,
          relatedArticles: ['1'],
        },
        {
          id: '4',
          title: 'Cómo contactar al propietario',
          content: `
# Cómo contactar al propietario

## Métodos de contacto

### 1. Mensajería interna
- Ve a la página de la propiedad
- Haz clic en "Contactar propietario"
- Escribe tu mensaje
- Recibe notificaciones de respuesta

### 2. Llamada telefónica
- El número aparece en el perfil del propietario
- Disponible si el propietario lo permite
- Horarios de atención pueden variar

### 3. Email directo
- Envía un email desde la plataforma
- Mantén la conversación organizada
- Recibe copias en tu email

## Consejos para el contacto

### Sé claro y específico
- Menciona la propiedad de interés
- Incluye tus fechas de mudanza
- Especifica tu presupuesto
- Menciona el número de personas

### Preguntas importantes
- Disponibilidad de la propiedad
- Condiciones del contrato
- Gastos adicionales
- Proceso de aplicación
- Documentos requeridos

### Mantén la profesionalidad
- Usa un tono respetuoso
- Responde rápidamente
- Sé honesto sobre tu situación
- Mantén la comunicación clara

## Seguimiento

- Revisa regularmente tus mensajes
- Responde a las preguntas del propietario
- Programa visitas cuando sea posible
- Mantén un registro de las conversaciones
          `,
          summary: 'Guía para contactar propietarios de manera efectiva y profesional.',
          category: 'general',
          tags: ['contacto', 'propietario', 'mensajería', 'comunicación'],
          author: 'Equipo Rent360',
          createdAt: '2024-01-14T16:00:00Z',
          updatedAt: '2024-01-15T09:30:00Z',
          views: 650,
          helpful: 52,
          notHelpful: 5,
          isPublished: true,
          isFeatured: false,
          relatedArticles: ['2'],
        },
      ];

      setArticles(mockArticles);

      // Calcular estadísticas
      const totalArticles = mockArticles.length;
      const publishedArticles = mockArticles.filter(a => a.isPublished).length;
      const draftArticles = mockArticles.filter(a => !a.isPublished).length;
      const featuredArticles = mockArticles.filter(a => a.isFeatured).length;
      const totalViews = mockArticles.reduce((sum, a) => sum + a.views, 0);
      const averageRating =
        mockArticles.length > 0
          ? mockArticles.reduce((sum, a) => sum + a.helpful / (a.helpful + a.notHelpful), 0) /
            mockArticles.length
          : 0;

      setStats({
        totalArticles,
        publishedArticles,
        draftArticles,
        featuredArticles,
        totalViews,
        averageRating,
      });

      logger.debug('Datos de base de conocimiento cargados', {
        totalArticles,
        publishedArticles,
        draftArticles,
        featuredArticles,
      });
    } catch (error) {
      logger.error('Error cargando datos de base de conocimiento:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async () => {
    try {
      const newArticleData: KnowledgeArticle = {
        id: Date.now().toString(),
        title: newArticle.title,
        content: newArticle.content,
        summary: newArticle.summary,
        category: newArticle.category,
        tags: newArticle.tags,
        author: user?.name || 'Usuario',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0,
        helpful: 0,
        notHelpful: 0,
        isPublished: newArticle.isPublished,
        isFeatured: newArticle.isFeatured,
      };

      setArticles(prev => [newArticleData, ...prev]);
      setShowCreateForm(false);
      setNewArticle({
        title: '',
        content: '',
        summary: '',
        category: 'general',
        tags: [],
        isPublished: false,
        isFeatured: false,
      });

      logger.info('Artículo de conocimiento creado', {
        title: newArticle.title,
        category: newArticle.category,
        isPublished: newArticle.isPublished,
      });
    } catch (error) {
      logger.error('Error creando artículo:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleViewArticle = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    // Incrementar vistas
    setArticles(prev => prev.map(a => (a.id === article.id ? { ...a, views: a.views + 1 } : a)));
    logger.info('Artículo visualizado', { articleId: article.id, title: article.title });
  };

  const handleRateArticle = (articleId: string, helpful: boolean) => {
    setArticles(prev =>
      prev.map(article =>
        article.id === articleId
          ? {
              ...article,
              helpful: helpful ? article.helpful + 1 : article.helpful,
              notHelpful: !helpful ? article.notHelpful + 1 : article.notHelpful,
            }
          : article
      )
    );
    logger.info('Artículo calificado', { articleId, helpful });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      general: { label: 'General', color: 'bg-blue-100 text-blue-800' },
      billing: { label: 'Facturación', color: 'bg-green-100 text-green-800' },
      technical: { label: 'Técnico', color: 'bg-purple-100 text-purple-800' },
      account: { label: 'Cuenta', color: 'bg-orange-100 text-orange-800' },
      troubleshooting: { label: 'Solución', color: 'bg-red-100 text-red-800' },
    };

    const config =
      categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.general;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || article.category === filterCategory;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && article.isPublished) ||
      (filterStatus === 'draft' && !article.isPublished) ||
      (filterStatus === 'featured' && article.isFeatured);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const groupedArticles = filteredArticles.reduce(
    (acc, article) => {
      if (!acc[article.category]) {
        acc[article.category] = [];
      }
      acc[article.category]!.push(article);
      return acc;
    },
    {} as Record<string, KnowledgeArticle[]>
  );

  if (loading) {
    return (
      <UnifiedDashboardLayout
        user={user}
        title="Base de Conocimiento"
        subtitle="Preguntas frecuentes y guías"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando base de conocimiento...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Base de Conocimiento"
      subtitle="Preguntas frecuentes y guías"
    >
      <div className="h-full flex flex-col p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Artículos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalArticles}</div>
              <p className="text-xs text-muted-foreground">En la base</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publicados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publishedArticles}</div>
              <p className="text-xs text-muted-foreground">Disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Borradores</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draftArticles}</div>
              <p className="text-xs text-muted-foreground">En edición</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Destacados</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.featuredArticles}</div>
              <p className="text-xs text-muted-foreground">Prioritarios</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vistas</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Consultas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.averageRating * 100).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Útiles</p>
            </CardContent>
          </Card>
        </div>

        {/* Create Article Form */}
        {showCreateForm && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Plus className="w-5 h-5" />
                Crear Nuevo Artículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={newArticle.title}
                  onChange={e => setNewArticle({ ...newArticle, title: e.target.value })}
                  placeholder="Título del artículo"
                />
              </div>

              <div>
                <Label htmlFor="summary">Resumen *</Label>
                <Textarea
                  id="summary"
                  value={newArticle.summary}
                  onChange={e => setNewArticle({ ...newArticle, summary: e.target.value })}
                  placeholder="Resumen breve del artículo"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="content">Contenido *</Label>
                <Textarea
                  id="content"
                  value={newArticle.content}
                  onChange={e => setNewArticle({ ...newArticle, content: e.target.value })}
                  placeholder="Contenido completo del artículo (soporta Markdown)"
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={newArticle.category}
                    onValueChange={(value: any) =>
                      setNewArticle({ ...newArticle, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="billing">Facturación</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="account">Cuenta</SelectItem>
                      <SelectItem value="troubleshooting">Solución</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (separados por comas)</Label>
                  <Input
                    id="tags"
                    value={newArticle.tags.join(', ')}
                    onChange={e =>
                      setNewArticle({
                        ...newArticle,
                        tags: e.target.value
                          .split(',')
                          .map(tag => tag.trim())
                          .filter(tag => tag),
                      })
                    }
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateArticle}
                  disabled={!newArticle.title || !newArticle.content || !newArticle.summary}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Artículo
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Actions */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar artículos por título, contenido o tags..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="billing">Facturación</SelectItem>
              <SelectItem value="technical">Técnico</SelectItem>
              <SelectItem value="account">Cuenta</SelectItem>
              <SelectItem value="troubleshooting">Solución</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="featured">Destacados</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Artículo
          </Button>
        </div>

        {/* Articles List */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Base de Conocimiento ({filteredArticles.length})</CardTitle>
              <CardDescription>Artículos organizados por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedArticles).map(([category, categoryArticles]) => (
                  <div key={category}>
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedCategories);
                        if (newExpanded.has(category)) {
                          newExpanded.delete(category);
                        } else {
                          newExpanded.add(category);
                        }
                        setExpandedCategories(newExpanded);
                      }}
                      className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4 hover:text-blue-600"
                    >
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                      {getCategoryBadge(category)}
                      <span className="ml-2">({categoryArticles.length} artículos)</span>
                    </button>

                    {expandedCategories.has(category) && (
                      <div className="space-y-4 ml-6">
                        {categoryArticles.map(article => (
                          <div
                            key={article.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{article.title}</h3>
                                  {article.isFeatured && (
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  )}
                                  {!article.isPublished && (
                                    <Badge variant="outline">Borrador</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{article.summary}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>👁️ {article.views} vistas</span>
                                  <span>👍 {article.helpful} útiles</span>
                                  <span>👎 {article.notHelpful} no útiles</span>
                                  <span>📅 {formatDateTime(article.updatedAt)}</span>
                                </div>
                                <div className="flex gap-1 mt-2">
                                  {article.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewArticle(article)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRateArticle(article.id, true)}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRateArticle(article.id, false)}
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {filteredArticles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <HelpCircle className="w-12 h-12 mx-auto mb-4" />
                    <p>No hay artículos que coincidan con los filtros.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Article Viewer Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedArticle.title}
                      {selectedArticle.isFeatured && (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">{selectedArticle.summary}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedArticle(null)}>
                    Cerrar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {selectedArticle.content}
                  </pre>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleRateArticle(selectedArticle.id, true)}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Útil ({selectedArticle.helpful})
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRateArticle(selectedArticle.id, false)}
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        No útil ({selectedArticle.notHelpful})
                      </Button>
                    </div>
                    <div className="text-sm text-gray-500">
                      Por {selectedArticle.author} • {formatDateTime(selectedArticle.updatedAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
