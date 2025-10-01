'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download,
  Filter,
  Search,
  Clock,
  CheckCircle,
  Wallet,
  BarChart3,
  Target } from 'lucide-react';
import { User } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface Earning {
  id: string;
  visitId: string;
  propertyTitle: string;
  propertyAddress: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  date: string;
  paidDate?: string;
  clientName: string;
  visitType: string;
  commission: number;
}

interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  thisMonth: number;
  lastMonth: number;
  visitsCompleted: number;
  averagePerVisit: number;
}

export default function RunnerEarningsPage() {
  const { user, loading: userLoading } = useUserState();

  const [earnings, setEarnings] = useState<Earning[]>([]);

  const [summary, setSummary] = useState<EarningsSummary | null>(null);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      const mockEarnings: Earning[] = [
        {
          id: '1',
          visitId: '1',
          propertyTitle: 'Departamento Las Condes',
          propertyAddress: 'Av. Apoquindo 3400, Las Condes',
          amount: 15000,
          status: 'paid',
          date: '2024-03-15',
          paidDate: '2024-03-20',
          clientName: 'María González',
          visitType: 'Visita Regular',
          commission: 10,
        },
        {
          id: '2',
          visitId: '2',
          propertyTitle: 'Casa Vitacura',
          propertyAddress: 'Av. Vitacura 5432, Vitacura',
          amount: 25000,
          status: 'approved',
          date: '2024-03-14',
          clientName: 'Carlos Ramírez',
          visitType: 'Visita Premium',
          commission: 15,
        },
        {
          id: '3',
          visitId: '3',
          propertyTitle: 'Oficina Providencia',
          propertyAddress: 'Av. Providencia 1245, Providencia',
          amount: 12000,
          status: 'pending',
          date: '2024-03-13',
          clientName: 'Empresa Soluciones Ltda.',
          visitType: 'Visita Regular',
          commission: 8,
        },
        {
          id: '4',
          visitId: '4',
          propertyTitle: 'Departamento Ñuñoa',
          propertyAddress: 'Av. Irarrázaval 2345, Ñuñoa',
          amount: 18000,
          status: 'paid',
          date: '2024-03-12',
          paidDate: '2024-03-18',
          clientName: 'Ana Silva',
          visitType: 'Visita Express',
          commission: 12,
        },
        {
          id: '5',
          visitId: '5',
          propertyTitle: 'Casa Lo Barnechea',
          propertyAddress: 'Camino El Alba 1234, Lo Barnechea',
          amount: 30000,
          status: 'approved',
          date: '2024-03-10',
          clientName: 'Roberto Johnson',
          visitType: 'Visita Premium',
          commission: 20,
        },
      ];

      setEarnings(mockEarnings);
      
      // Calculate summary
      const totalEarnings = mockEarnings.reduce((sum, e) => sum + e.amount, 0);
      const pendingEarnings = mockEarnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
      const paidEarnings = mockEarnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
      const thisMonth = mockEarnings.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.amount, 0);
      const lastMonth = mockEarnings.filter(e => new Date(e.date).getMonth() === new Date().getMonth() - 1).reduce((sum, e) => sum + e.amount, 0);
      const visitsCompleted = mockEarnings.length;
      const averagePerVisit = totalEarnings / visitsCompleted;

      setSummary({
        totalEarnings,
        pendingEarnings,
        paidEarnings,
        thisMonth,
        lastMonth,
        visitsCompleted,
        averagePerVisit,
      });

      setLoading(false);
    }, 1000);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">Aprobado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredEarnings = earnings.filter(earning => {
    const matchesSearch = earning.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         earning.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         earning.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || earning.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const earningDate = new Date(earning.date);
      const now = new Date();
      switch (dateFilter) {
        case 'thisMonth':
          matchesDate = earningDate.getMonth() === now.getMonth() && earningDate.getFullYear() === now.getFullYear();
          break;
        case 'lastMonth':
          matchesDate = earningDate.getMonth() === now.getMonth() - 1 && earningDate.getFullYear() === now.getFullYear();
          break;
        case 'thisWeek':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = earningDate >= weekAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ganancias...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Ganancias" subtitle="Seguimiento de ingresos y comisiones">
      <DashboardHeader 
        user={user}
        title="Mis Ganancias"
        subtitle="Gestiona tus ingresos y comisiones"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Ganado</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatPrice(summary?.totalEarnings || 0)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {summary && summary.thisMonth > summary.lastMonth ? (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{Math.round(((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100)}% este mes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        -{summary && summary.lastMonth ? Math.round(((summary.lastMonth - summary.thisMonth) / summary.lastMonth) * 100) : 0}% este mes
                      </span>
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Pendiente de Pago</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {formatPrice(summary?.pendingEarnings || 0)}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {earnings.filter(e => e.status === 'pending').length} visitas por pagar
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Este Mes</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatPrice(summary?.thisMonth || 0)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {earnings.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length} visitas
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Promedio por Visita</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatPrice(summary?.averagePerVisit || 0)}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {summary?.visitsCompleted || 0} visitas completadas
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por propiedad, cliente o dirección..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="paid">Pagados</option>
                  <option value="approved">Aprobados</option>
                  <option value="pending">Pendientes</option>
                  <option value="cancelled">Cancelados</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">Todas las fechas</option>
                  <option value="thisMonth">Este mes</option>
                  <option value="lastMonth">Mes pasado</option>
                  <option value="thisWeek">Esta semana</option>
                </select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings List */}
        <div className="space-y-4">
          {filteredEarnings.map((earning) => (
            <Card key={earning.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {earning.propertyTitle}
                        </h3>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {earning.propertyAddress}
                        </p>
                      </div>
                      {getStatusBadge(earning.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Monto</p>
                        <p className="font-semibold text-gray-900">{formatPrice(earning.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Comisión</p>
                        <p className="font-semibold text-gray-900">{earning.commission}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fecha</p>
                        <p className="font-semibold text-gray-900">{formatDate(earning.date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Visita</p>
                        <p className="font-semibold text-gray-900">{earning.visitType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Wallet className="w-4 h-4" />
                        <span>Cliente: {earning.clientName}</span>
                      </div>
                      {earning.paidDate && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Pagado: {formatDate(earning.paidDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                    <Button size="sm" className="flex-1">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEarnings.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron ganancias
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'Intenta ajustar tus filtros de búsqueda.'
                  : 'Aún no tienes ganancias registradas.'
                }
              </p>
              <Button>
                <Calendar className="w-4 h-4 mr-2" />
                Ver Visitas Programadas
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout
  );
}
