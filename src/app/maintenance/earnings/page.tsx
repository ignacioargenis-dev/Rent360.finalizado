'use client';

import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Plus,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger-minimal';

// INTERFACES PARA DASHBOARD DE GANANCIAS DE MANTENIMIENTO
interface EarningsStats {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayments: number;
  completedJobs: number;
  averageRating: number;
  totalJobs: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
  propertyAddress: string;
  clientName: string;
}

interface MonthlyStats {
  month: string;
  earnings: number;
  jobs: number;
  rating: number;
}

export default function MaintenanceEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingPayments: 0,
    completedJobs: 0,
    averageRating: 0,
    totalJobs: 0,
  });

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);

  // Estado para configuración de pagos
  const [paymentSettings, setPaymentSettings] = useState({
    preferredMethod: 'bank',
    frequency: 'weekly',
    autoWithdraw: false,
    minimumWithdraw: 50000,
  });
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular carga de datos - reemplazar con API real
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Datos de ejemplo para mantenimiento
      setStats({
        totalEarnings: 3240000,
        monthlyEarnings: 890000,
        pendingPayments: 145000,
        completedJobs: 47,
        averageRating: 4.8,
        totalJobs: 52,
      });

      setPayments([
        {
          id: '1',
          amount: 150000,
          status: 'completed',
          date: '2024-09-28',
          description: 'Reparación de calefacción - Depto. Las Condes',
          propertyAddress: 'Av. Apoquindo 3400, Las Condes',
          clientName: 'Carlos Ramírez',
        },
        {
          id: '2',
          amount: 95000,
          status: 'completed',
          date: '2024-09-25',
          description: 'Mantenimiento preventivo ascensor',
          propertyAddress: 'Providencia 123, Providencia',
          clientName: 'Edificio Corporativo Ltda.',
        },
        {
          id: '3',
          amount: 78000,
          status: 'pending',
          date: '2024-09-30',
          description: 'Reparación de fuga de agua',
          propertyAddress: 'Vitacura 890, Vitacura',
          clientName: 'María González',
        },
      ]);

      setMonthlyStats([
        { month: 'Julio', earnings: 650000, jobs: 8, rating: 4.6 },
        { month: 'Agosto', earnings: 720000, jobs: 12, rating: 4.7 },
        { month: 'Septiembre', earnings: 890000, jobs: 15, rating: 4.8 },
      ]);
    } catch (err) {
      logger.error('Error loading earnings data:', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Error al cargar los datos de ganancias');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSavePaymentSettings = async () => {
    try {
      // En una aplicación real, aquí iría la llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mostrar mensaje de éxito
      const event = new CustomEvent('showSuccessMessage', {
        detail: 'Configuración de pagos guardada exitosamente',
      });
      window.dispatchEvent(event);
    } catch (error) {
      logger.error('Error saving payment settings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      const event = new CustomEvent('showErrorMessage', {
        detail: 'Error al guardar la configuración de pagos',
      });
      window.dispatchEvent(event);
    }
  };

  const updatePaymentSetting = (key: string, value: any) => {
    setPaymentSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Fallido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout
        title="Ganancias"
        subtitle="Gestión financiera de tus servicios de mantenimiento"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos de ganancias...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout
        title="Ganancias"
        subtitle="Gestión financiera de tus servicios de mantenimiento"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadEarningsData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Ganancias"
      subtitle="Gestión financiera de tus servicios de mantenimiento"
    >
      <div className="space-y-6">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthlyEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedJobs} trabajos completados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.pendingPayments)}</div>
              <p className="text-xs text-muted-foreground">Por confirmar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}</div>
              <p className="text-xs text-muted-foreground">★★★★★ Excelente</p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal con pestañas */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Pestaña de Resumen */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de ganancias mensuales */}
              <Card>
                <CardHeader>
                  <CardTitle>Ganancias Mensuales</CardTitle>
                  <CardDescription>Evolución de tus ingresos por mantenimiento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyStats.map((month, index) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{month.month}</p>
                          <p className="text-sm text-muted-foreground">{month.jobs} trabajos</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(month.earnings)}</p>
                          <div className="flex items-center text-sm">
                            <Star className="w-3 h-3 text-yellow-400 mr-1" />
                            {month.rating}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resumen de trabajos */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Trabajos</CardTitle>
                  <CardDescription>Estadísticas de tus servicios de mantenimiento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Trabajos Completados</span>
                      <span className="font-bold text-green-600">{stats.completedJobs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Trabajos Totales</span>
                      <span className="font-bold">{stats.totalJobs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tasa de Éxito</span>
                      <span className="font-bold text-blue-600">
                        {((stats.completedJobs / stats.totalJobs) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pestaña de Pagos */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>
                  Todos los pagos recibidos por tus servicios de mantenimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.map(payment => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.propertyAddress} • {payment.clientName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-bold">{formatCurrency(payment.amount)}</p>
                        {getStatusBadge(payment.status)}
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowPaymentDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Servicio Más Rentables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Reparaciones Eléctricas</span>
                      <span className="font-bold text-green-600">$450,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Mantenimiento de Calefacción</span>
                      <span className="font-bold text-green-600">$380,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Reparaciones de Plomería</span>
                      <span className="font-bold text-green-600">$320,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Clientes Más Frecuentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Edificio Corporativo Ltda.</span>
                      <span className="font-bold">8 trabajos</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Carlos Ramírez</span>
                      <span className="font-bold">6 trabajos</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">María González</span>
                      <span className="font-bold">5 trabajos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pestaña de Configuración */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Pagos</CardTitle>
                <CardDescription>
                  Gestiona cómo recibir tus pagos por servicios de mantenimiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Método de Pago Preferido</label>
                  <Select
                    value={paymentSettings.preferredMethod}
                    onValueChange={value => updatePaymentSetting('preferredMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Transferencia Bancaria</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="khipu">Khipu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Frecuencia de Pagos</label>
                  <Select
                    value={paymentSettings.frequency}
                    onValueChange={value => updatePaymentSetting('frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quincenal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleSavePaymentSettings} disabled={false}>
                  <Settings className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Diálogo de detalles de pago */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalles del Pago</DialogTitle>
              <DialogDescription>Información completa del pago seleccionado</DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Monto: {formatCurrency(selectedPayment.amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    Estado: {getStatusBadge(selectedPayment.status)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">
                    Fecha: {new Date(selectedPayment.date).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Descripción:</p>
                  <p className="text-sm text-muted-foreground">{selectedPayment.description}</p>
                </div>
                <div>
                  <p className="font-medium">Propiedad: {selectedPayment.propertyAddress}</p>
                  <p className="font-medium">Cliente: {selectedPayment.clientName}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
