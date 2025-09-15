'use client';

import { logger } from '@/lib/logger-edge';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Plus, 
  Store,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Download,
  RefreshCw,
  Target,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  View,
  Home,
  Briefcase,
  Info,
  X } from 'lucide-react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import { User } from '@/types';

interface Property {
  id: string;
  title: string;
  description: string;
  type: 'apartment' | 'house' | 'office' | 'commercial' | 'other';
  address: string;
  city: string;
  neighborhood: string;
  price: number;
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  bedrooms: number;
  bathrooms: number;
  area: number;
  features: string[];
  images: string[];
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  contractStart?: string;
  contractEnd?: string;
  monthlyRevenue: number;
  occupancyRate: number;
  totalRevenue: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  inquiries: number;
  featured: boolean;
}

interface ComparisonMetrics {
  pricePerSqm: number;
  roi: number;
  occupancyRate: number;
  monthlyRevenue: number;
  totalRevenue: number;
  daysOnMarket: number;
  inquiriesPerView: number;
  maintenanceScore: number;
  locationScore: number;
  overallScore: number;
}

interface Recommendation {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  properties: string[];
}

export default function OwnerPropertyComparison() {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [comparisonMetrics, setComparisonMetrics] = useState<{[key: string]: ComparisonMetrics}>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showRecommendations, setShowRecommendations] = useState(false);

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

    const loadProperties = async () => {
      try {
        // Mock properties data
        const mockProperties: Property[] = [
          {
            id: '1',
            title: 'Departamento Amoblado Centro',
            description: 'Hermoso departamento amoblado en el corazón de Santiago, cerca de todo',
            type: 'apartment',
            address: 'Av. Providencia 1234',
            city: 'Santiago',
            neighborhood: 'Providencia',
            price: 450000,
            status: 'rented',
            bedrooms: 2,
            bathrooms: 1,
            area: 65,
            features: ['Amoblado', 'Estacionamiento', 'Gimnasio', 'Piscina'],
            images: ['/placeholder1.jpg', '/placeholder2.jpg'],
            tenantName: 'Juan Pérez',
            tenantEmail: 'juan.perez@email.com',
            tenantPhone: '+56 9 1234 5678',
            contractStart: '2024-01-01',
            contractEnd: '2024-12-31',
            monthlyRevenue: 450000,
            occupancyRate: 95,
            totalRevenue: 5400000,
            lastMaintenance: '2024-01-15',
            nextMaintenance: '2024-07-15',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            views: 1250,
            inquiries: 45,
            featured: true,
          },
          {
            id: '2',
            title: 'Casa Las Condes',
            description: 'Espaciosa casa familiar en Las Condes con jardín y terraza',
            type: 'house',
            address: 'Calle El Alba 567',
            city: 'Santiago',
            neighborhood: 'Las Condes',
            price: 1200000,
            status: 'rented',
            bedrooms: 4,
            bathrooms: 3,
            area: 180,
            features: ['Jardín', 'Terraza', 'Estacionamiento 2 autos', 'Seguridad 24h'],
            images: ['/placeholder3.jpg', '/placeholder4.jpg'],
            tenantName: 'María García',
            tenantEmail: 'maria.garcia@empresa.cl',
            tenantPhone: '+56 9 8765 4321',
            contractStart: '2023-06-01',
            contractEnd: '2025-05-31',
            monthlyRevenue: 1200000,
            occupancyRate: 100,
            totalRevenue: 21600000,
            lastMaintenance: '2024-02-20',
            nextMaintenance: '2024-08-20',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            views: 890,
            inquiries: 23,
            featured: false,
          },
          {
            id: '3',
            title: 'Oficina Vitacura',
            description: 'Moderna oficina en Vitacura con excelente ubicación',
            type: 'office',
            address: 'Av. Kennedy 4567',
            city: 'Santiago',
            neighborhood: 'Vitacura',
            price: 800000,
            status: 'available',
            bedrooms: 0,
            bathrooms: 2,
            area: 120,
            features: ['Aire acondicionado', 'Estacionamiento', 'Recepción', 'Seguridad'],
            images: ['/placeholder5.jpg', '/placeholder6.jpg'],
            monthlyRevenue: 0,
            occupancyRate: 0,
            totalRevenue: 0,
            lastMaintenance: '2024-03-10',
            nextMaintenance: '2024-09-10',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            views: 567,
            inquiries: 12,
            featured: true,
          },
          {
            id: '4',
            title: 'Local Comercial',
            description: 'Local comercial en zona de alto tráfico',
            type: 'commercial',
            address: 'Av. Apoquindo 6789',
            city: 'Santiago',
            neighborhood: 'Las Condes',
            price: 1500000,
            status: 'rented',
            bedrooms: 0,
            bathrooms: 1,
            area: 200,
            features: ['Vidrio frontal', 'Alarma', 'Estacionamiento clientes', 'Zona de carga'],
            images: ['/placeholder7.jpg', '/placeholder8.jpg'],
            tenantName: 'Roberto López',
            tenantEmail: 'roberto.lopez@negocio.cl',
            tenantPhone: '+56 9 3456 7890',
            contractStart: '2024-02-01',
            contractEnd: '2026-01-31',
            monthlyRevenue: 1500000,
            occupancyRate: 98,
            totalRevenue: 18000000,
            lastMaintenance: '2024-01-05',
            nextMaintenance: '2024-07-05',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            views: 445,
            inquiries: 8,
            featured: false,
          },
          {
            id: '5',
            title: 'Departamento Playa',
            description: 'Departamento con vista al mar en Viña del Mar',
            type: 'apartment',
            address: 'Av. Costanera 890',
            city: 'Viña del Mar',
            neighborhood: 'Reñaca',
            price: 600000,
            status: 'maintenance',
            bedrooms: 3,
            bathrooms: 2,
            area: 95,
            features: ['Vista al mar', 'Balcón', 'Piscina edificio', 'Gimnasio'],
            images: ['/placeholder9.jpg', '/placeholder10.jpg'],
            monthlyRevenue: 0,
            occupancyRate: 0,
            totalRevenue: 3600000,
            lastMaintenance: '2024-04-01',
            nextMaintenance: '2024-10-01',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 250).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            views: 1100,
            inquiries: 34,
            featured: true,
          },
          {
            id: '6',
            title: 'Casa Familiar La Reina',
            description: 'Acogedora casa familiar en La Reina',
            type: 'house',
            address: 'Calle Los Leones 345',
            city: 'Santiago',
            neighborhood: 'La Reina',
            price: 900000,
            status: 'available',
            bedrooms: 3,
            bathrooms: 2,
            area: 150,
            features: ['Patio', 'Estacionamiento', 'Calefacción', 'Bodega'],
            images: ['/placeholder11.jpg', '/placeholder12.jpg'],
            monthlyRevenue: 0,
            occupancyRate: 0,
            totalRevenue: 0,
            lastMaintenance: '2024-03-15',
            nextMaintenance: '2024-09-15',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            views: 780,
            inquiries: 19,
            featured: false,
          },
        ];

        setProperties(mockProperties);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading properties:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedProperties.length > 0) {
      calculateComparisonMetrics();
      generateRecommendations();
    }
  }, [selectedProperties]);

  const calculateComparisonMetrics = () => {
    const metrics: {[key: string]: ComparisonMetrics} = {};
    
    selectedProperties.forEach(property => {
      const pricePerSqm = property.price / property.area;
      const roi = property.totalRevenue > 0 ? (property.totalRevenue / property.price) * 100 : 0;
      const daysOnMarket = Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const inquiriesPerView = property.views > 0 ? property.inquiries / property.views : 0;
      
      // Calculate maintenance score (based on time since last maintenance)
      const lastMaintenance = property.lastMaintenance ? new Date(property.lastMaintenance) : new Date(0);
      const daysSinceMaintenance = Math.floor((Date.now() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24));
      const maintenanceScore = Math.max(0, 100 - (daysSinceMaintenance / 365) * 20);
      
      // Calculate location score (based on neighborhood - simplified)
      const locationScores: {[key: string]: number} = {
        'Providencia': 90,
        'Las Condes': 95,
        'Vitacura': 98,
        'La Reina': 85,
        'Reñaca': 88,
      };
      const locationScore = locationScores[property.neighborhood] || 75;
      
      // Calculate overall score
      const overallScore = (
        (roi * 0.3) +
        (property.occupancyRate * 0.25) +
        (maintenanceScore * 0.2) +
        (locationScore * 0.15) +
        (inquiriesPerView * 100 * 0.1)
      );

      metrics[property.id] = {
        pricePerSqm,
        roi,
        occupancyRate: property.occupancyRate,
        monthlyRevenue: property.monthlyRevenue,
        totalRevenue: property.totalRevenue,
        daysOnMarket,
        inquiriesPerView,
        maintenanceScore,
        locationScore,
        overallScore,
      };
    });

    setComparisonMetrics(metrics);
  };

  const generateRecommendations = () => {
    const recs: Recommendation[] = [];
    
    if (selectedProperties.length >= 2) {
      // Find best performing property
      const bestProperty = selectedProperties.reduce((best, current) => {
        const currentScore = comparisonMetrics[current.id]?.overallScore || 0;
        const bestScore = comparisonMetrics[best.id]?.overallScore || 0;
        return currentScore > bestScore ? current : best;
      });
      
      recs.push({
        type: 'strength',
        title: 'Mejor Rendimiento',
        description: `${bestProperty.title} tiene el mejor rendimiento general con un puntaje de ${comparisonMetrics[bestProperty.id]?.overallScore.toFixed(1)}/100`,
        impact: 'high',
        properties: [bestProperty.id],
      });

      // Find properties with low occupancy
      const lowOccupancy = selectedProperties.filter(p => p.occupancyRate < 50);
      if (lowOccupancy.length > 0) {
        recs.push({
          type: 'weakness',
          title: 'Baja Ocupación',
          description: `${lowOccupancy.map(p => p.title).join(', ')} tienen tasas de ocupación inferiores al 50%`,
          impact: 'medium',
          properties: lowOccupancy.map(p => p.id),
        });
      }

      // Find properties with high ROI
      const highRoi = selectedProperties.filter(p => comparisonMetrics[p.id]?.roi > 50);
      if (highRoi.length > 0) {
        recs.push({
          type: 'opportunity',
          title: 'Alto Retorno de Inversión',
          description: `${highRoi.map(p => p.title).join(', ')} muestran un ROI superior al 50%`,
          impact: 'high',
          properties: highRoi.map(p => p.id),
        });
      }

      // Find properties needing maintenance
      const needsMaintenance = selectedProperties.filter(p => {
        const lastMaintenance = p.lastMaintenance ? new Date(p.lastMaintenance) : new Date(0);
        const daysSinceMaintenance = Math.floor((Date.now() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceMaintenance > 180;
      });
      
      if (needsMaintenance.length > 0) {
        recs.push({
          type: 'threat',
          title: 'Mantenimiento Requerido',
          description: `${needsMaintenance.map(p => p.title).join(', ')} requieren mantenimiento urgente`,
          impact: 'medium',
          properties: needsMaintenance.map(p => p.id),
        });
      }
    }

    setRecommendations(recs);
  };

  const addPropertyToComparison = (property: Property) => {
    if (selectedProperties.length < 4 && !selectedProperties.find(p => p.id === property.id)) {
      setSelectedProperties(prev => [...prev, property]);
    }
  };

  const removePropertyFromComparison = (propertyId: string) => {
    setSelectedProperties(prev => prev.filter(p => p.id !== propertyId));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'apartment':
        return <Building className="w-5 h-5" />;
      case 'house':
        return <Home className="w-5 h-5" />;
      case 'office':
        return <Briefcase className="w-5 h-5" />;
      case 'commercial':
        return <Store className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'apartment':
        return 'Departamento';
      case 'house':
        return 'Casa';
      case 'office':
        return 'Oficina';
      case 'commercial':
        return 'Comercial';
      default:
        return 'Otro';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'rented':
        return <Badge className="bg-blue-100 text-blue-800">Arrendado</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Mantenimiento</Badge>;
      case 'unavailable':
        return <Badge className="bg-red-100 text-red-800">No disponible</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
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

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <ThumbsUp className="w-5 h-5 text-green-600" />;
      case 'weakness':
        return <ThumbsDown className="w-5 h-5 text-red-600" />;
      case 'opportunity':
        return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      case 'threat':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'border-green-200 bg-green-50';
      case 'weakness':
        return 'border-red-200 bg-red-50';
      case 'opportunity':
        return 'border-yellow-200 bg-yellow-50';
      case 'threat':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando herramientas de comparación...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Comparación de Propiedades"
      subtitle="Herramienta avanzada para analizar y comparar tus propiedades"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comparación de Propiedades</h1>
            <p className="text-gray-600">Analiza y compara el rendimiento de tus propiedades</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'table' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Tabla
            </Button>
            <Button 
              variant={viewMode === 'cards' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              <View className="w-4 h-4 mr-2" />
              Tarjetas
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Recomendaciones
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Selected Properties */}
        {selectedProperties.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Propiedades Seleccionadas ({selectedProperties.length}/4)
              </CardTitle>
              <CardDescription>
                Selecciona hasta 4 propiedades para compararlas detalladamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                {selectedProperties.map(property => (
                  <div key={property.id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    {getTypeIcon(property.type)}
                    <div>
                      <p className="font-medium text-sm">{property.title}</p>
                      <p className="text-xs text-gray-600">{property.neighborhood}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removePropertyFromComparison(property.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {selectedProperties.length >= 2 && (
                <div className="flex gap-2">
                  <Button onClick={() => calculateComparisonMetrics()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar Análisis
                  </Button>
                  <Button variant="outline" onClick={() => generateRecommendations()}>
                    <Target className="w-4 h-4 mr-2" />
                    Generar Recomendaciones
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {showRecommendations && recommendations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Recomendaciones Inteligentes
              </CardTitle>
              <CardDescription>
                Análisis basado en el rendimiento comparativo de tus propiedades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getRecommendationColor(rec.type)}`}>
                    <div className="flex items-start gap-3">
                      {getRecommendationIcon(rec.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{rec.title}</h3>
                          <Badge className={
                            rec.impact === 'high' ? 'bg-red-100 text-red-800' :
                            rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {rec.impact === 'high' ? 'Alto Impacto' :
                             rec.impact === 'medium' ? 'Impacto Medio' :
                             'Bajo Impacto'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Table */}
        {selectedProperties.length >= 2 && viewMode === 'table' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Análisis Comparativo Detallado</CardTitle>
              <CardDescription>
                Métricas clave y rendimiento de las propiedades seleccionadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Métrica</th>
                      {selectedProperties.map(property => (
                        <th key={property.id} className="text-center p-3 font-medium">
                          {property.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Precio</td>
                      {selectedProperties.map(property => (
                        <td key={property.id} className="text-center p-3">
                          {formatPrice(property.price)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Precio por m²</td>
                      {selectedProperties.map(property => (
                        <td key={property.id} className="text-center p-3">
                          {formatPrice(comparisonMetrics[property.id]?.pricePerSqm || 0)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">ROI</td>
                      {selectedProperties.map(property => (
                        <td key={property.id} className="text-center p-3">
                          <span className={`font-medium ${
                            (comparisonMetrics[property.id]?.roi || 0) > 50 ? 'text-green-600' :
                            (comparisonMetrics[property.id]?.roi || 0) > 20 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {formatPercentage(comparisonMetrics[property.id]?.roi || 0)}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Tasa de Ocupación</td>
                      {selectedProperties.map(property => (
                        <td key={property.id} className="text-center p-3">
                          <span className={`font-medium ${
                            property.occupancyRate > 80 ? 'text-green-600' :
                            property.occupancyRate > 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {formatPercentage(property.occupancyRate)}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Ingreso Mensual</td>
                      {selectedProperties.map(property => (
                        <td key={property.id} className="text-center p-3">
                          {formatPrice(property.monthlyRevenue)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Ingreso Total</td>
                      {selectedProperties.map(property => (
                        <td key={property.id} className="text-center p-3">
                          {formatPrice(property.totalRevenue)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Días en Mercado</td>
                      {selectedProperties.map(property => (
                        <td key={property.id} className="text-center p-3">
                          {comparisonMetrics[property.id]?.daysOnMarket || 0}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Puntaje General</td>
                      {selectedProperties.map(property => (
                        <td key={property.id} className="text-center p-3">
                          <span className={`font-bold ${
                            (comparisonMetrics[property.id]?.overallScore || 0) > 80 ? 'text-green-600' :
                            (comparisonMetrics[property.id]?.overallScore || 0) > 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {comparisonMetrics[property.id]?.overallScore.toFixed(1)}/100
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Propiedades para Comparar</CardTitle>
            <CardDescription>
              Elige hasta 4 propiedades para realizar un análisis comparativo detallado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(property => (
                <Card key={property.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(property.type)}
                        <div>
                          <h3 className="font-semibold text-sm">{property.title}</h3>
                          <p className="text-xs text-gray-600">{property.neighborhood}</p>
                        </div>
                      </div>
                      {getStatusBadge(property.status)}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Precio:</span>
                        <span className="font-medium">{formatPrice(property.price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Superficie:</span>
                        <span className="font-medium">{property.area} m²</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ocupación:</span>
                        <span className={`font-medium ${
                          property.occupancyRate > 80 ? 'text-green-600' :
                          property.occupancyRate > 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {formatPercentage(property.occupancyRate)}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      size="sm"
                      disabled={!!selectedProperties.find(p => p.id === property.id) || selectedProperties.length >= 4}
                      onClick={() => addPropertyToComparison(property)}
                    >
                      {selectedProperties.find(p => p.id === property.id) ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Seleccionado
                        </>
                      ) : selectedProperties.length >= 4 ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Límite Alcanzado
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar a Comparación
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </EnhancedDashboardLayout>
  );
}
