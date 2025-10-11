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
  Users,
  Star,
  TrendingUp,
  Award,
  BarChart3,
  DollarSign,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

interface ProviderSummary {
  totalProviders: number;
  activeProviders: number;
  topRatedProviders: number;
  totalJobsCompleted: number;
  averageRating: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

interface ProviderRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  rating: number;
  totalJobs: number;
  completedJobs: number;
  totalEarnings: number;
  averageResponseTime: number;
  joinDate: string;
  lastActive: string;
  specialties: string[];
  location: string;
}

export default function ProvidersReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<ProviderSummary>({
    totalProviders: 0,
    activeProviders: 0,
    topRatedProviders: 0,
    totalJobsCompleted: 0,
    averageRating: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
  });
  const [providers, setProviders] = useState<ProviderRecord[]>([]);

  // Mock data for providers
  const mockProviders: ProviderRecord[] = [
    {
      id: '1',
      name: 'Servicios Eléctricos Ltda',
      email: 'contacto@electricos.cl',
      phone: '+56912345678',
      serviceType: 'Electricidad',
      status: 'active',
      rating: 4.8,
      totalJobs: 245,
      completedJobs: 238,
      totalEarnings: 8500000,
      averageResponseTime: 2.3,
      joinDate: '2023-01-15',
      lastActive: '2024-12-05',
      specialties: ['Instalaciones', 'Reparaciones', 'Mantenimiento'],
      location: 'Santiago Centro',
    },
    {
      id: '2',
      name: 'Fontanería Express',
      email: 'info@fontaneria.cl',
      phone: '+56987654321',
      serviceType: 'Fontanería',
      status: 'active',
      rating: 4.6,
      totalJobs: 189,
      completedJobs: 182,
      totalEarnings: 6200000,
      averageResponseTime: 1.8,
      joinDate: '2023-03-20',
      lastActive: '2024-12-05',
      specialties: ['Reparaciones', 'Instalaciones', 'Emergencias'],
      location: 'Providencia',
    },
    {
      id: '3',
      name: 'Mantenimiento General SPA',
      email: 'admin@mantenimiento.cl',
      phone: '+56955556666',
      serviceType: 'Mantenimiento',
      status: 'active',
      rating: 4.9,
      totalJobs: 156,
      completedJobs: 154,
      totalEarnings: 4800000,
      averageResponseTime: 3.1,
      joinDate: '2023-05-10',
      lastActive: '2024-12-04',
      specialties: ['Limpieza', 'Reparaciones menores', 'Mantenimiento preventivo'],
      location: 'Las Condes',
    },
    {
      id: '4',
      name: 'Pintura Profesional',
      email: 'contacto@pinturapro.cl',
      phone: '+56944445555',
      serviceType: 'Pintura',
      status: 'active',
      rating: 4.7,
      totalJobs: 98,
      completedJobs: 95,
      totalEarnings: 3800000,
      averageResponseTime: 4.2,
      joinDate: '2023-07-08',
      lastActive: '2024-12-03',
      specialties: ['Pintura interior', 'Pintura exterior', 'Acabados'],
      location: 'Ñuñoa',
    },
    {
      id: '5',
      name: 'Jardinería Verde',
      email: 'info@jardineria.cl',
      phone: '+56933334444',
      serviceType: 'Jardinería',
      status: 'inactive',
      rating: 4.2,
      totalJobs: 67,
      completedJobs: 64,
      totalEarnings: 2100000,
      averageResponseTime: 6.5,
      joinDate: '2023-09-15',
      lastActive: '2024-11-20',
      specialties: ['Mantenimiento', 'Diseño', 'Riego'],
      location: 'Vitacura',
    },
  ];

  useEffect(() => {
    loadProvidersData();
  }, [dateRange, serviceTypeFilter, statusFilter, ratingFilter]);

  const loadProvidersData = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Filter providers based on criteria
      let filteredProviders = mockProviders;

      if (serviceTypeFilter !== 'all') {
        filteredProviders = filteredProviders.filter(p =>
          p.serviceType.toLowerCase().includes(serviceTypeFilter.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filteredProviders = filteredProviders.filter(p => p.status === statusFilter);
      }

      if (ratingFilter !== 'all') {
        const minRating = parseFloat(ratingFilter);
        filteredProviders = filteredProviders.filter(p => p.rating >= minRating);
      }

      setProviders(filteredProviders);

      // Calculate summary
      const totalProviders = filteredProviders.length;
      const activeProviders = filteredProviders.filter(p => p.status === 'active').length;
      const topRatedProviders = filteredProviders.filter(p => p.rating >= 4.5).length;
      const totalJobsCompleted = filteredProviders.reduce((sum, p) => sum + p.completedJobs, 0);
      const totalRevenue = filteredProviders.reduce((sum, p) => sum + p.totalEarnings, 0);
      const averageRating =
        filteredProviders.length > 0
          ? filteredProviders.reduce((sum, p) => sum + p.rating, 0) / filteredProviders.length
          : 0;

      setSummary({
        totalProviders,
        activeProviders,
        topRatedProviders,
        totalJobsCompleted,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRevenue,
        monthlyGrowth: 12.8, // Mock growth percentage
      });
    } catch (error) {
      logger.error('Error al cargar datos de proveedores', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      [
        'ID',
        'Nombre',
        'Email',
        'Teléfono',
        'Tipo Servicio',
        'Estado',
        'Calificación',
        'Trabajos Totales',
        'Trabajos Completados',
        'Ganancias Totales',
        'Tiempo Respuesta Promedio',
        'Fecha Registro',
        'Última Actividad',
        'Especialidades',
        'Ubicación',
      ],
      ...providers.map(provider => [
        provider.id,
        provider.name,
        provider.email,
        provider.phone,
        provider.serviceType,
        provider.status === 'active'
          ? 'Activo'
          : provider.status === 'inactive'
            ? 'Inactivo'
            : provider.status === 'suspended'
              ? 'Suspendido'
              : 'Pendiente',
        provider.rating.toString(),
        provider.totalJobs.toString(),
        provider.completedJobs.toString(),
        provider.totalEarnings.toLocaleString(),
        `${provider.averageResponseTime} horas`,
        provider.joinDate,
        provider.lastActive,
        provider.specialties.join('; '),
        provider.location,
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
      `reporte-proveedores-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Reporte de proveedores exportado', { totalRecords: providers.length });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspendido</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
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

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Proveedores</h1>
            <p className="text-gray-600">
              Análisis completo del rendimiento de proveedores de servicios
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadProvidersData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={handleExportReport} disabled={providers.length === 0}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Label htmlFor="serviceTypeFilter">Tipo de Servicio</Label>
                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Electricidad">Electricidad</SelectItem>
                    <SelectItem value="Fontanería">Fontanería</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Pintura">Pintura</SelectItem>
                    <SelectItem value="Jardinería">Jardinería</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ratingFilter">Calificación Mínima</Label>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                    <SelectItem value="4.0">4.0+ estrellas</SelectItem>
                    <SelectItem value="3.5">3.5+ estrellas</SelectItem>
                    <SelectItem value="3.0">3.0+ estrellas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="statusFilter">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="suspended">Suspendidos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="details">Detalles de Proveedores</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.totalProviders}</p>
                    </div>
                    <Users className="w-12 h-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Proveedores Activos</p>
                      <p className="text-2xl font-bold text-green-600">{summary.activeProviders}</p>
                    </div>
                    <Award className="w-12 h-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                      <p className="text-2xl font-bold text-yellow-600">{summary.averageRating}</p>
                    </div>
                    <Star className="w-12 h-12 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Trabajos Completados</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {summary.totalJobsCompleted}
                      </p>
                    </div>
                    <BarChart3 className="w-12 h-12 text-purple-600" />
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
                      <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(summary.totalRevenue)}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Proveedores Top</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {summary.topRatedProviders}
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Crecimiento Mensual</p>
                      <p className="text-2xl font-bold text-blue-600">+{summary.monthlyGrowth}%</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Proveedores por Ingresos */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Proveedores por Ingresos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {providers
                      .sort((a, b) => b.totalEarnings - a.totalEarnings)
                      .slice(0, 5)
                      .map((provider, index) => (
                        <div key={provider.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-semibold text-green-600">
                              {index + 1}
                            </div>
                            <div>
                              <span className="text-sm font-medium">{provider.name}</span>
                              <p className="text-xs text-gray-500">{provider.serviceType}</p>
                            </div>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(provider.totalEarnings)}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Proveedores por Calificación */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Proveedores por Calificación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {providers
                      .sort((a, b) => b.rating - a.rating)
                      .slice(0, 5)
                      .map((provider, index) => (
                        <div key={provider.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-semibold text-yellow-600">
                              {index + 1}
                            </div>
                            <div>
                              <span className="text-sm font-medium">{provider.name}</span>
                              <p className="text-xs text-gray-500">{provider.serviceType}</p>
                            </div>
                          </div>
                          <div className="text-right">{getRatingStars(provider.rating)}</div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribución por Servicio */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo de Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    providers.reduce(
                      (acc, provider) => {
                        acc[provider.serviceType] = (acc[provider.serviceType] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>
                    )
                  ).map(([service, count]) => (
                    <div key={service} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{service}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(count / providers.length) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-semibold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Proveedores</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Cargando datos...
                  </div>
                ) : providers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron proveedores para los filtros seleccionados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Calificación</TableHead>
                          <TableHead>Trabajos</TableHead>
                          <TableHead>Ingresos</TableHead>
                          <TableHead>Última Actividad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providers.map(provider => (
                          <TableRow key={provider.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{provider.name}</div>
                                <div className="text-sm text-gray-500">{provider.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{provider.serviceType}</Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(provider.status)}</TableCell>
                            <TableCell>{getRatingStars(provider.rating)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-semibold">
                                  {provider.completedJobs}/{provider.totalJobs}
                                </div>
                                <div className="text-gray-500">
                                  {provider.totalJobs > 0
                                    ? `${((provider.completedJobs / provider.totalJobs) * 100).toFixed(1)}%`
                                    : '0%'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(provider.totalEarnings)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(provider.lastActive).toLocaleDateString('es-CL')}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
