'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger-minimal';
import { Home, MapPin, DollarSign, Calendar, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  commune: string;
  price: number;
  type: string;
  status: string;
  images: string[];
  createdAt: string;
}

interface BrokerClient {
  id: string;
  brokerId: string;
  userId: string;
  propertyManagementType: string | null;
  managedProperties: string[] | null;
}

export default function SelectPropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brokerClient, setBrokerClient] = useState<BrokerClient | null>(null);

  useEffect(() => {
    if (!clientId) {
      toast.error('ID de cliente no proporcionado');
      router.push('/owner/broker-services');
      return;
    }
    loadData();
  }, [clientId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar propiedades del propietario
      const propertiesRes = await fetch('/api/owner/properties', {
        credentials: 'include',
      });

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        setProperties(propertiesData.properties || []);
      }

      // Cargar información del cliente corredor
      const clientRes = await fetch(`/api/broker/clients/${clientId}`, {
        credentials: 'include',
      });

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setBrokerClient(clientData.client);

        // Si ya hay propiedades seleccionadas, marcarlas
        if (clientData.client.managedPropertyIds) {
          setSelectedProperties(JSON.parse(clientData.client.managedPropertyIds));
        }
      }
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId) ? prev.filter(id => id !== propertyId) : [...prev, propertyId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProperties(properties.map(p => p.id));
  };

  const handleSelectNone = () => {
    setSelectedProperties([]);
  };

  const handleSave = async () => {
    if (!clientId || !brokerClient) {
      return;
    }

    try {
      setSaving(true);

      const managementType =
        selectedProperties.length === 0
          ? 'none'
          : selectedProperties.length === properties.length
            ? 'full'
            : 'partial';

      const response = await fetch(`/api/broker/clients/${clientId}/manage-properties`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          propertyManagementType: managementType,
          managedPropertyIds:
            selectedProperties.length === properties.length ? null : selectedProperties,
        }),
      });

      if (response.ok) {
        toast.success('Configuración de propiedades guardada exitosamente');
        router.push('/owner/broker-services');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar la configuración');
      }
    } catch (error) {
      logger.error('Error saving property configuration:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Seleccionar Propiedades" subtitle="Cargando propiedades...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </UnifiedDashboardLayout>
    );
  }

  const availableProperties = properties.filter(
    p => p.status === 'AVAILABLE' || p.status === 'RENTED'
  );

  return (
    <UnifiedDashboardLayout
      title="Seleccionar Propiedades para Administración"
      subtitle="Elige qué propiedades quieres que el corredor administre"
    >
      <div className="space-y-6">
        {/* Información del corredor */}
        {brokerClient && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Relación con Corredor Establecida
              </CardTitle>
              <CardDescription>
                Ahora configura qué propiedades quieres que administre este corredor.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Home className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{availableProperties.length}</p>
                  <p className="text-sm text-gray-600">Propiedades Disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{selectedProperties.length}</p>
                  <p className="text-sm text-gray-600">Propiedades Seleccionadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {selectedProperties.length > 0
                      ? `${((brokerClient?.commissionRate || 5) * selectedProperties.length).toFixed(1)}%`
                      : '0%'}
                  </p>
                  <p className="text-sm text-gray-600">Comisión Estimada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles de selección */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Propiedades</CardTitle>
            <CardDescription>
              Elige qué propiedades quieres que el corredor administre. Puedes seleccionar todas o
              solo algunas específicas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Seleccionar Todas
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectNone}>
                Deseleccionar Todas
              </Button>
            </div>

            {availableProperties.length === 0 ? (
              <div className="text-center py-8">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes propiedades disponibles
                </h3>
                <p className="text-gray-600">
                  Primero necesitas crear propiedades para poder asignarlas a un corredor.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {availableProperties.map(property => (
                  <Card
                    key={property.id}
                    className={`cursor-pointer transition-colors ${
                      selectedProperties.includes(property.id)
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedProperties.includes(property.id)}
                          onCheckedChange={() => handlePropertyToggle(property.id)}
                          className="mt-1"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{property.title}</h4>
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <MapPin className="h-3 w-3" />
                                {property.address}, {property.commune}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
                                <DollarSign className="h-4 w-4" />
                                {property.price.toLocaleString('es-CL')}
                              </div>
                              <Badge
                                variant={property.status === 'AVAILABLE' ? 'default' : 'secondary'}
                                className="mt-1"
                              >
                                {property.status === 'AVAILABLE' ? 'Disponible' : 'Arrendada'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{property.type}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(property.createdAt).toLocaleDateString('es-CL')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/owner/broker-services')}
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <Button onClick={handleSave} disabled={saving || availableProperties.length === 0}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar Configuración
          </Button>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
