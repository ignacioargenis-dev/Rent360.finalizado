'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  PieChart,
  Target,
  DollarSign,
  Building,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Brain,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Home,
  Car,
  Wifi,
  Shield,
  Star,
  Zap,
  Lightbulb,
  Settings
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { cn } from '@/lib/utils';

interface MarketPrediction {
  propertyId: string;
  predictedOccupancy: number;
  recommendedRent: number;
  marketTrend: 'bullish' | 'bearish' | 'stable';
  confidence: number;
  factors: string[];
  area: string;
  currentRent: number;
  lastUpdated: Date;
}

interface OccupancyPrediction {
  month: string;
  predicted: number;
  actual?: number;
  confidence: number;
  factors: {
    seasonality: number;
    marketTrend: number;
    competition: number;
    location: number;
  };
}

interface PriceOptimization {
  propertyId: string;
  currentPrice: number;
  recommendedPrice: number;
  potentialIncrease: number;
  marketPosition: 'below' | 'average' | 'above';
  confidence: number;
  factors: string[];
}

interface MarketInsight {
  area: string;
  trend: 'up' | 'down' | 'stable';
  averagePrice: number;
  priceChange: number;
  demand: number;
  supply: number;
  vacancyRate: number;
  recommendation: string;
}

interface PredictiveAnalyticsProps {
  className?: string;
  propertyId?: string;
  area?: string;
  timeRange?: '30d' | '90d' | '180d' | '365d';
}

const COLORS = {
  primary: '#059669',
  secondary: '#0891b2',
  success: '#16a34a',
  warning: '#ca8a04',
  danger: '#dc2626',
  neutral: '#6b7280',
};

const TREND_ICONS = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  stable: Minus,
};

const TREND_COLORS = {
  bullish: COLORS.success,
  bearish: COLORS.danger,
  stable: COLORS.neutral,
};

