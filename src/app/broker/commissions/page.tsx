'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
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
        // Mock commissions data
        const mockCommissions: Commission[] = [
          {
            id: '1',
            propertyTitle: 'Departamento Moderno Providencia',
            propertyAddress: 'Av. Providencia 123, Providencia',
            clientName: 'María González',
            clientType: 'owner',
            dealType: 'rental',
            dealValue: 450000,
            commissionRate: 50, // 50% of first month's rent
            commissionAmount: 225000,
            status: 'paid',
            paymentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
          },
          {
            id: '2',
            propertyTitle: 'Casa Familiar Las Condes',
            propertyAddress: 'Calle Las Condes 456, Las Condes',
            clientName: 'Roberto Díaz',
            clientType: 'owner',
            dealType: 'rental',
            dealValue: 850000,
            commissionRate: 50,
            commissionAmount: 425000,
            status: 'pending',
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          },
          {
            id: '3',
            propertyTitle: 'Oficina Corporativa Centro',
            propertyAddress: 'Av. Libertador 789, Santiago Centro',
            clientName: 'Ana López',
            clientType: 'owner',
            dealType: 'rental',
            dealValue: 1200000,
            commissionRate: 30,
            commissionAmount: 360000,
            status: 'paid',
            paymentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
          },
          {
            id: '4',
            propertyTitle: 'Local Comercial Ñuñoa',
            propertyAddress: 'Irarrázaval 321, Ñuñoa',
            clientName: 'Carlos Mendoza',
            clientType: 'tenant',
            dealType: 'rental',
            dealValue: 350000,
            commissionRate: 100, // Full month's rent for tenant placement
            commissionAmount: 350000,
            status: 'overdue',
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
          },
        ];

        setCommissions(mockCommissions);

        // Calculate stats
        const paidCommissions = mockCommissions.filter(c => c.status === 'paid').length;
        const pendingCommissions = mockCommissions.filter(c => c.status === 'pending').length;
        const overdueCommissions = mockCommissions.filter(c => c.status === 'overdue').length;
        const totalEarnings = mockCommissions
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + c.commissionAmount, 0);
        const averageCommission = paidCommissions > 0 ? totalEarnings / paidCommissions : 0;

        const thisMonthEarnings = mockCommissions
          .filter(
            c =>
              c.status === 'paid' && new Date(c.paymentDate!).getMonth() === new Date().getMonth()
          )
          .reduce((sum, c) => sum + c.commissionAmount, 0);

        const commissionStats: CommissionStats = {
          totalCommissions: mockCommissions.length,
          paidCommissions,
          pendingCommissions,
          overdueCommissions,
          totalEarnings,
          averageCommission,
          thisMonthEarnings,
        };

        setStats(commissionStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading commissions data:', {
          error: error instanceof Error ? error.message : String(error),
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
    // Export commissions data to CSV
    if (commissions.length === 0) {
      alert('No hay comisiones para exportar');
      return;
    }

    const csvData = commissions.map(commission => ({
      ID: commission.id,
      Propiedad: commission.propertyTitle,
      Cliente: commission.clientName,
      'Valor Negocio': formatCurrency(commission.dealValue),
      Comisión: formatCurrency(commission.commissionAmount),
      Estado: commission.status,
      'Fecha Creación': formatDateTime(commission.createdAt),
      'Fecha Pago': commission.paymentDate ? formatDateTime(commission.paymentDate) : 'Pendiente',
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `comisiones_corredor_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      </div>
    </UnifiedDashboardLayout>
  );
}
