'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Building,
  Users,
  Download,
  Filter,
  Search,
  Eye,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Commission {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  clientName: string;
  clientType: 'owner' | 'tenant';
  dealType: 'rental' | 'sale';
  dealValue: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  paymentDate?: string;
  dueDate: string;
  createdAt: string;
}

interface CommissionStats {
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  overdueCommissions: number;
  totalEarnings: number;
  averageCommission: number;
  thisMonthEarnings: number;
}

export default function BrokerCommissionsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<CommissionStats>({
    totalCommissions: 0,
    paidCommissions: 0,
    pendingCommissions: 0,
    overdueCommissions: 0,
    totalEarnings: 0,
    averageCommission: 0,
    thisMonthEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // 'csv', 'json'
    status: 'all', // filtro por estado
    startDate: '',
    endDate: '',
  });

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

    const loadCommissionsData = async () => {
      try {
        // Cargar datos reales desde la API
        const response = await fetch('/api/broker/commissions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const commissionsData = data.commissions || data.data || [];

          // Transformar datos de la API al formato esperado
          const transformedCommissions: Commission[] = commissionsData.map((commission: any) => ({
            id: commission.id || commission.commissionId,
            propertyTitle: commission.propertyTitle || commission.property?.title || 'Propiedad',
            propertyAddress: commission.propertyAddress || commission.property?.address || '',
            clientName: commission.clientName || commission.client?.name || 'Cliente',
            clientType: commission.clientType || commission.client?.type || 'owner',
            dealType: commission.dealType || commission.type || 'rental',
            dealValue: commission.dealValue || commission.amount || 0,
            commissionRate: commission.commissionRate || commission.rate || 0,
            commissionAmount: commission.commissionAmount || commission.amount || 0,
            status: commission.status || 'pending',
            paymentDate: commission.paymentDate,
            dueDate: commission.dueDate || commission.createdAt,
            createdAt: commission.createdAt,
            notes: commission.notes || '',
          }));

          setCommissions(transformedCommissions);

          // Calculate stats from real data
          const paidCommissions = transformedCommissions.filter(c => c.status === 'paid').length;
          const pendingCommissions = transformedCommissions.filter(c => c.status === 'pending').length;
          const overdueCommissions = transformedCommissions.filter(c => c.status === 'overdue').length;
          const totalEarnings = transformedCommissions
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + c.commissionAmount, 0);
          const averageCommission = paidCommissions > 0 ? totalEarnings / paidCommissions : 0;

          const thisMonthEarnings = transformedCommissions
            .filter(
              c =>
                c.status === 'paid' && new Date(c.paymentDate!).getMonth() === new Date().getMonth()
            )
            .reduce((sum, c) => sum + c.commissionAmount, 0);

          const commissionStats: CommissionStats = {
            totalCommissions: transformedCommissions.length,
            paidCommissions,
            pendingCommissions,
            overdueCommissions,
            totalEarnings,
            averageCommission,
            thisMonthEarnings,
          };

          setStats(commissionStats);
        } else {
          // Si no hay datos reales, mostrar arrays vacíos
          setCommissions([]);
          setStats({
            totalCommissions: 0,
            paidCommissions: 0,
            pendingCommissions: 0,
            overdueCommissions: 0,
            totalEarnings: 0,
            averageCommission: 0,
            thisMonthEarnings: 0,
          });
        }
        setLoading(false);
      } catch (error) {
        logger.error('Error loading commissions data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        // En caso de error, mostrar datos vacíos
        setCommissions([]);
        setStats({
          totalCommissions: 0,
          paidCommissions: 0,
          pendingCommissions: 0,
          overdueCommissions: 0,
          totalEarnings: 0,
          averageCommission: 0,
          thisMonthEarnings: 0,
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadCommissionsData();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'Pagada', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: 'Vencida', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getDealTypeBadge = (dealType: string) => {
    const typeConfig = {
      rental: { label: 'Arriendo', color: 'bg-blue-100 text-blue-800' },
      sale: { label: 'Venta', color: 'bg-purple-100 text-purple-800' },
    };

    const config = typeConfig[dealType as keyof typeof typeConfig] || typeConfig.rental;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleExportCommissions = () => {
    logger.info('Abriendo opciones de exportación de comisiones');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando comisiones del corredor', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.status !== 'all') {
        params.append('status', exportOptions.status);
      }
      if (exportOptions.startDate) {
        params.append('startDate', exportOptions.startDate);
      }
      if (exportOptions.endDate) {
        params.append('endDate', exportOptions.endDate);
      }

      // Crear URL de descarga
      const exportUrl = `/api/broker/commissions/export?${params.toString()}`;

      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `comisiones_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportDialog(false);

      // Resetear opciones de exportación
      setExportOptions({
        format: 'csv',
        status: 'all',
        startDate: '',
        endDate: '',
      });

      logger.info('Exportación de comisiones completada exitosamente');
    } catch (error) {
      logger.error('Error exportando comisiones:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar las comisiones. Por favor, intenta nuevamente.');
    }
  };

  const handleViewCommission = (commissionId: string) => {
    // Navigate to commission detail view
    window.open(`/broker/commissions/${commissionId}`, '_blank');
  };

  const handleDownloadInvoice = (commissionId: string) => {
    // Download commission invoice
    const commission = commissions.find(c => c.id === commissionId);
    if (commission) {
      alert(
        `Descargando factura de comisión\nCliente: ${commission.clientName}\nMonto: ${formatCurrency(commission.commissionAmount)}`
      );
    }
  };

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch =
      commission.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || commission.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando comisiones...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Mis Comisiones"
      subtitle="Seguimiento de ingresos y pagos por comisiones"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comisiones</h1>
            <p className="text-gray-600">
              Gestiona tus ingresos por comisiones de arriendos y ventas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCommissions}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Comisiones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCommissions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comisiones Pagadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.paidCommissions}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ganado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalEarnings)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comisión Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.averageCommission)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar comisiones por propiedad o cliente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="paid">Pagadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Commissions List */}
        <div className="space-y-4">
          {filteredCommissions.map(commission => (
            <Card
              key={commission.id}
              className={`border-l-4 ${commission.status === 'overdue' ? 'border-l-red-500' : commission.status === 'paid' ? 'border-l-green-500' : 'border-l-yellow-500'}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-lg ${commission.status === 'overdue' ? 'bg-red-50' : commission.status === 'paid' ? 'bg-green-50' : 'bg-yellow-50'}`}
                    >
                      <DollarSign className="w-6 h-6 text-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{commission.propertyTitle}</h3>
                        {getDealTypeBadge(commission.dealType)}
                        {getStatusBadge(commission.status)}
                        {commission.status === 'overdue' && (
                          <Badge className="bg-red-100 text-red-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Vencida
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Building className="w-4 h-4" />
                            <span className="font-medium">{commission.propertyAddress}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Users className="w-4 h-4" />
                            <span>
                              {commission.clientName} (
                              {commission.clientType === 'owner' ? 'Propietario' : 'Inquilino'})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Creado: {formatDateTime(commission.createdAt)}</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span>Valor negocio: {formatCurrency(commission.dealValue)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>
                              Comisión: {commission.commissionRate}% (
                              {formatCurrency(commission.commissionAmount)})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Vencimiento: {formatDateTime(commission.dueDate)}</span>
                          </div>
                          {commission.paymentDate && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>Pagado: {formatDateTime(commission.paymentDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewCommission(commission.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {commission.status === 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(commission.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCommissions.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay comisiones registradas
            </h3>
            <p className="text-gray-600">
              Las comisiones aparecerán aquí cuando completes transacciones
            </p>
          </div>
        )}

        {/* Modal de exportación */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Exportar Comisiones</DialogTitle>
              <DialogDescription>
                Selecciona el formato y filtra las comisiones que deseas exportar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="export-format">Formato de Archivo</Label>
                <Select
                  value={exportOptions.format}
                  onValueChange={value => setExportOptions(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="export-status">Filtrar por Estado</Label>
                <Select
                  value={exportOptions.status}
                  onValueChange={value => setExportOptions(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las comisiones</SelectItem>
                    <SelectItem value="ACTIVE">Activas</SelectItem>
                    <SelectItem value="PENDING">Pendientes</SelectItem>
                    <SelectItem value="EXPIRED">Vencidas</SelectItem>
                    <SelectItem value="TERMINATED">Terminadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="export-start-date">Fecha Desde</Label>
                  <Input
                    id="export-start-date"
                    type="date"
                    value={exportOptions.startDate}
                    onChange={e =>
                      setExportOptions(prev => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="export-end-date">Fecha Hasta</Label>
                  <Input
                    id="export-end-date"
                    type="date"
                    value={exportOptions.endDate}
                    onChange={e => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Se exportarán {filteredCommissions.length} comisiones
                  {exportOptions.format === 'csv'
                    ? ' en formato CSV compatible con Excel'
                    : ' en formato JSON'}
                  {exportOptions.status !== 'all' &&
                    ` filtradas por estado "${exportOptions.status}"`}
                  {(exportOptions.startDate || exportOptions.endDate) &&
                    ' en el rango de fechas seleccionado'}
                  .
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExportDialog(false);
                  setExportOptions({
                    format: 'csv',
                    status: 'all',
                    startDate: '',
                    endDate: '',
                  });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar Comisiones
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
