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
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';
import { logger } from '@/lib/logger';

interface MaintenanceSummary {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  urgentRequests: number;
  averageCompletionTime: number;
  totalCost: number;
  monthlyGrowth: number;
}

interface MaintenanceRecord {
  id: string;
  propertyAddress: string;
  tenantName: string;
  providerName: string;
  serviceType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  requestDate: string;
  completionDate?: string;
  cost: number;
  description: string;
  rating?: number;
}

export default function MaintenanceReportsPage() {
  const { user } = useUserState();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<MaintenanceSummary>({
    totalRequests: 0,
    completedRequests: 0,
    pendingRequests: 0,
    urgentRequests: 0,
    averageCompletionTime: 0,
    totalCost: 0,
    monthlyGrowth: 0,
  });
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  // Mock data for maintenance records
  const mockMaintenanceRecords: MaintenanceRecord[] = [
    {
      id: '1',
      propertyAddress: 'Av. Providencia 123, Santiago',
      tenantName: 'Ana Rodríguez',
      providerName: 'Servicios Eléctricos Ltda',
      serviceType: 'Electricidad',
      priority: 'high',
      status: 'completed',
      requestDate: '2024-12-01',
      completionDate: '2024-12-02',
      cost: 250000,
      description: 'Reparación de tomacorrientes en sala',
      rating: 5,
    },
    {
      id: '2',
      propertyAddress: 'Calle Las Condes 456, Las Condes',
      tenantName: 'Pedro Sánchez',
      providerName: 'Fontanería Express',
      serviceType: 'Fontanería',
      priority: 'urgent',
      status: 'in_progress',
      requestDate: '2024-12-03',
      cost: 180000,
      description: 'Fuga de agua en cocina',
      rating: 4,
    },
    {
      id: '3',
      propertyAddress: 'Paseo Ñuñoa 789, Ñuñoa',
      tenantName: 'Laura Martínez',
      providerName: 'Mantenimiento General SPA',
      serviceType: 'General',
      priority: 'medium',
      status: 'pending',
      requestDate: '2024-12-04',
      cost: 95000,
      description: 'Cambio de cerradura puerta principal',
    },
    {
      id: '4',
      propertyAddress: 'Av. Vitacura 321, Vitacura',
      tenantName: 'Diego Torres',
      providerName: 'Servicios Eléctricos Ltda',
      serviceType: 'Electricidad',
      priority: 'low',
      status: 'completed',
      requestDate: '2024-12-01',
      completionDate: '2024-12-05',
      cost: 120000,
      description: 'Instalación de lámpara LED en baño',
      rating: 5,
    },
    {
      id: '5',
      propertyAddress: 'Av. Providencia 123, Santiago',
      tenantName: 'Ana Rodríguez',
      providerName: 'Fontanería Express',
      serviceType: 'Fontanería',
      priority: 'medium',
      status: 'assigned',
      requestDate: '2024-12-05',
      cost: 75000,
      description: 'Reparación de grifería lavamanos',
    },
  ];

  useEffect(() => {
    loadMaintenanceData();
  }, [dateRange, statusFilter, priorityFilter]);

  const loadMaintenanceData = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Filter records based on criteria
      let filteredRecords = mockMaintenanceRecords;

      if (statusFilter !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.status === statusFilter);
      }

      if (priorityFilter !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.priority === priorityFilter);
      }

      // Filter by date range
      filteredRecords = filteredRecords.filter(
        r => r.requestDate >= dateRange.startDate && r.requestDate <= dateRange.endDate
      );

      setMaintenanceRecords(filteredRecords);

      // Calculate summary
      const totalRequests = filteredRecords.length;
      const completedRequests = filteredRecords.filter(r => r.status === 'completed').length;
      const pendingRequests = filteredRecords.filter(r => r.status === 'pending').length;
      const urgentRequests = filteredRecords.filter(r => r.priority === 'urgent').length;
      const totalCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0);

      // Calculate average completion time for completed requests
      const completedRecords = filteredRecords.filter(
        r => r.status === 'completed' && r.completionDate
      );
      const averageCompletionTime =
        completedRecords.length > 0
          ? completedRecords.reduce((sum, r) => {
              const start = new Date(r.requestDate).getTime();
              const end = new Date(r.completionDate!).getTime();
              return sum + (end - start) / (1000 * 60 * 60 * 24); // days
            }, 0) / completedRecords.length
          : 0;

      setSummary({
        totalRequests,
        completedRequests,
        pendingRequests,
        urgentRequests,
        averageCompletionTime: Math.round(averageCompletionTime * 10) / 10, // Round to 1 decimal
        totalCost,
        monthlyGrowth: 8.3, // Mock growth percentage
      });
    } catch (error) {
      logger.error('Error al cargar datos de mantenimiento', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      [
        'ID',
        'Propiedad',
        'Inquilino',
        'Proveedor',
        'Tipo Servicio',
        'Prioridad',
        'Estado',
        'Fecha Solicitud',
        'Fecha Completado',
        'Costo',
        'Descripción',
        'Calificación',
      ],
      ...maintenanceRecords.map(record => [
        record.id,
        record.propertyAddress,
        record.tenantName,
        record.providerName,
        record.serviceType,
        record.priority === 'low'
          ? 'Baja'
          : record.priority === 'medium'
            ? 'Media'
            : record.priority === 'high'
              ? 'Alta'
              : 'Urgente',
        record.status === 'pending'
          ? 'Pendiente'
          : record.status === 'assigned'
            ? 'Asignado'
            : record.status === 'in_progress'
              ? 'En Progreso'
              : record.status === 'completed'
                ? 'Completado'
                : 'Cancelado',
        record.requestDate,
        record.completionDate || '',
        record.cost.toLocaleString(),
        record.description,
        record.rating || '',
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
      `reporte-mantenimiento-${new Date().toISOString().split('T')[0]}.csv`
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
      case 'assigned':
        return <Badge variant="outline">Asignado</Badge>;
      case 'in_progress':
        return <Badge variant="default">En Progreso</Badge>;
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
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Mantenimiento</h1>
            <p className="text-gray-600">
              Análisis completo de solicitudes y trabajos de mantenimiento
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadMaintenanceData} disabled={isLoading}>
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
                <Label htmlFor="statusFilter">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="assigned">Asignado</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priorityFilter">Prioridad</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="details">Detalles de Solicitudes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.totalRequests}</p>
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
                      <p className="text-2xl font-bold text-green-600">
                        {summary.completedRequests}
                      </p>
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
                      <p className="text-2xl font-bold text-yellow-600">
                        {summary.pendingRequests}
                      </p>
                    </div>
                    <Clock className="w-12 h-12 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Urgentes</p>
                      <p className="text-2xl font-bold text-red-600">{summary.urgentRequests}</p>
                    </div>
                    <AlertTriangle className="w-12 h-12 text-red-600" />
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
                      <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {summary.averageCompletionTime} días
                      </p>
                    </div>
                    <BarChart3 className="w-12 h-12 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Costo Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(summary.totalCost)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
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
                      <span className="font-semibold">{summary.completedRequests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm">En Progreso</span>
                      </div>
                      <span className="font-semibold">
                        {maintenanceRecords.filter(r => r.status === 'in_progress').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-sm">Asignadas</span>
                      </div>
                      <span className="font-semibold">
                        {maintenanceRecords.filter(r => r.status === 'assigned').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-500 rounded"></div>
                        <span className="text-sm">Pendientes</span>
                      </div>
                      <span className="font-semibold">{summary.pendingRequests}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Distribución por Prioridad */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Prioridad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm">Urgente</span>
                      </div>
                      <span className="font-semibold">{summary.urgentRequests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-500 rounded"></div>
                        <span className="text-sm">Alta</span>
                      </div>
                      <span className="font-semibold">
                        {maintenanceRecords.filter(r => r.priority === 'high').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-sm">Media</span>
                      </div>
                      <span className="font-semibold">
                        {maintenanceRecords.filter(r => r.priority === 'medium').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm">Baja</span>
                      </div>
                      <span className="font-semibold">
                        {maintenanceRecords.filter(r => r.priority === 'low').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Proveedores */}
            <Card>
              <CardHeader>
                <CardTitle>Top Proveedores por Solicitudes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    maintenanceRecords.reduce(
                      (acc, record) => {
                        acc[record.providerName] = (acc[record.providerName] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>
                    )
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([provider, count]) => (
                      <div key={provider} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{provider}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  (count /
                                    Math.max(
                                      ...Object.values(
                                        maintenanceRecords.reduce(
                                          (acc, record) => {
                                            acc[record.providerName] =
                                              (acc[record.providerName] || 0) + 1;
                                            return acc;
                                          },
                                          {} as Record<string, number>
                                        )
                                      )
                                    )) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold w-8 text-right">{count}</span>
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
                <CardTitle>Lista de Solicitudes de Mantenimiento</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Cargando datos...
                  </div>
                ) : maintenanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron solicitudes de mantenimiento para los filtros seleccionados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Propiedad</TableHead>
                          <TableHead>Inquilino</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Prioridad</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Costo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenanceRecords.map(record => (
                          <TableRow key={record.id}>
                            <TableCell
                              className="font-medium max-w-xs truncate"
                              title={record.propertyAddress}
                            >
                              {record.propertyAddress}
                            </TableCell>
                            <TableCell>{record.tenantName}</TableCell>
                            <TableCell>{record.providerName}</TableCell>
                            <TableCell>{record.serviceType}</TableCell>
                            <TableCell>{getPriorityBadge(record.priority)}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell>
                              {new Date(record.requestDate).toLocaleDateString('es-CL')}
                            </TableCell>
                            <TableCell>{formatCurrency(record.cost)}</TableCell>
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
