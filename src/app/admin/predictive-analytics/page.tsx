'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  DollarSign, Building, Users,
  Calendar,
  RefreshCw,
  Download,
  Settings,
  Activity,
  BarChart3,
  PieChart,
  LineChart, Wrench  } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import Link from 'next/link';
import { User } from '@/types';


interface PredictionModel {
  id: string;
  name: string;
  accuracy: number;
  lastTrained: string;
  status: 'active' | 'training' | 'error';
  description: string;
}

interface PredictionData {
  revenue: { month: string; actual: number; predicted: number; confidence: number }[];
  occupancy: { month: string; actual: number; predicted: number; confidence: number }[];
  userGrowth: { month: string; actual: number; predicted: number; confidence: number }[];
  marketTrends: { category: string; current: number; predicted: number; change: number }[];
  riskAssessment: { propertyId: string; address: string; riskLevel: 'low' | 'medium' | 'high'; probability: number; factors: string[] }[];
  churnPrediction: { userId: string; userName: string; riskLevel: 'low' | 'medium' | 'high'; probability: number; reasons: string[] }[];
}

export default function AdminPredictiveAnalytics() {

  const [user, setUser] = useState<User | null>(null);

  const [predictionData, setPredictionData] = useState<PredictionData>({
    revenue: [],
    occupancy: [],
    userGrowth: [],
    marketTrends: [],
    riskAssessment: [],
    churnPrediction: [],
  });

  const [models, setModels] = useState<PredictionModel[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');

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

    const loadPredictionData = async () => {
      try {
        // Generate mock prediction data
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const revenueData = months.map((month, index) => ({
          month,
          actual: 450000 + index * 50000 + Math.random() * 20000,
          predicted: 460000 + index * 52000 + Math.random() * 15000,
          confidence: 85 + Math.random() * 10,
        }));

        const occupancyData = months.map((month, index) => ({
          month,
          actual: 75 + index * 2 + Math.random() * 5,
          predicted: 78 + index * 2.5 + Math.random() * 3,
          confidence: 88 + Math.random() * 8,
        }));

        const userGrowthData = months.map((month, index) => ({
          month,
          actual: 1200 + index * 150 + Math.random() * 50,
          predicted: 1250 + index * 160 + Math.random() * 40,
          confidence: 82 + Math.random() * 12,
        }));

        const marketTrendsData = [
          { category: 'Departamentos', current: 85, predicted: 88, change: 3.5 },
          { category: 'Casas', current: 65, predicted: 70, change: 7.7 },
          { category: 'Oficinas', current: 45, predicted: 48, change: 6.7 },
          { category: 'Comerciales', current: 35, predicted: 33, change: -5.7 },
        ];

        const riskAssessmentData = [
          {
            propertyId: '1',
            address: 'Av. Providencia 1234, Providencia',
            riskLevel: 'medium' as const,
            probability: 0.65,
            factors: ['Ubicación en zona de alto tráfico', 'Edificio con más de 10 años', 'Sin estacionamiento'],
          },
          {
            propertyId: '2',
            address: 'Las Condes 567, Las Condes',
            riskLevel: 'low' as const,
            probability: 0.25,
            factors: ['Zona residencial exclusiva', 'Edificio nuevo', 'Con amenities'],
          },
          {
            propertyId: '3',
            address: 'Ñuñoa 890, Ñuñoa',
            riskLevel: 'high' as const,
            probability: 0.85,
            factors: ['Zona universitaria', 'Edificio antiguo', 'Sin seguridad'],
          },
        ];

        const churnPredictionData = [
          {
            userId: '1',
            userName: 'María González',
            riskLevel: 'medium' as const,
            probability: 0.45,
            reasons: ['Pagos tardíos ocasionales', 'Quejas sobre mantenimiento'],
          },
          {
            userId: '2',
            userName: 'Carlos Rodríguez',
            riskLevel: 'low' as const,
            probability: 0.15,
            reasons: ['Pagos puntuales', 'Sin quejas'],
          },
          {
            userId: '3',
            userName: 'Ana Silva',
            riskLevel: 'high' as const,
            probability: 0.75,
            reasons: ['Múltiples pagos tardíos', 'Quejas frecuentes', 'Solicitud de terminación'],
          },
        ];

        const predictionModels: PredictionModel[] = [
          {
            id: 'revenue',
            name: 'Predicción de Ingresos',
            accuracy: 94.2,
            lastTrained: '2024-01-15',
            status: 'active',
            description: 'Modelo de series temporales para predecir ingresos mensuales',
          },
          {
            id: 'occupancy',
            name: 'Tasa de Ocupación',
            accuracy: 91.8,
            lastTrained: '2024-01-14',
            status: 'active',
            description: 'Predicción de ocupación basada en estacionalidad y tendencias',
          },
          {
            id: 'churn',
            name: 'Predicción de Abandono',
            accuracy: 87.5,
            lastTrained: '2024-01-13',
            status: 'active',
            description: 'Modelo de clasificación para identificar usuarios en riesgo de abandono',
          },
          {
            id: 'risk',
            name: 'Evaluación de Riesgo',
            accuracy: 89.3,
            lastTrained: '2024-01-12',
            status: 'training',
            description: 'Análisis de riesgo para propiedades y contratos',
          },
        ];

        setPredictionData({
          revenue: revenueData,
          occupancy: occupancyData,
          userGrowth: userGrowthData,
          marketTrends: marketTrendsData,
          riskAssessment: riskAssessmentData,
          churnPrediction: churnPredictionData,
        });

        setModels(predictionModels);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading prediction data:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadPredictionData();
  }, [selectedTimeframe]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high': return <Badge className="bg-red-100 text-red-800">Alto</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medio</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800">Bajo</Badge>;
      default: return <Badge>Desconocido</Badge>;
    }
  };

  const getModelStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'training': return <Badge className="bg-blue-100 text-blue-800">Entrenando</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default: return <Badge>Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando analíticas predictivas...</p>
        </div>
      </div>
    );
  }

  return (
        <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Rent360 Admin</h2>
          </div>
        </div>
        <div className="flex-1">
          <div className="p-6">
      
      title="Analíticas Predictivas"
      subtitle="Herramientas avanzadas de IA para predecir tendencias y comportamientos"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analíticas Predictivas</h1>
            <p className="text-gray-600">Modelos de IA para anticipar tendencias y optimizar decisiones</p>
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="1year">Último año</option>
              <option value="2years">Últimos 2 años</option>
            </select>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar Modelos
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>
        </div>

        {/* Model Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {models.map((model) => (
            <Card key={model.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-sm">{model.name}</h3>
                  </div>
                  {getModelStatusBadge(model.status)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Precisión</span>
                    <span className="text-sm font-medium">{model.accuracy}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Último entrenamiento</span>
                    <span className="text-xs">{model.lastTrained}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{model.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="revenue">Ingresos</TabsTrigger>
            <TabsTrigger value="occupancy">Ocupación</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="market">Mercado</TabsTrigger>
            <TabsTrigger value="risk">Riesgos</TabsTrigger>
            <TabsTrigger value="churn">Abandono</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Predicción de Ingresos
                  </CardTitle>
                  <CardDescription>Comparación entre ingresos reales y predichos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={predictionData.revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                      <Legend />
                      <Area type="monotone" dataKey="actual" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="predicted" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Insights de Ingresos</CardTitle>
                  <CardDescription>Análisis predictivo basado en IA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Tendencia Positiva</span>
                    </div>
                    <p className="text-xs text-green-700">Se proyecta un aumento del 15% en ingresos para el próximo trimestre</p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Oportunidades</span>
                    </div>
                    <p className="text-xs text-blue-700">3 propiedades con alto potencial de aumento de renta identificado</p>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Alerta</span>
                    </div>
                    <p className="text-xs text-yellow-700">Estacionalidad muestra posible disminución en meses de verano</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="occupancy">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Tasa de Ocupación Predicha
                  </CardTitle>
                  <CardDescription>Proyección de ocupación basada en tendencias históricas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={predictionData.occupancy}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                      <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recomendaciones</CardTitle>
                  <CardDescription>Acciones sugeridas por el modelo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Optimizar Precios</p>
                      <p className="text-xs text-gray-600">Ajustar rentas en 12 propiedades identificadas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Campaña de Marketing</p>
                      <p className="text-xs text-gray-600">Enfocar en zonas con baja ocupación proyectada</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Mejoras de Propiedades</p>
                      <p className="text-xs text-gray-600">Invertir en 5 propiedades con alto potencial</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Crecimiento de Usuarios
                  </CardTitle>
                  <CardDescription>Proyección de adquisición y retención de usuarios</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={predictionData.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, 'Usuarios']} />
                      <Legend />
                      <Bar dataKey="actual" fill="#3b82f6" />
                      <Bar dataKey="predicted" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Segmentación Predictiva</CardTitle>
                  <CardDescription>Análisis de comportamiento futuro</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Usuarios de Alto Valor</p>
                    <p className="text-xs text-blue-700">234 usuarios identificados con 95% de probabilidad de conversión</p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">Propietarios Activos</p>
                    <p className="text-xs text-purple-700">89% de probabilidad de listar nuevas propiedades</p>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm font-medium text-orange-800">Inquilinos Leales</p>
                    <p className="text-xs text-orange-700">76% de probabilidad de renovar contratos</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="market">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Tendencias del Mercado
                </CardTitle>
                <CardDescription>Análisis predictivo de categorías de propiedades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {predictionData.marketTrends.map((trend, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h3 className="font-semibold text-sm mb-2">{trend.category}</h3>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-600">Actual</p>
                              <p className="text-lg font-bold">{trend.current}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Predicción</p>
                              <p className="text-lg font-bold text-green-600">{trend.predicted}%</p>
                            </div>
                            <div className={`flex items-center justify-center gap-1 text-xs ${
                              trend.change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {trend.change > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {Math.abs(trend.change)}%
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Evaluación de Riesgo
                </CardTitle>
                <CardDescription>Análisis predictivo de riesgos en propiedades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictionData.riskAssessment.map((risk) => (
                    <div key={risk.propertyId} className={`p-4 border rounded-lg ${getRiskColor(risk.riskLevel)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{risk.address}</h3>
                          <p className="text-sm text-gray-600">ID: {risk.propertyId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRiskBadge(risk.riskLevel)}
                          <span className="text-sm font-medium">{risk.probability}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1">Factores de riesgo:</p>
                        <div className="flex flex-wrap gap-1">
                          {risk.factors.map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="churn">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Predicción de Abandono
                </CardTitle>
                <CardDescription>Usuarios en riesgo de abandonar la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictionData.churnPrediction.map((user) => (
                    <div key={user.userId} className={`p-4 border rounded-lg ${getRiskColor(user.riskLevel)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{user.userName}</h3>
                          <p className="text-sm text-gray-600">ID: {user.userId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRiskBadge(user.riskLevel)}
                          <span className="text-sm font-medium">{user.probability}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1">Razones:</p>
                        <div className="flex flex-wrap gap-1">
                          {user.reasons.map((reason, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout
  );
}


