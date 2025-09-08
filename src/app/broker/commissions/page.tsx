'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, 
  TrendingUp, 
  Calendar, 
  Users, Building, Download,
  Filter,
  Search,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import CommissionCalculator from '@/components/commissions/CommissionCalculator';

interface Commission {
  id: string;
  contractId: string;
  propertyTitle: string;
  clientName: string;
  amount: number;
  percentage: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  contractValue: number;
  propertyType: 'apartment' | 'house' | 'office' | 'commercial' | 'other';
  createdAt: string;
  notes?: string;
}

interface CommissionStats {
  totalEarned: number;
  pendingAmount: number;
  thisMonth: number;
  thisYear: number;
  totalContracts: number;
  averageCommission: number;
  topPropertyType: string;
  successRate: number;
}

interface MonthlyData {
  month: string;
  earned: number;
  contracts: number;
}

interface GoalProgress {
  monthly: {
    target: number;
    current: number;
    percentage: number;
  };
  yearly: {
    target: number;
    current: number;
    percentage: number;
  };
}

export default function BrokerCommissions() {

  const [user, setUser] = useState<User | null>(null);

  const [commissions, setCommissions] = useState<Commission[]>([]);

  const [stats, setStats] = useState<CommissionStats>({
    totalEarned: 0,
    pendingAmount: 0,
    thisMonth: 0,
    thisYear: 0,
    totalContracts: 0,
    averageCommission: 0,
    topPropertyType: '',
    successRate: 0,
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  const [goals, setGoals] = useState<GoalProgress>({
    monthly: { target: 5000000, current: 0, percentage: 0 },
    yearly: { target: 50000000, current: 0, percentage: 0 },
  });

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('all');

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
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    const loadCommissions = async () => {
      try {
        // Mock commissions data
        const mockCommissions: Commission[] = [
          {
            id: '1',
            contractId: 'CT001',
            propertyTitle: 'Departamento Amoblado Centro',
            clientName: 'Juan Pérez',
            amount: 450000,
            percentage: 5,
            status: 'paid',
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString().split('T')[0],
            paidDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
            contractValue: 9000000,
            propertyType: 'apartment',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
          },
          {
            id: '2',
            contractId: 'CT002',
            propertyTitle: 'Casa Las Condes',
            clientName: 'María García',
            amount: 1200000,
            percentage: 4,
            status: 'approved',
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
            contractValue: 30000000,
            propertyType: 'house',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
          },
          {
            id: '3',
            contractId: 'CT003',
            propertyTitle: 'Oficina Vitacura',
            clientName: 'Carlos López',
            amount: 800000,
            percentage: 4,
            status: 'pending',
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString().split('T')[0],
            contractValue: 20000000,
            propertyType: 'office',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
          },
          {
            id: '4',
            contractId: 'CT004',
            propertyTitle: 'Local Comercial',
            clientName: 'Ana Martínez',
            amount: 1500000,
            percentage: 3,
            status: 'paid',
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
            paidDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
            contractValue: 50000000,
            propertyType: 'commercial',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
          },
          {
            id: '5',
            contractId: 'CT005',
            propertyTitle: 'Departamento Playa',
            clientName: 'Roberto Silva',
            amount: 600000,
            percentage: 5,
            status: 'approved',
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString().split('T')[0],
            contractValue: 12000000,
            propertyType: 'apartment',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
          },
          {
            id: '6',
            contractId: 'CT006',
            propertyTitle: 'Casa Familiar La Reina',
            clientName: 'Laura Fernández',
            amount: 900000,
            percentage: 4,
            status: 'cancelled',
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
            contractValue: 22500000,
            propertyType: 'house',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
            notes: 'Contrato cancelado por decisión del cliente',
          },
        ];

        setCommissions(mockCommissions);

        // Calculate stats
        const paidCommissions = mockCommissions.filter(c => c.status === 'paid');
        const pendingCommissions = mockCommissions.filter(c => c.status === 'pending');
        const approvedCommissions = mockCommissions.filter(c => c.status === 'approved');
        
        const totalEarned = paidCommissions.reduce((sum, c) => sum + c.amount, 0);
        const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);
        
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const thisMonthCommissions = paidCommissions.filter(c => 
          new Date(c.paidDate || c.createdAt) >= thisMonth,
        );
        const thisMonthEarned = thisMonthCommissions.reduce((sum, c) => sum + c.amount, 0);
        
        const thisYear = new Date();
        thisYear.setMonth(0, 1);
        const thisYearCommissions = paidCommissions.filter(c => 
          new Date(c.paidDate || c.createdAt) >= thisYear,
        );
        const thisYearEarned = thisYearCommissions.reduce((sum, c) => sum + c.amount, 0);
        
        const totalContracts = mockCommissions.length;
        const averageCommission = totalContracts > 0 ? totalEarned / totalContracts : 0;
        
        // Find top property type
        const propertyTypeCount = mockCommissions.reduce((acc, c) => {
          acc[c.propertyType] = (acc[c.propertyType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const topPropertyType = Object.entries(propertyTypeCount)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
        
        const successRate = totalContracts > 0 ? 
          ((paidCommissions.length + approvedCommissions.length) / totalContracts) * 100 : 0;

        const commissionStats: CommissionStats = {
          totalEarned,
          pendingAmount,
          thisMonth: thisMonthEarned,
          thisYear: thisYearEarned,
          totalContracts,
          averageCommission,
          topPropertyType,
          successRate,
        };

        setStats(commissionStats);

        // Generate monthly data
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mockMonthlyData: MonthlyData[] = months.map((month, index) => ({
          month,
          earned: Math.floor(Math.random() * 3000000) + 1000000,
          contracts: Math.floor(Math.random() * 8) + 2,
        }));

        setMonthlyData(mockMonthlyData);

        // Set goals
        const monthlyGoal: GoalProgress['monthly'] = {
          target: 5000000,
          current: thisMonthEarned,
          percentage: Math.min((thisMonthEarned / 5000000) * 100, 100),
        };

        const yearlyGoal: GoalProgress['yearly'] = {
          target: 50000000,
          current: thisYearEarned,
          percentage: Math.min((thisYearEarned / 50000000) * 100, 100),
        };

        setGoals({
          monthly: monthlyGoal,
          yearly: yearlyGoal,
        });

        setLoading(false);
      } catch (error) {
        logger.error('Error loading commissions:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadCommissions();
  }, []);

  const updateCommissionStatus = async (commissionId: string, newStatus: string) => {
    setCommissions(prev => prev.map(commission => 
      commission.id === commissionId 
        ? { 
            ...commission, 
            status: newStatus as Commission['status'],
            paidDate: newStatus === 'paid' ? new Date().toISOString() : commission.paidDate,
          }
        : commission,
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'approved':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pagada</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-800">Aprobada</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'apartment':
        return <Building className="w-4 h-4" />;
      case 'house':
        return <Building className="w-4 h-4" />;
      case 'office':
        return <Building className="w-4 h-4" />;
      case 'commercial':
        return <Building className="w-4 h-4" />;
      default:
        return <Building className="w-4 h-4" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredCommissions = commissions.filter(commission => {
    const matchesFilter = filter === 'all' || commission.status === filter || commission.propertyType === filter;
    const matchesSearch = commission.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.contractId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando comisiones...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Comisiones"
      subtitle="Gestiona y monitorea todas tus comisiones"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Comisiones</h1>
            <p className="text-gray-600">Gestiona y monitorea todas tus comisiones</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Nuevo Contrato
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ganado</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalEarned)}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +15% vs mes anterior
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendiente</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.pendingAmount)}</p>
                  <p className="text-xs text-yellow-600 flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Por aprobar
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.thisMonth)}</p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Target className="w-3 h-3 mr-1" />
                    {formatPercentage(goals.monthly.percentage)} del objetivo
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa Éxito</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(stats.successRate)}</p>
                  <p className="text-xs text-purple-600 flex items-center mt-1">
                    <Award className="w-3 h-3 mr-1" />
                    {stats.totalContracts} contratos
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Progress */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Objetivo Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Meta: {formatPrice(goals.monthly.target)}</span>
                  <span className="text-sm text-gray-600">{formatPercentage(goals.monthly.percentage)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${goals.monthly.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Actual: {formatPrice(goals.monthly.current)}</span>
                  <span>Restante: {formatPrice(goals.monthly.target - goals.monthly.current)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Objetivo Anual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Meta: {formatPrice(goals.yearly.target)}</span>
                  <span className="text-sm text-gray-600">{formatPercentage(goals.yearly.percentage)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${goals.yearly.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Actual: {formatPrice(goals.yearly.current)}</span>
                  <span>Restante: {formatPrice(goals.yearly.target - goals.yearly.current)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Rendimiento Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Gráfico de rendimiento mensual</p>
                  <p className="text-sm text-gray-400">Evolución de comisiones por mes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Distribución por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Gráfico de distribución</p>
                  <p className="text-sm text-gray-400">Comisiones por tipo de propiedad</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commission Calculator */}
        <div className="mb-6">
          <CommissionCalculator />
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar comisiones..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todas</option>
              <option value="paid">Pagadas</option>
              <option value="approved">Aprobadas</option>
              <option value="pending">Pendientes</option>
              <option value="cancelled">Canceladas</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Commissions List */}
        <div className="space-y-4">
          {filteredCommissions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron comisiones</p>
                  <p className="text-sm text-gray-400">Intenta ajustar tus filtros de búsqueda</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCommissions.map((commission) => (
              <Card key={commission.id} className={`border-l-4 ${getStatusColor(commission.status)}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${getStatusColor(commission.status)}`}>
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{commission.propertyTitle}</h3>
                          {getStatusBadge(commission.status)}
                          <Badge variant="outline" className="text-xs">
                            {commission.contractId}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{commission.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>{commission.contractValue.toLocaleString('es-CL')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatPrice(commission.amount)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatPercentage(commission.percentage)} comisión</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Vencimiento: {formatDateTime(commission.dueDate)}</span>
                          </div>
                          {commission.paidDate && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Pagado: {formatDateTime(commission.paidDate)}</span>
                            </div>
                          )}
                        </div>
                        
                        {commission.notes && (
                          <p className="text-sm text-gray-600 mb-2">{commission.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {commission.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateCommissionStatus(commission.id, 'approved')}
                        >
                          Aprobar
                        </Button>
                      )}
                      {commission.status === 'approved' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateCommissionStatus(commission.id, 'paid')}
                        >
                          Marcar Pagada
                        </Button>
                      )}
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
    </EnhancedDashboardLayout>
  );
}
