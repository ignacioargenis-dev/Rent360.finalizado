'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Home,
  MapPin,
  Star,
  CheckCircle,
  AlertCircle,
  Eye,
  FileText,
} from 'lucide-react';
import { User } from '@/types';

interface Property {
  id: string;
  title: string;
  address: string;
  type: string;
  price: number;
  rentPrice: number;
  occupancyRate: number;
  maintenanceCost: number;
  tenantCount: number;
  rating: number;
  status: 'occupied' | 'vacant' | 'maintenance';
  monthlyRevenue: number;
  monthlyExpenses: number;
  netIncome: number;
  roi: number;
}

interface ComparisonMetric {
  label: string;
  key: keyof Property;
  format: 'currency' | 'percentage' | 'number' | 'rating';
  icon: React.ReactNode;
}

export default function OwnerPropertyComparisonPage() {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const handleExportComparison = () => {
    if (selectedProperties.length === 0) {
      setSuccessMessage('Selecciona al menos una propiedad para comparar');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    try {
      // Generate CSV comparison
      const comparisonData = selectedProperties.map(property => ({
        Dirección: property.address,
        Tipo: property.type,
        Precio: property.price,
        'Precio Renta': property.rentPrice,
        Estado: property.status,
        'Tasa Ocupación': property.occupancyRate,
        Inquilinos: property.tenantCount,
        Rating: property.rating,
        'Ingresos Mensuales': property.monthlyRevenue,
        'Gastos Mensuales': property.monthlyExpenses,
        ROI: property.roi,
      }));

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'Dirección,Tipo,Habitaciones,Baños,Superficie,Precio,Estado,Ocupación,Ingresos Mensuales\n' +
        comparisonData.map(row => Object.values(row).join(',')).join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `comparacion_propiedades_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage('Comparación de propiedades exportada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setSuccessMessage('Error al exportar la comparación');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

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

    const loadPropertiesData = async () => {
      try {
        // Mock properties data
        const mockProperties: Property[] = [
          {
            id: 'p1',
            title: 'Apartamento Centro',
            address: 'Av. Providencia 1234, Providencia',
            type: 'Apartamento',
            price: 150000000,
            rentPrice: 850000,
            occupancyRate: 95,
            maintenanceCost: 45000,
            tenantCount: 1,
            rating: 4.5,
            status: 'occupied',
            monthlyRevenue: 850000,
            monthlyExpenses: 120000,
            netIncome: 730000,
            roi: 5.8,
          },
          {
            id: 'p2',
            title: 'Casa Los Dominicos',
            address: 'Calle Los Militares 567, Las Condes',
            type: 'Casa',
            price: 280000000,
            rentPrice: 1200000,
            occupancyRate: 88,
            maintenanceCost: 85000,
            tenantCount: 1,
            rating: 4.7,
            status: 'occupied',
            monthlyRevenue: 1200000,
            monthlyExpenses: 180000,
            netIncome: 1020000,
            roi: 4.4,
          },
          {
            id: 'p3',
            title: 'Oficina Las Condes',
            address: 'Av. Apoquindo 3456, Las Condes',
            type: 'Oficina',
            price: 200000000,
            rentPrice: 950000,
            occupancyRate: 75,
            maintenanceCost: 65000,
            tenantCount: 1,
            rating: 4.2,
            status: 'occupied',
            monthlyRevenue: 950000,
            monthlyExpenses: 140000,
            netIncome: 810000,
            roi: 4.9,
          },
          {
            id: 'p4',
            title: 'Local Vitacura',
            address: 'Pasaje Los Alpes 890, Vitacura',
            type: 'Local Comercial',
            price: 180000000,
            rentPrice: 750000,
            occupancyRate: 60,
            maintenanceCost: 35000,
            tenantCount: 1,
            rating: 3.8,
            status: 'vacant',
            monthlyRevenue: 0,
            monthlyExpenses: 80000,
            netIncome: -80000,
            roi: -0.5,
          },
          {
            id: 'p5',
            title: 'Bodega Industrial',
            address: 'Av. Los Pajaritos 123, Pudahuel',
            type: 'Bodega',
            price: 120000000,
            rentPrice: 400000,
            occupancyRate: 100,
            maintenanceCost: 25000,
            tenantCount: 1,
            rating: 4.0,
            status: 'occupied',
            monthlyRevenue: 400000,
            monthlyExpenses: 50000,
            netIncome: 350000,
            roi: 3.5,
          },
        ];

        setProperties(mockProperties);
        // Select first 3 properties for comparison by default
        setSelectedProperties(mockProperties.slice(0, 3));
        setLoading(false);
      } catch (error) {
        logger.error('Error loading properties data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadPropertiesData();
  }, []);

  const handlePropertyToggle = (property: Property) => {
    setSelectedProperties(prev => {
      const isSelected = prev.find(p => p.id === property.id);
      if (isSelected) {
        return prev.filter(p => p.id !== property.id);
      } else if (prev.length < 4) {
        return [...prev, property];
      }
      return prev;
    });
  };

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'rating':
        return value.toFixed(1);
      default:
        return value.toLocaleString('es-CL');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied':
        return <Badge className="bg-green-100 text-green-800">Ocupado</Badge>;
      case 'vacant':
        return <Badge className="bg-red-100 text-red-800">Vacante</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Mantenimiento</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const comparisonMetrics: ComparisonMetric[] = [
    {
      label: 'Precio de Compra',
      key: 'price',
      format: 'currency',
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      label: 'Precio de Arriendo',
      key: 'rentPrice',
      format: 'currency',
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      label: 'Tasa de Ocupación',
      key: 'occupancyRate',
      format: 'percentage',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      label: 'Costo Mantenimiento',
      key: 'maintenanceCost',
      format: 'currency',
      icon: <AlertCircle className="w-4 h-4" />,
    },
    {
      label: 'Ingreso Mensual',
      key: 'monthlyRevenue',
      format: 'currency',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      label: 'Gastos Mensuales',
      key: 'monthlyExpenses',
      format: 'currency',
      icon: <TrendingDown className="w-4 h-4" />,
    },
    {
      label: 'Ingreso Neto',
      key: 'netIncome',
      format: 'currency',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      label: 'ROI Anual',
      key: 'roi',
      format: 'percentage',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      label: 'Rating Promedio',
      key: 'rating',
      format: 'rating',
      icon: <Star className="w-4 h-4" />,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando comparación de propiedades...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Comparación de Propiedades"
      subtitle="Analiza y compara el rendimiento de tus propiedades"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comparación de Propiedades</h1>
            <p className="text-gray-600">
              Compara métricas clave entre tus propiedades para optimizar tu inversión
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportComparison}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar Comparación
            </Button>
          </div>
        </div>

        {/* Property Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seleccionar Propiedades a Comparar</CardTitle>
            <CardDescription>Elige hasta 4 propiedades para comparar sus métricas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map(property => (
                <div
                  key={property.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedProperties.find(p => p.id === property.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePropertyToggle(property)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{property.title}</h4>
                    {selectedProperties.find(p => p.id === property.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{property.address}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{property.type}</span>
                    {getStatusBadge(property.status)}
                  </div>
                  <div className="mt-2">{renderStars(property.rating)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        {selectedProperties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Comparación Detallada</CardTitle>
              <CardDescription>
                Métricas clave comparadas entre las propiedades seleccionadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Métrica</th>
                      {selectedProperties.map(property => (
                        <th
                          key={property.id}
                          className="text-center py-3 px-4 font-medium text-gray-900 min-w-[150px]"
                        >
                          {property.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonMetrics.map(metric => (
                      <tr key={metric.key} className="border-b border-gray-100">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="text-gray-500">{metric.icon}</div>
                            <span className="font-medium text-gray-900">{metric.label}</span>
                          </div>
                        </td>
                        {selectedProperties.map(property => {
                          const value = property[metric.key] as number;
                          const formattedValue = formatValue(value, metric.format);

                          let valueColor = 'text-gray-900';
                          if (metric.key === 'netIncome') {
                            valueColor = value > 0 ? 'text-green-600' : 'text-red-600';
                          } else if (metric.key === 'roi') {
                            valueColor =
                              value > 5
                                ? 'text-green-600'
                                : value > 3
                                  ? 'text-yellow-600'
                                  : 'text-red-600';
                          } else if (metric.key === 'occupancyRate') {
                            valueColor =
                              value > 90
                                ? 'text-green-600'
                                : value > 70
                                  ? 'text-yellow-600'
                                  : 'text-red-600';
                          }

                          return (
                            <td key={property.id} className="text-center py-4 px-4">
                              <span className={`font-medium ${valueColor}`}>{formattedValue}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {selectedProperties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingreso Neto Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatValue(
                        selectedProperties.reduce((sum, p) => sum + p.netIncome, 0),
                        'currency'
                      )}
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
                    <p className="text-sm font-medium text-gray-600">ROI Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatValue(
                        selectedProperties.reduce((sum, p) => sum + p.roi, 0) /
                          selectedProperties.length,
                        'percentage'
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ocupación Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatValue(
                        selectedProperties.reduce((sum, p) => sum + p.occupancyRate, 0) /
                          selectedProperties.length,
                        'percentage'
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedProperties.length === 0 && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona propiedades para comparar
              </h3>
              <p className="text-gray-600">
                Elige al menos una propiedad de la lista superior para ver la comparación de
                métricas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
