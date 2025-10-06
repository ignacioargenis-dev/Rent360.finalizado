'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Trophy,
  Star,
  MapPin,
  Phone,
  Mail,
  Award,
  Users,
  ThumbsUp,
  Clock,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';
import { logger } from '@/lib/logger';

interface TopProvider {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  totalJobs: number;
  completionRate: number;
  responseTime: number; // in hours
  specialties: string[];
  location: string;
  phone: string;
  email: string;
  badges: string[];
  stats: {
    satisfactionRate: number;
    repeatClients: number;
    yearsExperience: number;
    certifications: number;
  };
  recentReviews: {
    id: string;
    clientName: string;
    rating: number;
    comment: string;
    date: string;
    serviceType: string;
  }[];
}

export default function TopRatedProvidersPage() {
  const { user } = useUserState();
  const [providers, setProviders] = useState<TopProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<TopProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'jobs'>('rating');

  // Mock data for top-rated providers
  const mockProviders: TopProvider[] = [
    {
      id: '1',
      name: 'Servicios Eléctricos Premium',
      avatar: '/api/placeholder/100/100',
      rating: 4.9,
      reviewCount: 284,
      totalJobs: 312,
      completionRate: 98.7,
      responseTime: 1.2,
      specialties: ['Instalaciones Eléctricas', 'Reparaciones', 'Mantenimiento', 'Certificación'],
      location: 'Santiago Centro',
      phone: '+569 1234 5678',
      email: 'contacto@electricospremium.cl',
      badges: ['Top Rated', 'Verified', 'Insured', 'Certified'],
      stats: {
        satisfactionRate: 97.3,
        repeatClients: 68,
        yearsExperience: 12,
        certifications: 5,
      },
      recentReviews: [
        {
          id: 'r1',
          clientName: 'María González',
          rating: 5,
          comment: 'Excelente servicio, muy profesional y puntual. Recomiendo ampliamente.',
          date: '2024-12-01',
          serviceType: 'Reparación Eléctrica',
        },
        {
          id: 'r2',
          clientName: 'Carlos Rodríguez',
          rating: 5,
          comment: 'Trabajo impecable, explicaron todo el proceso y dejaron todo limpio.',
          date: '2024-11-28',
          serviceType: 'Instalación',
        },
      ],
    },
    {
      id: '2',
      name: 'Fontanería Profesional',
      avatar: '/api/placeholder/100/100',
      rating: 4.8,
      reviewCount: 198,
      totalJobs: 245,
      completionRate: 97.1,
      responseTime: 0.8,
      specialties: ['Reparaciones', 'Instalaciones', 'Emergencias 24/7', 'Mantenimiento'],
      location: 'Providencia',
      phone: '+569 8765 4321',
      email: 'info@fontaneriaprofesional.cl',
      badges: ['Verified', 'Emergency Service', 'Insured'],
      stats: {
        satisfactionRate: 95.8,
        repeatClients: 52,
        yearsExperience: 8,
        certifications: 3,
      },
      recentReviews: [
        {
          id: 'r3',
          clientName: 'Ana López',
          rating: 5,
          comment: 'Respuesta inmediata ante emergencia. Trabajo de calidad.',
          date: '2024-12-02',
          serviceType: 'Reparación Urgente',
        },
        {
          id: 'r4',
          clientName: 'Pedro Sánchez',
          rating: 4,
          comment: 'Buen servicio, aunque un poco más caro de lo esperado.',
          date: '2024-11-30',
          serviceType: 'Mantenimiento',
        },
      ],
    },
    {
      id: '3',
      name: 'Mantenimiento Integral',
      avatar: '/api/placeholder/100/100',
      rating: 4.7,
      reviewCount: 156,
      totalJobs: 189,
      completionRate: 96.3,
      responseTime: 2.1,
      specialties: ['Limpieza', 'Reparaciones Menores', 'Mantenimiento Preventivo', 'Organización'],
      location: 'Las Condes',
      phone: '+569 5555 6666',
      email: 'contacto@mantenimientointegral.cl',
      badges: ['Verified', 'Eco-Friendly', 'Insured'],
      stats: {
        satisfactionRate: 93.7,
        repeatClients: 41,
        yearsExperience: 6,
        certifications: 2,
      },
      recentReviews: [
        {
          id: 'r5',
          clientName: 'Laura Martínez',
          rating: 5,
          comment: 'Equipo muy profesional, dejaron el departamento impecable.',
          date: '2024-12-03',
          serviceType: 'Limpieza Profunda',
        },
        {
          id: 'r6',
          clientName: 'Diego Torres',
          rating: 4,
          comment: 'Buen trabajo general, pero podrían ser más puntuales.',
          date: '2024-11-25',
          serviceType: 'Mantenimiento',
        },
      ],
    },
    {
      id: '4',
      name: 'Pintura y Decoración',
      avatar: '/api/placeholder/100/100',
      rating: 4.8,
      reviewCount: 142,
      totalJobs: 167,
      completionRate: 97.8,
      responseTime: 1.5,
      specialties: ['Pintura Interior', 'Pintura Exterior', 'Decoración', 'Acabados'],
      location: 'Ñuñoa',
      phone: '+569 4444 3333',
      email: 'info@pinturaydecoracion.cl',
      badges: ['Verified', 'Insured', 'Quality Guarantee'],
      stats: {
        satisfactionRate: 96.2,
        repeatClients: 35,
        yearsExperience: 10,
        certifications: 4,
      },
      recentReviews: [
        {
          id: 'r7',
          clientName: 'Sofia Ramírez',
          rating: 5,
          comment: 'Resultado excelente, muy cuidadosos con los detalles.',
          date: '2024-12-01',
          serviceType: 'Pintura Interior',
        },
        {
          id: 'r8',
          clientName: 'Andrés Vega',
          rating: 5,
          comment: 'Profesionales de primera, recomiendo sin duda.',
          date: '2024-11-27',
          serviceType: 'Decoración',
        },
      ],
    },
  ];

  useEffect(() => {
    loadTopProviders();
  }, [sortBy]);

  const loadTopProviders = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      let sortedProviders = [...mockProviders];

      switch (sortBy) {
        case 'rating':
          sortedProviders.sort((a, b) => b.rating - a.rating);
          break;
        case 'reviews':
          sortedProviders.sort((a, b) => b.reviewCount - a.reviewCount);
          break;
        case 'jobs':
          sortedProviders.sort((a, b) => b.totalJobs - a.totalJobs);
          break;
      }

      setProviders(sortedProviders);
    } catch (error) {
      logger.error('Error al cargar proveedores destacados', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Top Rated':
        return 'bg-yellow-100 text-yellow-800';
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Insured':
        return 'bg-blue-100 text-blue-800';
      case 'Certified':
        return 'bg-purple-100 text-purple-800';
      case 'Emergency Service':
        return 'bg-red-100 text-red-800';
      case 'Eco-Friendly':
        return 'bg-emerald-100 text-emerald-800';
      case 'Quality Guarantee':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const contactProvider = (provider: TopProvider, method: 'phone' | 'email' | 'message') => {
    switch (method) {
      case 'phone':
        window.open(`tel:${provider.phone}`);
        break;
      case 'email':
        window.open(`mailto:${provider.email}?subject=Solicitud de Servicio`);
        break;
      case 'message':
        // Implementar navegación a chat o mensajería
        logger.info('Iniciar conversación con proveedor', { providerId: provider.id });
        break;
    }
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proveedores Destacados</h1>
            <p className="text-gray-600">Los mejores proveedores verificados de la plataforma</p>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'rating' | 'reviews' | 'jobs')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="rating">Ordenar por Calificación</option>
              <option value="reviews">Ordenar por Reseñas</option>
              <option value="jobs">Ordenar por Trabajos</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando proveedores...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 con diseño especial */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {providers.slice(0, 3).map((provider, index) => (
                <Card
                  key={provider.id}
                  className={`relative overflow-hidden ${
                    index === 0
                      ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100'
                      : index === 1
                        ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100'
                        : 'border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100'
                  }`}
                >
                  {index === 0 && (
                    <div className="absolute top-4 right-4">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={provider.avatar} />
                      <AvatarFallback className="text-lg">
                        {provider.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-xl">{provider.name}</CardTitle>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {getRatingStars(provider.rating)}
                      <span className="text-sm text-gray-600">
                        ({provider.reviewCount} reseñas)
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {provider.location}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {provider.badges.slice(0, 3).map(badge => (
                        <Badge key={badge} className={`text-xs ${getBadgeColor(badge)}`}>
                          {badge}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Trabajos</p>
                        <p className="font-semibold">{provider.totalJobs}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tasa Éxito</p>
                        <p className="font-semibold">{provider.completionRate}%</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => contactProvider(provider, 'phone')}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Llamar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => contactProvider(provider, 'email')}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Lista completa de proveedores */}
            <Card>
              <CardHeader>
                <CardTitle>Todos los Proveedores Destacados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {providers.map((provider, index) => (
                    <div
                      key={provider.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                            {index + 1}
                          </div>
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={provider.avatar} />
                            <AvatarFallback>
                              {provider.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold">{provider.name}</h3>
                              <div className="flex items-center gap-4 mt-1">
                                {getRatingStars(provider.rating)}
                                <span className="text-sm text-gray-600">
                                  {provider.reviewCount} reseñas
                                </span>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <MapPin className="w-4 h-4" />
                                  {provider.location}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => contactProvider(provider, 'phone')}
                              >
                                <Phone className="w-4 h-4 mr-1" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => contactProvider(provider, 'email')}
                              >
                                <Mail className="w-4 h-4 mr-1" />
                              </Button>
                              <Button size="sm" onClick={() => setSelectedProvider(provider)}>
                                Ver Perfil
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">
                                {provider.totalJobs}
                              </p>
                              <p className="text-sm text-gray-600">Trabajos</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">
                                {provider.completionRate}%
                              </p>
                              <p className="text-sm text-gray-600">Tasa Éxito</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-600">
                                {provider.responseTime}h
                              </p>
                              <p className="text-sm text-gray-600">Tiempo Respuesta</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-orange-600">
                                {provider.stats.yearsExperience}
                              </p>
                              <p className="text-sm text-gray-600">Años Exp.</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {provider.badges.map(badge => (
                              <Badge key={badge} className={`text-xs ${getBadgeColor(badge)}`}>
                                {badge}
                              </Badge>
                            ))}
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">Especialidades:</p>
                            <div className="flex flex-wrap gap-1">
                              {provider.specialties.map(specialty => (
                                <Badge key={specialty} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de detalles del proveedor */}
        {selectedProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={selectedProvider.avatar} />
                      <AvatarFallback className="text-xl">
                        {selectedProvider.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedProvider.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        {getRatingStars(selectedProvider.rating)}
                        <span className="text-gray-600">
                          ({selectedProvider.reviewCount} reseñas)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        {selectedProvider.location}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedProvider(null)}>
                    ✕
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{selectedProvider.totalJobs}</p>
                    <p className="text-sm text-gray-600">Trabajos Realizados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {selectedProvider.completionRate}%
                    </p>
                    <p className="text-sm text-gray-600">Tasa de Éxito</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {selectedProvider.responseTime}h
                    </p>
                    <p className="text-sm text-gray-600">Tiempo de Respuesta</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Estadísticas</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Satisfacción del Cliente</span>
                        <span className="font-semibold">
                          {selectedProvider.stats.satisfactionRate}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Clientes Recurrentes</span>
                        <span className="font-semibold">
                          {selectedProvider.stats.repeatClients}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Años de Experiencia</span>
                        <span className="font-semibold">
                          {selectedProvider.stats.yearsExperience}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Certificaciones</span>
                        <span className="font-semibold">
                          {selectedProvider.stats.certifications}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Contacto</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span>{selectedProvider.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span>{selectedProvider.email}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        className="flex-1"
                        onClick={() => contactProvider(selectedProvider, 'phone')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Llamar Ahora
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => contactProvider(selectedProvider, 'email')}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar Email
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Reseñas Recientes</h3>
                  <div className="space-y-4">
                    {selectedProvider.recentReviews.map(review => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{review.clientName}</p>
                            <p className="text-sm text-gray-600">{review.serviceType}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {getRatingStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(review.date).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedProvider(null)}>
                    Cerrar
                  </Button>
                  <Button onClick={() => contactProvider(selectedProvider, 'message')}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Iniciar Conversación
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
