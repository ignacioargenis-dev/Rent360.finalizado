'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface Contract {
  id: string;
  contractNumber: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  deposit: number;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'TERMINATED';
  brokerId?: string | null;
  terms: string;
  signedAt?: Date | null;
  terminatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  property: {
    id: string;
    title: string;
    description: string;
    address: string;
    city: string;
    commune: string;
    region: string;
    price: number;
    deposit: number;
    bedrooms: number;
    bathrooms: number;
    area: number;
    type: string;
    status: string;
    images: string[];
    features: string[];
    virtualTourEnabled: boolean;
    virtualTourData: string | null;
    owner: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
  };
  tenant: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  ownerName: string;
}

export default function TenantContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);

      // Obtener datos reales desde la API
      const response = await fetch('/api/tenant/contracts', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setContracts(result.data);
          setLoading(false);
          return;
        }
      }

      // Fallback a datos mock si la API falla
      logger.warn('API falló, usando datos mock');
      const emptyImages: string[] = [];

      setTimeout(() => {
        setContracts([
          {
            id: 'pending-tenant-1',
            contractNumber: 'CTR-2024-004',
            propertyId: '4',
            tenantId: '1',
            ownerId: '6',
            startDate: new Date('2024-03-01'),
            endDate: new Date('2025-02-28'),
            monthlyRent: 450000,
            deposit: 450000,
            status: 'PENDING' as any,
            brokerId: null,
            terms: 'Contrato residencial estándar - Pendiente de firma del propietario',
            signedAt: null,
            terminatedAt: null,
            createdAt: new Date('2024-02-15'),
            updatedAt: new Date('2024-02-15'),
            property: {
              id: '4',
              title: 'Casa Ñuñoa',
              description: 'Casa familiar moderna en Ñuñoa',
              address: 'Av. Irarrázaval 2345, Ñuñoa',
              city: 'Santiago',
              commune: 'Ñuñoa',
              region: 'Metropolitana',
              price: 450000,
              deposit: 450000,
              bedrooms: 3,
              bathrooms: 2,
              area: 120,
              type: 'Casa',
              status: 'AVAILABLE',
              images: emptyImages,
              features: ['Estacionamiento', 'Jardín', 'Seguridad 24/7'],
              virtualTourEnabled: false,
              virtualTourData: null,
              owner: {
                id: '6',
                name: 'Empresa Soluciones Ltda.',
                email: 'contacto@empresasoluciones.cl',
                phone: '+56 9 8765 4321',
              },
            },
            tenant: {
              id: '1',
              name: 'María González',
              email: 'maria.gonzalez@email.com',
              phone: '+56 9 1234 5678',
            },
            ownerName: 'Empresa Soluciones Ltda.',
          },
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      logger.error('Error cargando contratos:', { error });
      setLoading(false);
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'EXPIRED':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'TERMINATED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-orange-100 text-orange-800">Expirado</Badge>;
      case 'TERMINATED':
        return <Badge className="bg-red-100 text-red-800">Terminado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Mis Contratos</h1>
        </div>
        <div className="grid gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Mis Contratos</h1>
        <div className="text-sm text-muted-foreground">
          {contracts.length} contrato{contracts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes contratos</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Cuando tengas contratos activos, aparecerán aquí. Puedes contactar a un corredor para
              encontrar propiedades disponibles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {contracts.map(contract => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(contract.status)}
                    <div>
                      <CardTitle className="text-lg">{contract.contractNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground">{contract.property.title}</p>
                    </div>
                  </div>
                  {getStatusBadge(contract.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información de la propiedad */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{contract.property.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Propietario: {contract.ownerName}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Arriendo: {formatPrice(contract.monthlyRent)}/mes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Depósito: {formatPrice(contract.deposit)}</span>
                    </div>
                  </div>
                </div>

                {/* Fechas del contrato */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Inicio: {formatDate(contract.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Fin: {formatDate(contract.endDate)}</span>
                  </div>
                </div>

                {/* Términos del contrato */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Términos del Contrato</h4>
                  <p className="text-sm text-muted-foreground">{contract.terms}</p>
                </div>

                {/* Características de la propiedad */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Características</h4>
                  <div className="flex flex-wrap gap-2">
                    {contract.property.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="border-t pt-4 flex gap-2">
                  <Button variant="outline" size="sm">
                    Ver Detalles
                  </Button>
                  {contract.status === 'ACTIVE' && (
                    <Button variant="outline" size="sm">
                      Solicitar Mantenimiento
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    Contactar Propietario
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
