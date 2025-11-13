'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  User,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string;
  totalServices: number;
  totalSpent: number;
  averageRating: number;
  lastServiceDate: string | null;
  status: 'active' | 'inactive' | 'prospect';
  serviceTypes: string[];
}

export default function ProviderClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const clientId = params?.clientId as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar todos los clientes y buscar el específico
      const response = await fetch('/api/provider/clients', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los clientes');
      }

      const data = await response.json();

      if (data.success && data.clients) {
        const foundClient = data.clients.find((c: any) => c.id === clientId);
        if (foundClient) {
          setClient({
            id: foundClient.id,
            name: foundClient.name,
            email: foundClient.email,
            phone: foundClient.phone,
            location: foundClient.location,
            totalServices: foundClient.totalServices,
            totalSpent: foundClient.totalSpent,
            averageRating: foundClient.averageRating,
            lastServiceDate: foundClient.lastServiceDate,
            status: foundClient.status,
            serviceTypes: foundClient.serviceTypes || [],
          });
        } else {
          setError('Cliente no encontrado');
        }
      } else {
        throw new Error('Error al procesar los datos');
      }
    } catch (error) {
      logger.error('Error cargando detalles del cliente:', {
        error: error instanceof Error ? error.message : String(error),
        clientId,
      });
      setError('Error al cargar los detalles del cliente');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'prospect':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Prospecto
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <UnifiedDashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error || 'Cliente no encontrado'}</p>
            <Button onClick={() => router.push('/provider/clients')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Clientes
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.push('/provider/clients')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">{client.email}</p>
          </div>
          {getStatusBadge(client.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Servicios</p>
                  <p className="text-2xl font-bold text-blue-600">{client.totalServices}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Gastado</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(client.totalSpent)}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Calificación</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-yellow-600">
                      {client.averageRating.toFixed(1)}
                    </p>
                    <Star className="w-5 h-5 text-yellow-600 fill-current" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Último Servicio</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {client.lastServiceDate
                      ? new Date(client.lastServiceDate).toLocaleDateString('es-CL')
                      : 'N/A'}
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              </div>
              {client.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Teléfono</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">Ubicación</p>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{client.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Servicios Contratados</CardTitle>
            </CardHeader>
            <CardContent>
              {client.serviceTypes && client.serviceTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {client.serviceTypes.map((type, index) => (
                    <Badge key={index} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hay servicios registrados</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
