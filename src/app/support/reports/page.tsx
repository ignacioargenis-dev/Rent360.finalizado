'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Ticket,
  Star,
  Target,
  Activity,
  FileText,
  RefreshCw,
  Settings, 
  Eye, 
  Share2,
  Plus
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface Report {
  id: string;
  title: string;
  type: 'tickets' | 'users' | 'performance' | 'satisfaction' | 'activity';
  description: string;
  dateRange: string;
  generatedAt: string;
  status: 'completed' | 'generating' | 'failed';
  fileSize?: string;
  downloadUrl?: string;
  author: string;
  data: {
    totalItems: number;
    percentageChange: number;
    topMetrics: { name: string; value: number; change: number }[];
  };
}

interface ReportStats {
  totalReports: number;
  reportsThisMonth: number;
  averageGenerationTime: number;
  successRate: number;
  popularTypes: { type: string; count: number }[];
  recentActivity: { action: string; report: string; time: string }[];
}

export default function SupportReportsPage() {
  const { user, loading: userLoading } = useUserState();

  const [reports, setReports] = useState<Report[]>([]);

  const [stats, setStats] = useState<ReportStats | null>(null);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      const mockReports: Report[] = [
        {
          id: '1',
          title: 'Reporte de Tickets - Marzo 2024',
          type: 'tickets',
          description: 'Análisis completo de tickets de soporte del mes de marzo',
          dateRange: '2024-03-01 al 2024-03-31',
          generatedAt: '2024-04-01',
          status: 'completed',
          fileSize: '2.4 MB',
          downloadUrl: '#',
          author: 'Ana Silva',
          data: {
            totalItems: 156,
            percentageChange: 12,
            topMetrics: [
              { name: 'Resueltos', value: 142, change: 8 },
              { name: 'Pendientes', value: 14, change: -5 },
              { name: 'Tiempo Promedio', value: 2.5, change: -15 },
            ],
          },
        },
        {
          id: '2',
          title: 'Satisfacción de Usuarios Q1 2024',
          type: 'satisfaction',
          description: 'Reporte de satisfacción y feedback de usuarios',
          dateRange: '2024-01-01 al 2024-03-31',
          generatedAt: '2024-04-02',
          status: 'completed',
          fileSize: '1.8 MB',
          downloadUrl: '#',
          author: 'Carlos Ramírez',
          data: {
            totalItems: 4.2,
            percentageChange: 5,
            topMetrics: [
              { name: 'Satisfacción', value: 4.2, change: 5 },
              { name: 'Respuestas', value: 89, change: 12 },
              { name: 'Recomendación', value: 78, change: 8 },
            ],
          },
        },
        {
          id: '3',
          title: 'Actividad del Sistema - Semana 13',
          type: 'activity',
          description: 'Reporte semanal de actividad y rendimiento del sistema',
          dateRange: '2024-03-25 al 2024-03-31',
          generatedAt: '2024-04-01',
          status: 'generating',
          author: 'Sistema Automático',
          data: {
            totalItems: 0,
            percentageChange: 0,
            topMetrics: [],
          },
        },
        {
          id: '4',
          title: 'Rendimiento del Equipo de Soporte',
          type: 'performance',
          description: 'Análisis de rendimiento y métricas del equipo de soporte',
          dateRange: '2024-03-01 al 2024-03-31',
          generatedAt: '2024-03-29',
          status: 'completed',
          fileSize: '3.1 MB',
          downloadUrl: '#',
          author: 'María González',
          data: {
            totalItems: 8,
            percentageChange: 15,
            topMetrics: [
              { name: 'Eficiencia', value: 87, change: 15 },
              { name: 'Resolución', value: 94, change: 8 },
              { name: 'Satisfacción', value: 4.1, change: 3 },
            ],
          },
        },
        {
          id: '5',
          title: 'Análisis de Usuarios Activos',
          type: 'users',
          description: 'Reporte demográfico y de actividad de usuarios',
          dateRange: '2024-02-01 al 2024-03-31',
          generatedAt: '2024-03-28',
          status: 'completed',
          fileSize: '4.2 MB',
          downloadUrl: '#',
          author: 'Soporte Rent360',
          data: {
            totalItems: 2847,
            percentageChange: 23,
            topMetrics: [
              { name: 'Activos', value: 2847, change: 23 },
              { name: 'Nuevos', value: 342, change: 18 },
              { name: 'Retención', value: 89, change: 5 },
            ],
          },
        },
      ];

      setReports(mockReports);
      
      // Calculate stats
      const totalReports = mockReports.length;
      const reportsThisMonth = mockReports.filter(r => new Date(r.generatedAt).getMonth() === new Date().getMonth()).length;
      const averageGenerationTime = 3.5; // minutes
      const successRate = (mockReports.filter(r => r.status === 'completed').length / totalReports) * 100;
      
      const types = mockReports.reduce((acc, report) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const popularTypes = Object.entries(types)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalReports,
        reportsThisMonth,
        averageGenerationTime,
        successRate: Math.round(successRate),
        popularTypes,
        recentActivity: [
          { action: 'Generado', report: 'Reporte de Tickets - Marzo 2024', time: 'Hace 2 horas' },
          { action: 'Descargado', report: 'Satisfacción de Usuarios Q1 2024', time: 'Hace 5 horas' },
          { action: 'En progreso', report: 'Actividad del Sistema - Semana 13', time: 'Hace 1 día' },
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
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'generating':
        return <Badge className="bg-yellow-100 text-yellow-800">Generando</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Fallido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tickets':
        return <Ticket className="w-5 h-5" />;
      case 'users':
        return <Users className="w-5 h-5" />;
      case 'performance':
        return <Target className="w-5 h-5" />;
      case 'satisfaction':
        return <Star className="w-5 h-5" />;
      case 'activity':
        return <Activity className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'tickets': return 'Tickets';
      case 'users': return 'Usuarios';
      case 'performance': return 'Rendimiento';
      case 'satisfaction': return 'Satisfacción';
      case 'activity': return 'Actividad';
      default: return type;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Reportes de Soporte" subtitle="Análisis y estadísticas del equipo de soporte">
      <DashboardHeader 
        user={user}
        title="Reportes y Análisis"
        subtitle="Genera y gestiona reportes del sistema"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Reportes</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats?.totalReports || 0}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {stats?.reportsThisMonth || 0} este mes
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Tasa de Éxito</p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats?.successRate || 0}%
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Generación exitosa
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Tiempo Promedio</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats?.averageGenerationTime || 0}min
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Por generación
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">En Progreso</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {reports.filter(r => r.status === 'generating').length}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Generando ahora
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-orange-700" />
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
                        placeholder="Buscar reportes..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="all">Todos los tipos</option>
                      <option value="tickets">Tickets</option>
                      <option value="users">Usuarios</option>
                      <option value="performance">Rendimiento</option>
                      <option value="satisfaction">Satisfacción</option>
                      <option value="activity">Actividad</option>
                    </select>
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Todos los estados</option>
                      <option value="completed">Completados</option>
                      <option value="generating">Generando</option>
                      <option value="failed">Fallidos</option>
                    </select>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Reporte
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getTypeIcon(report.type)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {report.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {getTypeDisplayName(report.type)} • {report.author}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(report.status)}
                        </div>

                        <p className="text-gray-600 mb-3">
                          {report.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Período</p>
                            <p className="font-medium text-gray-900">{report.dateRange}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Generado</p>
                            <p className="font-medium text-gray-900">{formatDate(report.generatedAt)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Tamaño</p>
                            <p className="font-medium text-gray-900">{report.fileSize || 'N/A'}</p>
                          </div>
                        </div>

                        {report.status === 'completed' && report.data.topMetrics.length > 0 && (
                          <div className="border-t pt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Métricas principales:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {report.data.topMetrics.map((metric, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm text-gray-600">{metric.name}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium">{metric.value}</span>
                                    {metric.change > 0 ? (
                                      <TrendingUp className="w-3 h-3 text-green-500" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3 text-red-500" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          Vista Previa
                        </Button>
                        {report.status === 'completed' && (
                          <Button size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Descargar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredReports.length === 0 && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No se encontraron reportes
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                      ? 'Intenta ajustar tus filtros de búsqueda.'
                      : 'Aún no hay reportes generados.'
                    }
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Generar Primer Reporte
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Popular Types */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Tipos Populares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.popularTypes.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm font-medium">{getTypeDisplayName(item.type)}</span>
                      </div>
                      <Badge variant="outline">{item.count}</Badge>
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
                        <p className="text-xs text-gray-600 truncate">{activity.report}</p>
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
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Reporte
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar Datos
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar Reportes
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir Reporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout
  );
}