export default function PredictiveAnalytics({ 
  className,
  propertyId,
  area,
  timeRange = '90d'
}: PredictiveAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<MarketPrediction[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyPrediction[]>([]);
  const [priceOptimizations, setPriceOptimizations] = useState<PriceOptimization[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);

  useEffect(() => {
    loadPredictiveData();
  }, [selectedTimeRange, propertyId, area]);

  const loadPredictiveData = async () => {
    setLoading(true);
    try {
      // Simular carga de datos predictivos
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Datos de predicción de mercado
      const mockPredictions: MarketPrediction[] = [
        {
          propertyId: 'prop-001',
          predictedOccupancy: 0.85,
          recommendedRent: 850000,
          marketTrend: 'bullish',
          confidence: 0.87,
          factors: ['Alta demanda en el área', 'Precios por debajo del mercado', 'Mejoras en transporte'],
          area: 'Las Condes',
          currentRent: 800000,
          lastUpdated: new Date(),
        },
        {
          propertyId: 'prop-002',
          predictedOccupancy: 0.72,
          recommendedRent: 650000,
          marketTrend: 'stable',
          confidence: 0.74,
          factors: ['Demanda estable', 'Competencia moderada', 'Ubicación conveniente'],
          area: 'Providencia',
          currentRent: 650000,
          lastUpdated: new Date(),
        },
      ];

      // Datos de predicción de ocupación
      const mockOccupancyData: OccupancyPrediction[] = [
        { month: 'Ene', predicted: 0.85, actual: 0.82, confidence: 0.87, factors: { seasonality: 0.8, marketTrend: 0.9, competition: 0.7, location: 0.9 } },
        { month: 'Feb', predicted: 0.88, actual: 0.85, confidence: 0.89, factors: { seasonality: 0.9, marketTrend: 0.9, competition: 0.7, location: 0.9 } },
        { month: 'Mar', predicted: 0.82, confidence: 0.85, factors: { seasonality: 0.7, marketTrend: 0.9, competition: 0.8, location: 0.9 } },
        { month: 'Abr', predicted: 0.78, confidence: 0.82, factors: { seasonality: 0.6, marketTrend: 0.8, competition: 0.8, location: 0.9 } },
        { month: 'May', predicted: 0.75, confidence: 0.79, factors: { seasonality: 0.5, marketTrend: 0.8, competition: 0.8, location: 0.9 } },
        { month: 'Jun', predicted: 0.80, confidence: 0.83, factors: { seasonality: 0.7, marketTrend: 0.8, competition: 0.7, location: 0.9 } },
      ];

      // Datos de optimización de precios
      const mockPriceOptimizations: PriceOptimization[] = [
        {
          propertyId: 'prop-001',
          currentPrice: 800000,
          recommendedPrice: 850000,
          potentialIncrease: 6.25,
          marketPosition: 'below',
          confidence: 0.87,
          factors: ['Precio 15% bajo el mercado', 'Alta demanda en el área', 'Mejoras recientes'],
        },
        {
          propertyId: 'prop-002',
          currentPrice: 650000,
          recommendedPrice: 680000,
          potentialIncrease: 4.62,
          marketPosition: 'average',
          confidence: 0.74,
          factors: ['Precio alineado con el mercado', 'Demanda estable', 'Competencia moderada'],
        },
      ];

      // Insights del mercado
      const mockMarketInsights: MarketInsight[] = [
        {
          area: 'Las Condes',
          trend: 'up',
          averagePrice: 850000,
          priceChange: 5.2,
          demand: 85,
          supply: 70,
          vacancyRate: 0.05,
          recommendation: 'Considerar aumentar precios gradualmente. Alta demanda y baja oferta.',
        },
        {
          area: 'Providencia',
          trend: 'stable',
          averagePrice: 750000,
          priceChange: 1.8,
          demand: 80,
          supply: 75,
          vacancyRate: 0.08,
          recommendation: 'Mantener precios actuales. Mercado equilibrado con competencia moderada.',
        },
      ];

      setPredictions(mockPredictions);
      setOccupancyData(mockOccupancyData);
      setPriceOptimizations(mockPriceOptimizations);
      setMarketInsights(mockMarketInsights);
    } catch (error) {
      logger.error('Error cargando datos predictivos:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    const Icon = TREND_ICONS[trend as keyof typeof TREND_ICONS] || Minus;
    return <Icon className="h-4 w-4" />;
  };

  const getTrendColor = (trend: string) => {
    return TREND_COLORS[trend as keyof typeof TREND_COLORS] || COLORS.neutral;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Analytics Predictivos
          </h2>
          <p className="text-muted-foreground">
            Análisis inteligente y predicciones del mercado inmobiliario
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as '30d' | '90d' | '180d' | '365d')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="90d">90 días</SelectItem>
              <SelectItem value="180d">180 días</SelectItem>
              <SelectItem value="365d">1 año</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={loadPredictiveData}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="occupancy">Ocupación</TabsTrigger>
          <TabsTrigger value="pricing">Precios</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Vista General */}
        <TabsContent value="overview" className="space-y-6">
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ocupación Predicha</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85.2%</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  +2.1% vs mes anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Renta Recomendada</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$850K</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  +6.3% optimización
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confianza IA</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Alta precisión
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tendencia Mercado</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  Alcista
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5.2%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Predicciones de Propiedades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Predicciones de Propiedades
              </CardTitle>
              <CardDescription>
                Análisis predictivo de ocupación y renta recomendada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <div key={prediction.propertyId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{prediction.area}</h4>
                        <p className="text-sm text-muted-foreground">
                          Ocupación: {Math.round(prediction.predictedOccupancy * 100)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(prediction.recommendedRent)}</div>
                      <div className="flex items-center gap-2 text-sm">
                        {getTrendIcon(prediction.marketTrend)}
                        <span style={{ color: getTrendColor(prediction.marketTrend) }}>
                          {prediction.marketTrend === 'bullish' ? 'Alcista' : 
                           prediction.marketTrend === 'bearish' ? 'Bajista' : 'Estable'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{Math.round(prediction.confidence * 100)}% confianza</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predicción de Ocupación */}
        <TabsContent value="occupancy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Predicción de Ocupación
              </CardTitle>
              <CardDescription>
                Proyección de ocupación para los próximos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Ocupación']}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke={COLORS.primary} 
                    strokeWidth={2}
                    name="Predicción"
                    dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke={COLORS.secondary} 
                    strokeWidth={2}
                    name="Real"
                    dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Factores de Influencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Factores de Influencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {occupancyData?.[0]?.factors && Object.entries(occupancyData[0].factors).map(([factor, value]) => (
                  <div key={factor} className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(value * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {factor.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimización de Precios */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Optimización de Precios
              </CardTitle>
              <CardDescription>
                Recomendaciones de precios basadas en análisis de mercado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priceOptimizations.map((optimization) => (
                  <div key={optimization.propertyId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Propiedad {optimization.propertyId}</h4>
                      <Badge 
                        variant={optimization.marketPosition === 'below' ? 'default' : 
                                optimization.marketPosition === 'average' ? 'secondary' : 'outline'}
                      >
                        {optimization.marketPosition === 'below' ? 'Bajo mercado' :
                         optimization.marketPosition === 'average' ? 'Promedio' : 'Sobre mercado'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Precio Actual</div>
                        <div className="text-lg font-medium">{formatCurrency(optimization.currentPrice)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Precio Recomendado</div>
                        <div className="text-lg font-medium text-primary">{formatCurrency(optimization.recommendedPrice)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Incremento Potencial</div>
                        <div className="text-lg font-medium text-green-600">
                          {formatPercentage(optimization.potentialIncrease)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Factores Clave:</div>
                      <div className="flex flex-wrap gap-2">
                        {optimization.factors.map((factor, index) => (
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

        {/* Insights del Mercado */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Insights del Mercado
              </CardTitle>
              <CardDescription>
                Análisis inteligente y recomendaciones por área
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketInsights.map((insight) => (
                  <div key={insight.area} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">{insight.area}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(insight.trend)}
                        <Badge 
                          variant={insight.trend === 'up' ? 'default' : 
                                  insight.trend === 'down' ? 'destructive' : 'secondary'}
                        >
                          {insight.trend === 'up' ? 'Alcista' : 
                           insight.trend === 'down' ? 'Bajista' : 'Estable'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Precio Promedio</div>
                        <div className="font-medium">{formatCurrency(insight.averagePrice)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Cambio Precio</div>
                        <div className={`font-medium ${insight.priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(insight.priceChange)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Demanda</div>
                        <div className="font-medium">{insight.demand}/100</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Vacancia</div>
                        <div className="font-medium">{(insight.vacancyRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="text-sm font-medium mb-1">Recomendación IA:</div>
                      <div className="text-sm text-muted-foreground">{insight.recommendation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
