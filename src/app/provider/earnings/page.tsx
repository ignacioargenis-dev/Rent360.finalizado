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

// INTERFACES PARA DASHBOARD DE GANANCIAS
// Compatible con ambos tipos de proveedores: MAINTENANCE y SERVICE
// La funcionalidad es genérica y funciona igual para ambos tipos

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
  providerType: 'MAINTENANCE' | 'SERVICE'; // Compatible con ambos tipos
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

  // Estados para formularios
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');

  // Función para formatear montos en pesos chilenos
  const formatCLP = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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
      // En producción: const response = await fetch('/api/provider/goals');
      // const data = await response.json();

      // Mock data - En producción esto vendría de una API
      const mockGoals: EarningsGoal[] = [
        {
          id: '1',
          title: 'Meta Mensual Octubre',
          targetAmount: 3000000, // $3.000.000 CLP
          currentAmount: 2450000, // $2.450.000 CLP
          deadline: new Date('2025-10-31'),
          category: 'monthly',
          status: 'active'
        },
        {
          id: '2',
          title: 'Meta Trimestral Q4',
          targetAmount: 10000000, // $10.000.000 CLP
          currentAmount: 8500000, // $8.500.000 CLP
          deadline: new Date('2025-12-31'),
          category: 'quarterly',
          status: 'active'
        }
      ];

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));

      setEarningsGoals(mockGoals);
    } catch (error) {
      console.error('Error loading earnings goals:', error);
      setError('Error al cargar las metas financieras');
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
        { month: 'Ene', earnings: 2100000, jobs: 8, growth: 5.2 },  // $2.100.000 CLP
        { month: 'Feb', earnings: 2350000, jobs: 9, growth: 12.0 },  // $2.350.000 CLP
        { month: 'Mar', earnings: 2800000, jobs: 11, growth: 19.1 }, // $2.800.000 CLP
        { month: 'Abr', earnings: 2600000, jobs: 10, growth: -7.1 }, // $2.600.000 CLP
        { month: 'May', earnings: 3200000, jobs: 13, growth: 23.1 }, // $3.200.000 CLP
        { month: 'Jun', earnings: 2900000, jobs: 12, growth: -9.4 }, // $2.900.000 CLP
        { month: 'Jul', earnings: 3500000, jobs: 14, growth: 20.7 }, // $3.500.000 CLP
        { month: 'Ago', earnings: 3800000, jobs: 15, growth: 8.6 },  // $3.800.000 CLP
        { month: 'Sep', earnings: 4200000, jobs: 17, growth: 10.5 }  // $4.200.000 CLP
      ];
      setChartData(mockChartData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const validateWithdrawalAmount = (amount: number, availableBalance: number = 2450): string | null => {
    if (amount <= 0) return 'El monto debe ser mayor a 0';
    if (amount > availableBalance) return 'El monto excede tu saldo disponible';
    if (amount < 50000) return `El monto mínimo de retiro es ${formatCLP(50000)}`;
    if (amount > 5000000) return `El monto máximo de retiro es ${formatCLP(5000000)} por transacción`;
    return null;
  };

  const handleWithdrawalRequest = async () => {
    const amount = parseFloat(withdrawalAmount);

    // Validaciones
    if (!withdrawalAmount || isNaN(amount)) {
      setError('Por favor ingresa un monto válido');
      return;
    }

    const validationError = validateWithdrawalAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // Simular procesamiento
      setError(null);

      const newWithdrawal: WithdrawalRequest = {
        id: Date.now().toString(),
        amount: amount,
        method: withdrawalMethod,
        status: 'pending',
        requestedAt: new Date(),
        notes: 'Solicitud de retiro enviada - Procesamiento en 1-3 días hábiles'
      };

      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));

      setWithdrawalRequests(prev => [newWithdrawal, ...prev]);
      setShowWithdrawalDialog(false);
      setWithdrawalAmount('');
      setWithdrawalMethod('bank');

      // Mostrar confirmación temporal
      setError(''); // Limpiar error
      console.log('Withdrawal request created:', newWithdrawal);

      // En producción aquí iría la llamada a la API
      // const response = await fetch('/api/provider/withdrawals', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount, method: withdrawalMethod })
      // });

    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      setError('Error al procesar la solicitud de retiro. Inténtalo nuevamente.');
    }
  };

  const exportData = (format: 'csv' | 'pdf') => {
    // Mock export functionality
    console.log(`Exporting data as ${format}`);

    // En producción implementar exportación real
    if (format === 'csv') {
      const csvContent = [
        ['Fecha', 'Tipo', 'Cliente', 'Monto Bruto', 'Comisión', 'Monto Neto', 'Estado'],
        ...filteredTransactions.map(t => [
          new Date(t.createdAt).toLocaleDateString(),
          t.jobs[0]?.type || 'Servicio',
          t.jobs[0]?.clientName || 'Cliente',
          t.amount.toString(),
          t.commission.toString(),
          t.netAmount.toString(),
          t.status
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transacciones-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Para PDF se necesitaría una librería como jsPDF o react-pdf
  };

  const createNewGoal = async (goalData: Omit<EarningsGoal, 'id' | 'currentAmount' | 'status'>) => {
    try {
      // En producción: enviar a API
      const newGoal: EarningsGoal = {
        id: Date.now().toString(),
        ...goalData,
        currentAmount: 0,
        status: 'active'
      };

      setEarningsGoals(prev => [...prev, newGoal]);
      console.log('Nueva meta creada:', newGoal);
    } catch (error) {
      console.error('Error creating goal:', error);
      setError('Error al crear la meta');
    }
  };

  // Paginación básica - En producción implementar paginación del servidor
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTransactions = transactions.filter(transaction => {
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    const matchesSearch = !searchTerm ||
      transaction.jobs.some(job =>
        job.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  // Paginación
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset paginación cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

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
              <div className="text-2xl font-bold">{formatCLP(stats?.totalEarnings || 12450)}</div>
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
              <div className="text-2xl font-bold">{formatCLP(stats?.monthlyEarnings || 3250)}</div>
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
              <div className="text-2xl font-bold">{formatCLP(276)}</div>
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
                    <div className="text-2xl font-bold text-green-600">{formatCLP(chartData.reduce((sum, item) => sum + item.earnings, 0))}</div>
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
                          {formatCLP(goal.currentAmount)} / {formatCLP(goal.targetAmount)}
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
                  {paginatedTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No se encontraron transacciones</p>
                    </div>
                  ) : (
                    <>
                      {paginatedTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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
                              <p className="text-xs text-muted-foreground">
                                {transaction.providerType === 'MAINTENANCE' ? '🏠 Mantenimiento' : '🔧 Servicio General'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                        <p className="font-medium">{formatCLP(transaction.netAmount)}</p>
                        <p className="text-sm text-muted-foreground">
                          Comisión: {formatCLP(transaction.commission)}
                        </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Controles de paginación */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredTransactions.length)} de {filteredTransactions.length} transacciones
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronUp className="w-4 h-4 rotate-90" />
                              Anterior
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Siguiente
                              <ChevronUp className="w-4 h-4 -rotate-90" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
                        <p className="font-medium">{formatCLP(withdrawal.amount)}</p>
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
                      <Input
                        placeholder="Ej: Meta Q4 2025"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Monto Objetivo</label>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={newGoalAmount}
                        onChange={(e) => setNewGoalAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fecha Límite</label>
                      <Input
                        type="date"
                        value={newGoalDeadline}
                        onChange={(e) => setNewGoalDeadline(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    className="mt-4"
                    onClick={async () => {
                      if (!newGoalTitle || !newGoalAmount || !newGoalDeadline) {
                        setError('Por favor completa todos los campos');
                        return;
                      }

                      await createNewGoal({
                        title: newGoalTitle,
                        targetAmount: parseFloat(newGoalAmount),
                        deadline: new Date(newGoalDeadline),
                        category: 'monthly' // Por defecto mensual, se puede hacer configurable
                      });

                      // Limpiar formulario
                      setNewGoalTitle('');
                      setNewGoalAmount('');
                      setNewGoalDeadline('');
                    }}
                    disabled={!newGoalTitle || !newGoalAmount || !newGoalDeadline}
                  >
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
                              <span>{formatCLP(goal.currentAmount)}</span>
                              <span>{formatCLP(goal.targetAmount)}</span>
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
