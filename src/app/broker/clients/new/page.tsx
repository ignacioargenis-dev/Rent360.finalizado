'use client';

import { logger } from '@/lib/logger-minimal';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Home,
  Building,
  Users,
  Save,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { User as UserType } from '@/types';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface NewClientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  rut: string;
  address: string;
  city: string;
  commune: string;
  region: string;
  budgetMin: number;
  budgetMax: number;
  propertyTypes: string[];
  preferredLocations: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  financing: boolean;
  notes: string;
  source: 'website' | 'referral' | 'social' | 'advertising' | 'other';
}

export default function NewClientPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [clientData, setClientData] = useState<NewClientData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    rut: '',
    address: '',
    city: '',
    commune: '',
    region: '',
    budgetMin: 0,
    budgetMax: 0,
    propertyTypes: [],
    preferredLocations: [],
    urgencyLevel: 'medium',
    financing: false,
    notes: '',
    source: 'website',
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);

          // Cargar datos de prospecto si viene de la conversión
          const prospectData = sessionStorage.getItem('prospectToConvert');
          if (prospectData) {
            const prospect = JSON.parse(prospectData);
            setClientData(prev => ({
              ...prev,
              firstName: prospect.name?.split(' ')[0] || '',
              lastName: prospect.name?.split(' ').slice(1).join(' ') || '',
              email: prospect.email || '',
              phone: prospect.phone || '',
              notes: `Convertido desde prospecto: ${prospect.notes || ''}`,
              source: prospect.source || 'website',
              propertyTypes: prospect.interestedIn || [],
              budgetMin: prospect.budget?.min || 0,
              budgetMax: prospect.budget?.max || 0,
            }));
            sessionStorage.removeItem('prospectToConvert');
          }
        }
      } catch (error) {
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const updateClientData = (field: string, value: any) => {
    setClientData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addPropertyType = (type: string) => {
    if (!clientData.propertyTypes.includes(type)) {
      setClientData(prev => ({
        ...prev,
        propertyTypes: [...prev.propertyTypes, type],
      }));
    }
  };

  const removePropertyType = (type: string) => {
    setClientData(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.filter(t => t !== type),
    }));
  };

  const addLocation = (location: string) => {
    if (!clientData.preferredLocations.includes(location)) {
      setClientData(prev => ({
        ...prev,
        preferredLocations: [...prev.preferredLocations, location],
      }));
    }
  };

  const removeLocation = (location: string) => {
    setClientData(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations.filter(l => l !== location),
    }));
  };

  const saveClient = async () => {
    if (!clientData.firstName || !clientData.lastName || !clientData.email) {
      setErrorMessage('Nombre, apellido y email son obligatorios');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/broker/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email,
          phone: clientData.phone,
          rut: clientData.rut,
          address: clientData.address,
          city: clientData.city,
          commune: clientData.commune,
          region: clientData.region,
          budgetMin: clientData.budgetMin,
          budgetMax: clientData.budgetMax,
          propertyTypes: clientData.propertyTypes,
          preferredLocations: clientData.preferredLocations,
          urgencyLevel: clientData.urgencyLevel,
          financing: clientData.financing,
          notes: clientData.notes,
          source: clientData.source,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el cliente');
      }

      const data = await response.json();

      setSuccessMessage('Cliente creado exitosamente');
      setTimeout(() => {
        router.push(`/broker/clients/${data.client.id}`);
      }, 2000);
    } catch (error) {
      logger.error('Error saving client:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al crear el cliente. Por favor, inténtalo nuevamente.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const cancelCreation = () => {
    router.push('/broker/clients');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Nuevo Cliente"
      subtitle="Registrar un nuevo cliente en el sistema"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Cliente</h1>
            <p className="text-gray-600">Complete la información del nuevo cliente</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelCreation}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={saveClient} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cliente'}
            </Button>
          </div>
        </div>

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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Datos básicos del cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <Input
                      type="text"
                      value={clientData.firstName}
                      onChange={e => updateClientData('firstName', e.target.value)}
                      placeholder="Juan"
                      className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <Input
                      type="text"
                      value={clientData.lastName}
                      onChange={e => updateClientData('lastName', e.target.value)}
                      placeholder="Pérez"
                      className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <Input
                      type="email"
                      value={clientData.email}
                      onChange={e => updateClientData('email', e.target.value)}
                      placeholder="juan.perez@email.com"
                      className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <Input
                      type="tel"
                      value={clientData.phone}
                      onChange={e => updateClientData('phone', e.target.value)}
                      placeholder="+56912345678"
                      className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                  <Input
                    type="text"
                    value={clientData.rut}
                    onChange={e => updateClientData('rut', e.target.value)}
                    placeholder="12.345.678-9"
                    className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Ubicación</CardTitle>
                <CardDescription>Dirección del cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <Input
                    type="text"
                    value={clientData.address}
                    onChange={e => updateClientData('address', e.target.value)}
                    placeholder="Av. Providencia 1234"
                    className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <Input
                      type="text"
                      value={clientData.city}
                      onChange={e => updateClientData('city', e.target.value)}
                      placeholder="Santiago"
                      className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
                    <Input
                      type="text"
                      value={clientData.commune}
                      onChange={e => updateClientData('commune', e.target.value)}
                      placeholder="Providencia"
                      className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
                    <Select
                      value={clientData.region}
                      onValueChange={value => updateClientData('region', value)}
                    >
                      <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Seleccionar región" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Metropolitana">Metropolitana</SelectItem>
                        <SelectItem value="Valparaíso">Valparaíso</SelectItem>
                        <SelectItem value="Biobío">Biobío</SelectItem>
                        <SelectItem value="Antofagasta">Antofagasta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Propiedad</CardTitle>
                <CardDescription>Qué tipo de propiedades busca el cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Presupuesto Mínimo
                    </label>
                    <Input
                      type="number"
                      value={clientData.budgetMin}
                      onChange={e => updateClientData('budgetMin', parseInt(e.target.value) || 0)}
                      placeholder="50000000"
                      className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Presupuesto Máximo
                    </label>
                    <Input
                      type="number"
                      value={clientData.budgetMax}
                      onChange={e => updateClientData('budgetMax', parseInt(e.target.value) || 0)}
                      placeholder="150000000"
                      className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de Propiedad
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {clientData.propertyTypes.map(type => (
                      <Badge key={type} variant="secondary" className="flex items-center gap-1">
                        {type}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removePropertyType(type)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['departamento', 'casa', 'oficina', 'local', 'bodega'].map(type => (
                      <Button
                        key={type}
                        size="sm"
                        variant="outline"
                        onClick={() => addPropertyType(type)}
                        disabled={clientData.propertyTypes.includes(type)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel de Urgencia
                  </label>
                  <Select
                    value={clientData.urgencyLevel}
                    onValueChange={value => updateClientData('urgencyLevel', value)}
                  >
                    <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Seleccionar urgencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
                <CardDescription>Detalles adicionales del cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Financiamiento
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={clientData.financing}
                        onChange={e => updateClientData('financing', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Necesita financiamiento</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                    <Select
                      value={clientData.source}
                      onValueChange={value => updateClientData('source', value)}
                    >
                      <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Seleccionar origen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Sitio Web</SelectItem>
                        <SelectItem value="referral">Referencia</SelectItem>
                        <SelectItem value="social">Redes Sociales</SelectItem>
                        <SelectItem value="advertising">Publicidad</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <Textarea
                    value={clientData.notes}
                    onChange={e => updateClientData('notes', e.target.value)}
                    rows={4}
                    placeholder="Información adicional sobre el cliente..."
                    className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nombre completo</span>
                    <span className="text-sm font-medium">
                      {clientData.firstName} {clientData.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className="text-sm font-medium">{clientData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Teléfono</span>
                    <span className="text-sm font-medium">
                      {clientData.phone || 'No especificado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Presupuesto</span>
                    <span className="text-sm font-medium">
                      {clientData.budgetMin && clientData.budgetMax
                        ? `${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(clientData.budgetMin)} - ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(clientData.budgetMax)}`
                        : 'No especificado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tipos</span>
                    <span className="text-sm font-medium">
                      {clientData.propertyTypes.length > 0
                        ? clientData.propertyTypes.join(', ')
                        : 'No especificado'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
