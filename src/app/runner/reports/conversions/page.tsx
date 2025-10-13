'use client';

import { logger } from '@/lib/logger-minimal';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Award,
  Download,
  Home,
  Star,
} from 'lucide-react';
import { User } from '@/types';

interface ConversionData {
  month: string;
  visits: number;
  conversions: number;
  conversionRate: number;
  earnings: number;
}

interface PropertyConversion {
  id: string;
  title: string;
  address: string;
  totalVisits: number;
  conversions: number;
  conversionRate: number;
  averageRating: number;
  totalEarnings: number;
}

interface TopClient {
  name: string;
  phone: string;
  visits: number;
  conversions: number;
  conversionRate: number;
  totalSpent: number;
  lastVisit: string;
}

export default function RunnerConversionsReport() {

  const [user, setUser] = useState<User | null>(null);

  const [conversionData, setConversionData] = useState<ConversionData[]>([]);

  const [propertyConversions, setPropertyConversions] = useState<PropertyConversion[]>([]);

  const [topClients, setTopClients] = useState<TopClient[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data
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

    // Load conversions data
    const loadConversionsData = async () => {
      try {
        // Mock data for demonstration
        const mockConversionData: ConversionData[] = [
          { month: 'Ene', visits: 45, conversions: 35, conversionRate: 77.8, earnings: 680000 },
          { month: 'Feb', visits: 52, conversions: 41, conversionRate: 78.8, earnings: 750000 },
          { month: 'Mar', visits: 48, conversions: 38, conversionRate: 79.2, earnings: 720000 },
          { month: 'Abr', visits: 55, conversions: 43, conversionRate: 78.2, earnings: 820000 },
          { month: 'May', visits: 58, conversions: 46, conversionRate: 79.3, earnings: 880000 },
          { month: 'Jun', visits: 62, conversions: 49, conversionRate: 79.0, earnings: 950000 },
        ];

        const mockPropertyConversions: PropertyConversion[] = [
          {
            id: '1',
            title: 'Departamento Moderno Providencia',
            address: 'Av. Providencia 1234, Providencia',
            totalVisits: 15,
            conversions: 12,
            conversionRate: 80.0,
            averageRating: 4.8,
            totalEarnings: 225000,
          },
          {
            id: '2',
            title: 'Casa Familiar Las Condes',
            address: 'El Alba 456, Las Condes',
            totalVisits: 12,
            conversions: 10,
            conversionRate: 83.3,
            averageRating: 4.9,
            totalEarnings: 200000,
          },
          {
            id: '3',
            title: 'Studio Amoblado Ñuñoa',
            address: 'Irarrázaval 789, Ñuñoa',
            totalVisits: 18,
            conversions: 14,
            conversionRate: 77.8,
            averageRating: 4.6,
            totalEarnings: 280000,
          },
          {
            id: '4',
            title: 'Departamento Céntrico Santiago',
            address: 'Ahumada 234, Santiago',
            totalVisits: 8,
            conversions: 6,
            conversionRate: 75.0,
            averageRating: 4.5,
            totalEarnings: 120000,
          },
        ];

        const mockTopClients: TopClient[] = [
          {
            name: 'María González',
            phone: '+56 9 1234 5678',
            visits: 3,
            conversions: 2,
            conversionRate: 66.7,
            totalSpent: 35000,
            lastVisit: '2024-01-15T10:00:00',
          },
          {
            name: 'Juan Pérez',
            phone: '+56 9 2345 6789',
            visits: 2,
            conversions: 2,
            conversionRate: 100.0,
            totalSpent: 40000,
            lastVisit: '2024-01-14T15:30:00',
          },
          {
            name: 'Ana Martínez',
            phone: '+56 9 3456 7890',
            visits: 4,
            conversions: 3,
            conversionRate: 75.0,
            totalSpent: 55000,
            lastVisit: '2024-01-16T11:00:00',
          },
        ];

        setConversionData(mockConversionData);
        setPropertyConversions(mockPropertyConversions);
        setTopClients(mockTopClients);
      } catch (error) {
        logger.error('Error loading conversions data:', { error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    loadConversionsData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getConversionRateColor = (rate: number) => {
    if (rate >= 80) {
return 'text-green-600';
}
    if (rate >= 70) {
return 'text-yellow-600';
}
    return 'text-red-600';
  };

  const getConversionRateBadge = (rate: number) => {
    if (rate >= 80) {
return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
}
    if (rate >= 70) {
return <Badge className="bg-yellow-100 text-yellow-800">Bueno</Badge>;
}
    return <Badge className="bg-red-100 text-red-800">Mejorable</Badge>;
  };

  const getTotalStats = () => {
    const totalVisits = conversionData.reduce((sum, data) => sum + data.visits, 0);
    const totalConversions = conversionData.reduce((sum, data) => sum + data.conversions, 0);
    const totalEarnings = conversionData.reduce((sum, data) => sum + data.earnings, 0);
    const avgConversionRate = totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0;

    return {
      totalVisits,
      totalConversions,
      totalEarnings,
      avgConversionRate,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reporte de conversiones...</p>
        </div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reporte de Conversiones</h1>
        <p className="text-gray-600">Análisis detallado de tu tasa de conversión y rendimiento</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalVisits}</div>
              <div className="text-sm text-gray-600">Total Visitas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.totalConversions}</div>
              <div className="text-sm text-gray-600">Total Conversiones</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getConversionRateColor(stats.avgConversionRate)}`}>
                {stats.avgConversionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Tasa de Conversión</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{formatPrice(stats.totalEarnings)}</div>
              <div className="text-sm text-gray-600">Ganancias Totales</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="properties">Propiedades</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Evolución Mensual
                </CardTitle>
                <CardDescription>Tu tasa de conversión por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversionData.map((data) => (
                    <div key={data.month} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{data.month}</h4>
                        <p className="text-sm text-gray-600">{data.visits} visitas</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getConversionRateColor(data.conversionRate)}`}>
                          {data.conversionRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">{data.conversions} conversiones</p>
                        <p className="text-sm text-green-600">{formatPrice(data.earnings)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Métricas Clave
                </CardTitle>
                <CardDescription>Indicadores de rendimiento importantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">Conversiones Exitosas</h4>
                        <p className="text-sm text-gray-600">Visitas que resultaron en arriendo</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{stats.totalConversions}</p>
                      <p className="text-sm text-gray-600">total</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-yellow-600" />
                      <div>
                        <h4 className="font-medium">Tasa Promedio</h4>
                        <p className="text-sm text-gray-600">Rendimiento general</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getConversionRateColor(stats.avgConversionRate)}`}>
                        {stats.avgConversionRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">promedio</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <div>
                        <h4 className="font-medium">Ingresos por Conversión</h4>
                        <p className="text-sm text-gray-600">Promedio por conversión</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.totalConversions > 0 ? formatPrice(stats.totalEarnings / stats.totalConversions) : formatPrice(0)}
                      </p>
                      <p className="text-sm text-gray-600">promedio</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Rendimiento por Propiedad
              </CardTitle>
              <CardDescription>Análisis de conversiones por propiedad visitada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyConversions.map((property) => (
                  <div key={property.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{property.title}</h3>
                        <p className="text-sm text-gray-600">{property.address}</p>
                      </div>
                      {getConversionRateBadge(property.conversionRate)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Visitas</p>
                        <p className="font-semibold">{property.totalVisits}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Conversiones</p>
                        <p className="font-semibold text-green-600">{property.conversions}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tasa</p>
                        <p className={`font-semibold ${getConversionRateColor(property.conversionRate)}`}>
                          {property.conversionRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Ganancias</p>
                        <p className="font-semibold text-purple-600">{formatPrice(property.totalEarnings)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3 text-sm">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Calificación promedio: {property.averageRating}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Mejores Clientes
              </CardTitle>
              <CardDescription>Clientes con mayor tasa de conversión y gasto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        <p className="text-sm text-gray-600">{client.phone}</p>
                        <p className="text-sm text-gray-500">Última visita: {formatDateTime(client.lastVisit)}</p>
                      </div>
                      {getConversionRateBadge(client.conversionRate)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Visitas</p>
                        <p className="font-semibold">{client.visits}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Conversiones</p>
                        <p className="font-semibold text-green-600">{client.conversions}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tasa</p>
                        <p className={`font-semibold ${getConversionRateColor(client.conversionRate)}`}>
                          {client.conversionRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Gasto Total</p>
                        <p className="font-semibold text-purple-600">{formatPrice(client.totalSpent)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Análisis de Tendencias
              </CardTitle>
              <CardDescription>Patrones y tendencias en tus conversiones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">Tendencia de Conversión</h4>
                  <div className="space-y-2">
                    {conversionData.map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <span className="text-sm">{data.month}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${data.conversionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{data.conversionRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-4">Resumen de Desempeño</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Mejor Mes</p>
                      <p className="text-lg font-bold text-green-900">
                        {conversionData.reduce((best, current) => 
                          current.conversionRate > best.conversionRate ? current : best,
                        ).month}
                      </p>
                      <p className="text-sm text-green-700">
                        {conversionData.reduce((best, current) => 
                          current.conversionRate > best.conversionRate ? current : best,
                        ).conversionRate.toFixed(1)}% conversión
                      </p>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Mes Más Productivo</p>
                      <p className="text-lg font-bold text-blue-900">
                        {conversionData.reduce((best, current) => 
                          current.earnings > best.earnings ? current : best,
                        ).month}
                      </p>
                      <p className="text-sm text-blue-700">
                        {formatPrice(conversionData.reduce((best, current) => 
                          current.earnings > best.earnings ? current : best,
                        ).earnings)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Reporte Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
