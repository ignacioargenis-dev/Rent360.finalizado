'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Settings,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  Truck,
  Banknote,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Info,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  HelpCircle,
  FileText,
  PieChart,
  TrendingDown,
  Star,
  Users,
  MessageSquare,
  Bell,
  Plus
} from 'lucide-react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface ProviderTransaction {
  id: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentMethod: string;
  createdAt: Date;
  processedAt?: Date;
  notes?: string;
  providerType: 'MAINTENANCE' | 'SERVICE';
  jobs: {
    id: string;
    type: string;
    amount: number;
    date: Date;
    clientName: string;
  }[];
}

interface ProviderStats {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayments: number;
  completedJobs: number;
  averageRating: number;
  totalJobs: number;
  trustScore: number;
  responseTime: number;
  acceptanceRate: number;
  monthlyGrowth: number;
}

interface EarningsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: 'monthly' | 'quarterly' | 'annual';
  status: 'active' | 'completed' | 'expired';
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  method: 'bank' | 'paypal' | 'crypto';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  processedAt?: Date;
  notes?: string;
}

interface ChartData {
  month: string;
  earnings: number;
  jobs: number;
  growth: number;
}

export default function ProviderEarningsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ProviderTransaction[]>([]);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTransaction, setSelectedTransaction] = useState<ProviderTransaction | null>(null);

  // Nuevos estados para funcionalidades completas
  const [earningsGoals, setEarningsGoals] = useState<EarningsGoal[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'bank' | 'paypal' | 'crypto'>('bank');

  useEffect(() => {
    loadPageData();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setError(null);
      } else {
        setError('Error al cargar la información del usuario');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setError('Error al cargar la información del usuario');
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/provider/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data);
      } else {
        throw new Error('Error al cargar las transacciones');
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      throw error;
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/provider/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        throw new Error('Error al cargar las estadísticas');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      throw error;
    }
  };

  const loadPageData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadUser(),
        loadTransactions(),
        loadStats(),
        loadEarningsGoals(),
        loadWithdrawalRequests(),
        loadChartData()
      ]);
    } catch (error) {
      console.error('Error loading page data:', error);
      setError('Error al cargar los datos de la página');
    } finally {
      setLoading(false);
    }
  };

  const loadEarningsGoals = async () => {
    try {
      // Mock data - En producción esto vendría de una API
      const mockGoals: EarningsGoal[] = [
        {
          id: '1',
          title: 'Meta Mensual Octubre',
          targetAmount: 3000,
          currentAmount: 2450,
          deadline: new Date('2025-10-31'),
          category: 'monthly',
          status: 'active'
        },
        {
          id: '2',
          title: 'Meta Trimestral Q4',
          targetAmount: 10000,
          currentAmount: 8500,
          deadline: new Date('2025-12-31'),
          category: 'quarterly',
          status: 'active'
        }
      ];
      setEarningsGoals(mockGoals);
    } catch (error) {
      console.error('Error loading earnings goals:', error);
    }
  };

  const loadWithdrawalRequests = async () => {
    try {
      // Mock data - En producción esto vendría de una API
      const mockWithdrawals: WithdrawalRequest[] = [
        {
          id: '1',
          amount: 500,
          method: 'bank',
          status: 'completed',
          requestedAt: new Date('2025-09-15'),
          processedAt: new Date('2025-09-16'),
          notes: 'Transferencia bancaria completada'
        },
        {
          id: '2',
          amount: 750,
          method: 'paypal',
          status: 'pending',
          requestedAt: new Date('2025-09-20'),
          notes: 'En proceso de validación'
        }
      ];
      setWithdrawalRequests(mockWithdrawals);
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
    }
  };

  const loadChartData = async () => {
    try {
      // Mock data - En producción esto vendría de una API
      const mockChartData: ChartData[] = [
        { month: 'Ene', earnings: 2100, jobs: 8, growth: 5.2 },
        { month: 'Feb', earnings: 2350, jobs: 9, growth: 12.0 },
        { month: 'Mar', earnings: 2800, jobs: 11, growth: 19.1 },
        { month: 'Abr', earnings: 2600, jobs: 10, growth: -7.1 },
        { month: 'May', earnings: 3200, jobs: 13, growth: 23.1 },
        { month: 'Jun', earnings: 2900, jobs: 12, growth: -9.4 },
        { month: 'Jul', earnings: 3500, jobs: 14, growth: 20.7 },
        { month: 'Ago', earnings: 3800, jobs: 15, growth: 8.6 },
        { month: 'Sep', earnings: 4200, jobs: 17, growth: 10.5 }
      ];
      setChartData(mockChartData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const handleWithdrawalRequest = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      setError('Por favor ingresa un monto válido');
      return;
    }

    try {
      // Mock API call - En producción esto haría una llamada real
      const newWithdrawal: WithdrawalRequest = {
        id: Date.now().toString(),
        amount: parseFloat(withdrawalAmount),
        method: withdrawalMethod,
        status: 'pending',
        requestedAt: new Date(),
        notes: 'Solicitud de retiro enviada'
      };

      setWithdrawalRequests(prev => [newWithdrawal, ...prev]);
      setShowWithdrawalDialog(false);
      setWithdrawalAmount('');
      setError(null);

      // Aquí iría la lógica para enviar la solicitud a la API
      console.log('Withdrawal request:', newWithdrawal);
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      setError('Error al procesar la solicitud de retiro');
    }
  };

  const exportData = (format: 'csv' | 'pdf') => {
    // Mock export functionality
    console.log(`Exporting data as ${format}`);
    // En producción esto generaría y descargaría el archivo
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    const matchesSearch = !searchTerm ||
      transaction.jobs.some(job =>
        job.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <EnhancedDashboardLayout
        user={user}
        title="Mis Ganancias"
        subtitle="Cargando información..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  if (error) {
    return (
      <EnhancedDashboardLayout
        user={user}
        title="Mis Ganancias"
        subtitle="Error al cargar la página"
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPageData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Mis Ganancias"
      subtitle="Dashboard completo de gestión financiera"
    >

      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,450</div>
              <p className="text-xs text-muted-foreground">
                +15% desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancias del Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$3,250</div>
              <p className="text-xs text-muted-foreground">
                +8% desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Completados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">
                +5 desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Servicio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$276</div>
              <p className="text-xs text-muted-foreground">
                +3% desde el mes pasado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KPIs Adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Aceptación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.acceptanceRate || 95}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats?.acceptanceRate || 95}%` }}></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.responseTime || 15}min</div>
              <p className="text-xs text-muted-foreground">Promedio de respuesta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Score de Confianza</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.trustScore || 92}%</div>
              <div className="flex items-center mt-1">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < 4 ? 'fill-current' : ''}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-1">Excelente</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sistema de Pestañas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
            <TabsTrigger value="withdrawals">Retiros</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
          </TabsList>

          {/* Pestaña de Resumen */}
          <TabsContent value="overview" className="space-y-4">
            {/* Gráfico de Tendencias */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ganancias</CardTitle>
                <CardDescription>Evolución mensual de tus ingresos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Gráfico de tendencias mensuales</p>
                    <p className="text-sm text-gray-500 mt-1">Datos de los últimos 9 meses</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">${chartData.reduce((sum, item) => sum + item.earnings, 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total últimos 9 meses</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{chartData.reduce((sum, item) => sum + item.jobs, 0)}</div>
                    <p className="text-xs text-muted-foreground">Trabajos realizados</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">+{((chartData.reduce((sum, item) => sum + item.growth, 0) / chartData.length) || 0).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Crecimiento promedio</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metas de Ganancias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Metas de Ganancias
                </CardTitle>
                <CardDescription>Tu progreso hacia los objetivos financieros</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {earningsGoals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const isCompleted = progress >= 100;
                  const isExpiring = new Date(goal.deadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000; // 7 días

                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{goal.title}</span>
                          {isCompleted && <Award className="w-4 h-4 text-green-500" />}
                          {isExpiring && !isCompleted && <AlertCircle className="w-4 h-4 text-orange-500" />}
                        </div>
                        <Badge variant={isCompleted ? "default" : "secondary"}>
                          {goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{progress.toFixed(1)}% completado</span>
                        <span>Vence: {new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Transacciones */}
          <TabsContent value="transactions" className="space-y-4">
            {/* Filtros y Búsqueda */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros y Búsqueda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por cliente o tipo de servicio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="COMPLETED">Completados</SelectItem>
                      <SelectItem value="PENDING">Pendientes</SelectItem>
                      <SelectItem value="FAILED">Fallidos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo el tiempo</SelectItem>
                      <SelectItem value="month">Este mes</SelectItem>
                      <SelectItem value="quarter">Este trimestre</SelectItem>
                      <SelectItem value="year">Este año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Transacciones */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Transacciones Recientes</CardTitle>
                  <CardDescription>
                    {filteredTransactions.length} transacciones encontradas
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportData('pdf')}>
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTransactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.status === 'COMPLETED' ? 'bg-green-500' :
                          transaction.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">
                            {transaction.jobs.length > 0 ? transaction.jobs[0].type : 'Servicio'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.jobs.length > 0 ? transaction.jobs[0].clientName : 'Cliente'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${transaction.netAmount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Retiros */}
          <TabsContent value="withdrawals" className="space-y-4">
            {/* Solicitar Retiro */}
            <Card>
              <CardHeader>
                <CardTitle>Solicitar Retiro</CardTitle>
                <CardDescription>
                  Retira tus ganancias disponibles a tu cuenta bancaria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Retiro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Solicitar Retiro de Fondos</DialogTitle>
                      <DialogDescription>
                        Los retiros se procesan en 1-3 días hábiles
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Monto a retirar</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Método de retiro</label>
                        <Select value={withdrawalMethod} onValueChange={(value: 'bank' | 'paypal' | 'crypto') => setWithdrawalMethod(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank">Transferencia Bancaria</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="crypto">Criptomoneda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowWithdrawalDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleWithdrawalRequest}>
                          Solicitar Retiro
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Historial de Retiros */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Retiros</CardTitle>
                <CardDescription>Todas tus solicitudes de retiro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withdrawalRequests.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          withdrawal.status === 'completed' ? 'bg-green-500' :
                          withdrawal.status === 'processing' ? 'bg-blue-500' :
                          withdrawal.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium capitalize">{withdrawal.method}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(withdrawal.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${withdrawal.amount.toFixed(2)}</p>
                        <Badge variant={
                          withdrawal.status === 'completed' ? 'default' :
                          withdrawal.status === 'processing' ? 'secondary' : 'outline'
                        }>
                          {withdrawal.status === 'completed' ? 'Completado' :
                           withdrawal.status === 'processing' ? 'Procesando' :
                           withdrawal.status === 'pending' ? 'Pendiente' : 'Fallido'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Metas */}
          <TabsContent value="goals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Gestión de Metas Financieras
                </CardTitle>
                <CardDescription>
                  Establece y monitorea tus objetivos de ingresos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nueva Meta */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Crear Nueva Meta</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Título</label>
                      <Input placeholder="Ej: Meta Q4 2025" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Monto Objetivo</label>
                      <Input type="number" placeholder="5000" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fecha Límite</label>
                      <Input type="date" />
                    </div>
                  </div>
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Meta
                  </Button>
                </div>

                {/* Metas Activas */}
                <div>
                  <h4 className="font-medium mb-4">Metas Activas</h4>
                  <div className="space-y-4">
                    {earningsGoals.filter(goal => goal.status === 'active').map((goal) => {
                      const progress = (goal.currentAmount / goal.targetAmount) * 100;
                      return (
                        <div key={goal.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{goal.title}</h5>
                            <Badge variant="outline">{goal.category}</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>${goal.currentAmount.toLocaleString()}</span>
                              <span>${goal.targetAmount.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{progress.toFixed(1)}% completado</span>
                              <span>{Math.ceil((goal.targetAmount - goal.currentAmount) / (stats?.monthlyEarnings || 3000))} meses restantes</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Centro de Ayuda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="w-5 h-5 mr-2" />
              Centro de Ayuda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <MessageSquare className="w-6 h-6 mb-2" />
                <span>Chat de Soporte</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <FileText className="w-6 h-6 mb-2" />
                <span>Documentación</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Bell className="w-6 h-6 mb-2" />
                <span>Notificaciones</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </EnhancedDashboardLayout>
  );
}
