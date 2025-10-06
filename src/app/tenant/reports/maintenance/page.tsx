'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Filter,
  RefreshCw,
  Wrench,
  Star,
  Clock,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';
import { logger } from '@/lib/logger';

interface MaintenanceRecord {
  id: string;
  requestDate: string;
  scheduledDate?: string;
  completionDate?: string;
  serviceType: string;
  provider: string;
  providerRating: number;
  amount: number;
  currency: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  issues: string[];
  solutions: string[];
  rating?: number;
  review?: string;
  propertyAddress: string;
}

interface MaintenanceStats {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  averageCost: number;
  averageRating: number;
  averageResponseTime: number;
  mostCommonService: string;
  topProvider: string;
  monthlyTrend: number;
}

export default function TenantMaintenanceReportsPage() {
  const { user } = useUserState();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<MaintenanceStats>({
    totalRequests: 0,
    completedRequests: 0,
    pendingRequests: 0,
    averageCost: 0,
    averageRating: 0,
    averageResponseTime: 0,
    mostCommonService: '',
    topProvider: '',
    monthlyTrend: 0,
  });
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  // Mock data for maintenance records
  const mockRecords: MaintenanceRecord[] = [
    {
      id: '1',
      requestDate: '2024-11-15',
      scheduledDate: '2024-11-18',
      completionDate: '2024-11-18',
      serviceType: 'Fontanería',
      provider: 'Fontanería Express',
      providerRating: 4.8,
      amount: 35000,
      currency: 'CLP',
      status: 'completed',
      priority: 'high',
      description: 'Fuga en grifería del baño principal',
      issues: ['Junta dañada', 'Presión irregular'],
      solutions: ['Reemplazo de junta', 'Regulación de presión'],
      rating: 5,
      review: 'Excelente servicio, muy puntuales y profesionales.',
      propertyAddress: 'Av. Providencia 123, Santiago',
    },
    {
      id: '2',
      requestDate: '2024-11-20',
      scheduledDate: '2024-11-25',
      completionDate: '2024-11-25',
      serviceType: 'Electricidad',
      provider: 'Servicios Eléctricos Ltda',
      providerRating: 4.9,
      amount: 45000,
      currency: 'CLP',
      status: 'completed',
      priority: 'medium',
      description: 'Revisión completa del sistema eléctrico',
      issues: ['Tomacorriente suelto', 'Interruptor defectuoso'],
      solutions: ['Fijación de tomacorriente', 'Reemplazo de interruptor'],
      rating: 4,
      review: 'Buen trabajo, aunque un poco más caro de lo esperado.',
      propertyAddress: 'Av. Providencia 123, Santiago',
    },
    {
      id: '3',
      requestDate: '2024-12-01',
      scheduledDate: '2024-12-05',
      status: 'scheduled',
      serviceType: 'Limpieza',
      provider: 'Limpieza Express',
      providerRating: 4.6,
      amount: 55000,
      currency: 'CLP',
      priority: 'low',
      description: 'Limpieza profunda del apartamento',
      issues: [],
      solutions: [],
      propertyAddress: 'Av. Providencia 123, Santiago',
    },
    {
      id: '4',
      requestDate: '2024-12-10',
      status: 'pending',
      serviceType: 'Jardinería',
      provider: 'Jardinería Verde',
      providerRating: 4.4,
      amount: 0,
      currency: 'CLP',
      priority: 'low',
      description: 'Mantenimiento de jardín pequeño',
      issues: [],
      solutions: [],
      propertyAddress: 'Av. Providencia 123, Santiago',
    },
    {
      id: '5',
      requestDate: '2024-10-15',
      scheduledDate: '2024-10-18',
      completionDate: '2024-10-18',
      serviceType: 'Cerrajería',
      provider: 'Cerrajería 24/7',
      providerRating: 4.7,
      amount: 28000,
      currency: 'CLP',
      status: 'completed',
      priority: 'urgent',
      description: 'Cambio de cerradura puerta principal',
      issues: ['Llave atorada'],
      solutions: ['Reemplazo completo de cerradura'],
      rating: 5,
      review: 'Emergencia resuelta en menos de 30 minutos. Excelente!',
      propertyAddress: 'Av. Providencia 123, Santiago',
    },
  ];

  useEffect(() => {
    loadMaintenanceReports();
  }, [dateRange, statusFilter, serviceFilter]);

  const loadMaintenanceReports = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Filter records based on criteria
      let filteredRecords = mockRecords.filter(
        record =>
          record.requestDate >= dateRange.startDate && record.requestDate <= dateRange.endDate
      );

      if (statusFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.status === statusFilter);
      }

      if (serviceFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.serviceType === serviceFilter);
      }

      setMaintenanceRecords(filteredRecords);

      // Calculate statistics
      const totalRequests = filteredRecords.length;
      const completedRequests = filteredRecords.filter(r => r.status === 'completed').length;
      const pendingRequests = filteredRecords.filter(r => r.status === 'pending').length;
      const averageCost = filteredRecords
        .filter(r => r.amount > 0)
        .reduce((sum, r, _, arr) => sum + r.amount / arr.length, 0);
      const averageRating = filteredRecords
        .filter(r => r.rating)
        .reduce((sum, r, _, arr) => sum + (r.rating || 0) / arr.length, 0);
      const averageResponseTime = 2.3; // Mock data

      // Most common service
      const serviceCount = filteredRecords.reduce(
        (acc, record) => {
          acc[record.serviceType] = (acc[record.serviceType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const mostCommonService =
        Object.entries(serviceCount).sort(([, a], [, b]) => b - a)[0]?.[0] || '';

      // Top provider
      const providerRatings = filteredRecords.reduce(
        (acc, record) => {
          if (!acc[record.provider]) {
            acc[record.provider] = { total: 0, count: 0 };
          }
          acc[record.provider].total += record.providerRating;
          acc[record.provider].count += 1;
          return acc;
        },
        {} as Record<string, { total: number; count: number }>
      );
      const topProvider =
        Object.entries(providerRatings)
          .map(([provider, data]) => ({ provider, average: data.total / data.count }))
          .sort((a, b) => b.average - a.average)[0]?.provider || '';

      setStats({
        totalRequests,
        completedRequests,
        pendingRequests,
        averageCost: Math.round(averageCost),
        averageRating: Math.round(averageRating * 10) / 10,
        averageResponseTime,
        mostCommonService,
        topProvider,
        monthlyTrend: 5.2,
      });
    } catch (error) {
      logger.error('Error al cargar reportes de mantenimiento', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      [
        'ID',
        'Fecha Solicitud',
        'Fecha Programada',
        'Fecha Completado',
        'Tipo Servicio',
        'Proveedor',
        'Monto',
        'Moneda',
        'Estado',
        'Prioridad',
        'Calificación',
        'Descripción',
      ],
      ...maintenanceRecords.map(record => [
        record.id,
        record.requestDate,
        record.scheduledDate || '',
        record.completionDate || '',
        record.serviceType,
        record.provider,
        record.amount.toString(),
        record.currency,
        record.status,
        record.priority,
        record.rating?.toString() || '',
        record.description,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `reporte-mantenimiento-inquilino-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Reporte de mantenimiento exportado', { totalRecords: maintenanceRecords.length });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'scheduled':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Programado
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            En Progreso
          </Badge>
        );
      case 'completed':
        return <Badge className="bg-green-500">Completado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Baja
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Media
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Alta
          </Badge>
        );
      case 'urgent':
        return <Badge variant="destructive">Urgente</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) {
      return <span className="text-gray-400">No calificado</span>;
    }

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const serviceTypes = [...new Set(mockRecords.map(r => r.serviceType))];

  const getMonthlyData = () => {
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
      const monthRecords = maintenanceRecords.filter(
        r =>
          new Date(r.requestDate).getMonth() === date.getMonth() &&
          new Date(r.requestDate).getFullYear() === date.getFullYear()
      ).length;
      monthly.push({ month: monthName, count: monthRecords });
    }
    return monthly;
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Mantenimiento</h1>
            <p className="text-gray-600">Análisis detallado de tus solicitudes de mantenimiento</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadMaintenanceReports} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={handleExportReport} disabled={maintenanceRecords.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="statusFilter">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="scheduled">Programado</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="serviceFilter">Tipo de Servicio</Label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {serviceTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="history">Historial Detallado</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                    </div>
                    <Wrench className="w-12 h-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completadas</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completedRequests}</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pendientes</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
                    </div>
                    <Clock className="w-12 h-12 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Costo Promedio</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(stats.averageCost)}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métricas Adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.averageRating}</p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Servicio Más Solicitado</p>
                      <p className="text-lg font-bold text-blue-600">{stats.mostCommonService}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Mejor Proveedor</p>
                      <p className="text-lg font-bold text-green-600 truncate">
                        {stats.topProvider}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Solicitudes Mensuales */}
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes por Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getMonthlyData().map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(month.count / Math.max(...getMonthlyData().map(m => m.count))) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-semibold w-8 text-right">{month.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribución por Estado */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm">Completadas</span>
                    </div>
                    <span className="font-semibold">{stats.completedRequests}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm">Programadas</span>
                    </div>
                    <span className="font-semibold">
                      {maintenanceRecords.filter(r => r.status === 'scheduled').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-sm">Pendientes</span>
                    </div>
                    <span className="font-semibold">{stats.pendingRequests}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span className="text-sm">En Progreso</span>
                    </div>
                    <span className="font-semibold">
                      {maintenanceRecords.filter(r => r.status === 'in_progress').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rendimiento por Proveedor */}
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento por Proveedor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(
                      maintenanceRecords.reduce(
                        (acc, record) => {
                          if (!acc[record.provider]) {
                            acc[record.provider] = {
                              total: 0,
                              completed: 0,
                              rating: 0,
                              count: 0,
                            };
                          }
                          acc[record.provider].total += 1;
                          if (record.status === 'completed') {
                            acc[record.provider].completed += 1;
                          }
                          if (record.rating) {
                            acc[record.provider].rating += record.rating;
                            acc[record.provider].count += 1;
                          }
                          return acc;
                        },
                        {} as Record<
                          string,
                          { total: number; completed: number; rating: number; count: number }
                        >
                      )
                    ).map(([provider, data]) => {
                      const completionRate =
                        data.total > 0 ? (data.completed / data.total) * 100 : 0;
                      const averageRating = data.count > 0 ? data.rating / data.count : 0;

                      return (
                        <div key={provider} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{provider}</h4>
                              <p className="text-sm text-gray-600">
                                {data.completed}/{data.total} completados
                              </p>
                            </div>
                            {getRatingStars(averageRating)}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Tasa de completación</span>
                              <span className="font-semibold">{completionRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${completionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Costos por Tipo de Servicio */}
              <Card>
                <CardHeader>
                  <CardTitle>Costos por Tipo de Servicio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(
                      maintenanceRecords
                        .filter(r => r.amount > 0)
                        .reduce(
                          (acc, record) => {
                            if (!acc[record.serviceType]) {
                              acc[record.serviceType] = { total: 0, count: 0 };
                            }
                            acc[record.serviceType].total += record.amount;
                            acc[record.serviceType].count += 1;
                            return acc;
                          },
                          {} as Record<string, { total: number; count: number }>
                        )
                    ).map(([serviceType, data]) => {
                      const averageCost = data.count > 0 ? data.total / data.count : 0;

                      return (
                        <div
                          key={serviceType}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <span className="font-medium">{serviceType}</span>
                            <p className="text-sm text-gray-600">{data.count} servicios</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(averageCost)}</p>
                            <p className="text-xs text-gray-500">promedio</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reseñas y Comentarios */}
            <Card>
              <CardHeader>
                <CardTitle>Reseñas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenanceRecords
                    .filter(r => r.review)
                    .slice(0, 5)
                    .map(record => (
                      <div key={record.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{record.provider}</p>
                            <p className="text-sm text-gray-600">{record.serviceType}</p>
                          </div>
                          <div className="text-right">
                            {getRatingStars(record.rating)}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(
                                record.completionDate || record.requestDate
                              ).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700 italic">&quot;{record.review}&quot;</p>
                      </div>
                    ))}
                  {maintenanceRecords.filter(r => r.review).length === 0 && (
                    <div className="text-center py-8 text-gray-500">No hay reseñas disponibles</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial Completo de Mantenimiento</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Cargando registros...
                  </div>
                ) : maintenanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay registros de mantenimiento en el período seleccionado
                  </div>
                ) : (
                  <div className="space-y-6">
                    {maintenanceRecords.map(record => (
                      <div key={record.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{record.serviceType}</h3>
                              {getPriorityBadge(record.priority)}
                              {getStatusBadge(record.status)}
                            </div>
                            <p className="text-gray-700 mb-3">{record.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Wrench className="w-4 h-4" />
                                {record.provider}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Solicitado:{' '}
                                {new Date(record.requestDate).toLocaleDateString('es-CL')}
                              </span>
                              {record.scheduledDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Programado:{' '}
                                  {new Date(record.scheduledDate).toLocaleDateString('es-CL')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(record.amount)}
                            </p>
                            {record.rating && (
                              <div className="mt-2">{getRatingStars(record.rating)}</div>
                            )}
                          </div>
                        </div>

                        {record.issues.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                              Problemas Encontrados
                            </h4>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {record.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {record.solutions.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Soluciones Implementadas
                            </h4>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {record.solutions.map((solution, index) => (
                                <li key={index}>{solution}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {record.review && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium mb-2">Reseña del Servicio</h4>
                            <p className="text-gray-700 italic">&quot;{record.review}&quot;</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
