'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
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
  RefreshCw,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Settings,
  Plus,
  TrendingUp,
  Users,
  Star,
} from 'lucide-react';
import { User } from '@/types';

interface RecurringService {
  id: string;
  name: string;
  description: string;
  category: 'maintenance' | 'cleaning' | 'security' | 'utilities' | 'other';
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  price: number;
  status: 'active' | 'paused' | 'cancelled' | 'pending';
  nextServiceDate: string;
  lastServiceDate?: string;
  providerName: string;
  contractStart: string;
  contractEnd?: string;
  autoRenewal: boolean;
  rating?: number;
}

interface ServiceStats {
  activeServices: number;
  totalSpent: number;
  upcomingServices: number;
  averageRating: number;
  savingsPercentage: number;
}

export default function ClientRecurringServicesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<RecurringService[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    activeServices: 0,
    totalSpent: 0,
    upcomingServices: 0,
    averageRating: 0,
    savingsPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleConfigureServices = () => {
    setSuccessMessage('Configuración de servicios aplicada correctamente');
    setTimeout(() => setSuccessMessage(''), 3000);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleNewService = () => {
    router.push('/services/request');
  };

  const handleServiceDetails = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const details = `
Servicio: ${service.name}
Descripción: ${service.description}
Categoría: ${service.category}
Proveedor: ${service.providerName}
Frecuencia: ${service.frequency}
Estado: ${service.status}
Próxima ejecución: ${service.nextServiceDate}
Última ejecución: ${service.lastServiceDate || 'No disponible'}
Costo: ${formatCurrency(service.price)}
      `.trim();

      alert(`Detalles del Servicio:\n\n${details}`);
    } else {
      setErrorMessage('Servicio no encontrado');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleModifyService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const newFrequency = prompt(
        'Nueva frecuencia (weekly/monthly/quarterly/yearly):',
        service.frequency
      );
      if (newFrequency && ['weekly', 'monthly', 'quarterly', 'yearly'].includes(newFrequency)) {
        // In a real app, this would make an API call to update the service
        setSuccessMessage(`Frecuencia del servicio ${service.name} actualizada a ${newFrequency}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (newFrequency) {
        setErrorMessage('Frecuencia no válida. Use: weekly, monthly, quarterly o yearly');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } else {
      setErrorMessage('Servicio no encontrado');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleCancelService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const confirmCancel = confirm(
        `¿Estás seguro de que deseas cancelar el servicio "${service.name}"?\n\nEsta acción no se puede deshacer.`
      );
      if (confirmCancel) {
        // In a real app, this would make an API call to cancel the service
        setServices(prev =>
          prev.map(s => (s.id === serviceId ? { ...s, status: 'cancelled' } : s))
        );
        setSuccessMessage(`Servicio "${service.name}" cancelado exitosamente`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } else {
      setErrorMessage('Servicio no encontrado');
      setTimeout(() => setErrorMessage(''), 3000);
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

    const loadServicesData = async () => {
      try {
        // Mock recurring services data
        const mockServices: RecurringService[] = [
          {
            id: 's1',
            name: 'Limpieza General',
            description: 'Servicio completo de limpieza para apartamento',
            category: 'cleaning',
            frequency: 'weekly',
            price: 45000,
            status: 'active',
            nextServiceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
            lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
            providerName: 'Limpieza Express',
            contractStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
            autoRenewal: true,
            rating: 4.5,
          },
          {
            id: 's2',
            name: 'Mantenimiento Jardín',
            description: 'Cuidado y mantenimiento del jardín exterior',
            category: 'maintenance',
            frequency: 'biweekly',
            price: 35000,
            status: 'active',
            nextServiceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
            lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            providerName: 'Jardinería Verde',
            contractStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
            autoRenewal: true,
            rating: 4.2,
          },
          {
            id: 's3',
            name: 'Servicio de Vigilancia',
            description: 'Monitoreo de seguridad 24/7',
            category: 'security',
            frequency: 'monthly',
            price: 120000,
            status: 'active',
            nextServiceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
            lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
            providerName: 'Seguridad Total',
            contractStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
            contractEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 275).toISOString(),
            autoRenewal: false,
            rating: 4.8,
          },
          {
            id: 's4',
            name: 'Mantenimiento Piscina',
            description: 'Limpieza y mantenimiento de piscina',
            category: 'maintenance',
            frequency: 'weekly',
            price: 55000,
            status: 'paused',
            nextServiceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
            lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
            providerName: 'Aqua Service',
            contractStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
            autoRenewal: true,
            rating: 3.9,
          },
          {
            id: 's5',
            name: 'Servicio de Plomería',
            description: 'Mantenimiento preventivo de instalaciones sanitarias',
            category: 'maintenance',
            frequency: 'quarterly',
            price: 80000,
            status: 'pending',
            nextServiceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
            providerName: 'Plomería Rápida',
            contractStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            autoRenewal: true,
          },
        ];

        setServices(mockServices);

        // Calculate stats
        const activeServices = mockServices.filter(s => s.status === 'active').length;
        const totalSpent = mockServices
          .filter(s => s.status === 'active')
          .reduce((sum, s) => sum + s.price, 0);
        const upcomingServices = mockServices.filter(
          s =>
            new Date(s.nextServiceDate) > new Date() &&
            new Date(s.nextServiceDate) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
        ).length;
        const ratedServices = mockServices.filter(s => s.rating);
        const averageRating =
          ratedServices.length > 0
            ? ratedServices.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedServices.length
            : 0;

        const serviceStats: ServiceStats = {
          activeServices,
          totalSpent,
          upcomingServices,
          averageRating,
          savingsPercentage: 15, // Mock savings percentage
        };

        setStats(serviceStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading services data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadServicesData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Pausado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pendiente</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      maintenance: 'bg-blue-100 text-blue-800',
      cleaning: 'bg-green-100 text-green-800',
      security: 'bg-red-100 text-red-800',
      utilities: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      maintenance: 'Mantenimiento',
      cleaning: 'Limpieza',
      security: 'Seguridad',
      utilities: 'Servicios',
      other: 'Otros',
    };

    return (
      <Badge className={colors[category as keyof typeof colors] || colors.other}>
        {labels[category as keyof typeof labels] || category}
      </Badge>
    );
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      weekly: 'Semanal',
      biweekly: 'Bisemanal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      yearly: 'Anual',
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePauseService = async (serviceId: string) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? { ...service, status: service.status === 'paused' ? 'active' : 'paused' }
          : service
      )
    );
    alert('Estado del servicio actualizado');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando servicios recurrentes...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Servicios Recurrentes"
      subtitle="Gestiona tus servicios de mantenimiento y limpieza programados"
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

        {/* Error Message */}
        {errorMessage && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Servicios Recurrentes</h1>
            <p className="text-gray-600">
              Administra tus servicios programados y contratos activos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleConfigureServices}>
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
            <Button onClick={handleNewService}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Servicio
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Servicios Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeServices}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gasto Mensual</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalSpent)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Próximos Servicios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingServices}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rating Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageRating.toFixed(1)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ahorro Estimado</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.savingsPercentage}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {services.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay servicios recurrentes
                </h3>
                <p className="text-gray-600">Comienza contratando tu primer servicio recurrente.</p>
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Servicio
                </Button>
              </CardContent>
            </Card>
          ) : (
            services.map(service => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                            {getStatusBadge(service.status)}
                            {getCategoryBadge(service.category)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          <p className="text-sm text-gray-500">Proveedor: {service.providerName}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Precio:</span>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(service.price)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Frecuencia:</span>
                          <p>{getFrequencyLabel(service.frequency)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Próximo servicio:</span>
                          <p>{formatDate(service.nextServiceDate)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Contrato:</span>
                          <p>{formatDate(service.contractStart)}</p>
                          {service.contractEnd && (
                            <p className="text-xs">Hasta: {formatDate(service.contractEnd)}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          {service.lastServiceDate && (
                            <span>Último: {formatDate(service.lastServiceDate)}</span>
                          )}
                          {service.rating && renderStars(service.rating)}
                        </div>
                        <div className="flex items-center gap-2">
                          {service.autoRenewal && (
                            <Badge variant="outline" className="text-xs">
                              Auto-renovable
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      {service.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePauseService(service.id)}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Pausar
                        </Button>
                      )}
                      {service.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePauseService(service.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Reanudar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModifyService(service.id)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Modificar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelService(service.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
