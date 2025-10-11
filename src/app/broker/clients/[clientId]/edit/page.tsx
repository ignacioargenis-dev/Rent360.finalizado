'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  address: string;
  city: string;
  region: string;
  occupation: string;
  income: number;
  birthDate: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  preferredContact: 'email' | 'phone' | 'whatsapp';
  budget: {
    min: number;
    max: number;
  };
  requirements: string[];
  notes: string;
  status: 'active' | 'inactive' | 'prospect';
  source: 'website' | 'referral' | 'advertisement' | 'social_media' | 'other';
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const { user } = useAuth();

  const [formData, setFormData] = useState<ClientData>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    occupation: '',
    income: 0,
    birthDate: '',
    maritalStatus: 'single',
    preferredContact: 'email',
    budget: { min: 0, max: 0 },
    requirements: [],
    notes: '',
    status: 'prospect',
    source: 'website',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<ClientData>>({});
  const [newRequirement, setNewRequirement] = useState('');

  // Mock client data
  const mockClient: ClientData = {
    id: clientId,
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+56987654321',
    avatar: '/api/placeholder/120/120',
    address: 'Av. Providencia 1234',
    city: 'Santiago',
    region: 'Metropolitana',
    occupation: 'Profesora',
    income: 1200000,
    birthDate: '1985-03-15',
    maritalStatus: 'married',
    preferredContact: 'whatsapp',
    budget: { min: 500000, max: 800000 },
    requirements: ['3 dormitorios', '2 baños', 'estacionamiento', 'cerca del metro'],
    notes:
      'Cliente interesado en propiedades familiares. Prefiere zonas tranquilas pero con buen acceso al transporte público.',
    status: 'active',
    source: 'referral',
  };

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setFormData(mockClient);
    } catch (error) {
      logger.error('Error al cargar cliente', { error, clientId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | { min: number; max: number }
  ) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent as keyof typeof prev]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child as any]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()],
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (requirement: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(r => r !== requirement),
    }));
  };

  const validateForm = () => {
    const newErrors: Partial<ClientData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nombre requerido';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email requerido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Teléfono requerido';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      logger.info('Cliente actualizado', { clientId, name: formData.name });

      // Redirect to client detail page
      router.push(`/broker/clients/${clientId}`);
    } catch (error) {
      logger.error('Error al guardar cliente', { error, clientId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/broker/clients/${clientId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const regions = [
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    'Metropolitana',
    "O'Higgins",
    'Maule',
    'Ñuble',
    'Biobío',
    'Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén',
    'Magallanes',
  ];

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando cliente...</span>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
            <p className="text-gray-600">Actualizar información del cliente</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={e => handleInputChange('birthDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="occupation">Ocupación</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={e => handleInputChange('occupation', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="income">Ingresos Mensuales</Label>
                    <Input
                      id="income"
                      type="number"
                      value={formData.income}
                      onChange={e => handleInputChange('income', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Calle, número, comuna"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="region">Región</Label>
                    <Select
                      value={formData.region}
                      onValueChange={value => handleInputChange('region', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(region => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maritalStatus">Estado Civil</Label>
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(value: ClientData['maritalStatus']) =>
                        handleInputChange('maritalStatus', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Soltero</SelectItem>
                        <SelectItem value="married">Casado</SelectItem>
                        <SelectItem value="divorced">Divorciado</SelectItem>
                        <SelectItem value="widowed">Viudo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preferredContact">Contacto Preferido</Label>
                    <Select
                      value={formData.preferredContact}
                      onValueChange={(value: ClientData['preferredContact']) =>
                        handleInputChange('preferredContact', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Teléfono</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <Label>Rango de Presupuesto Mensual</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budgetMin" className="text-sm text-gray-600">
                        Mínimo
                      </Label>
                      <Input
                        id="budgetMin"
                        type="number"
                        value={formData.budget.min}
                        onChange={e =>
                          handleInputChange('budget.min', parseInt(e.target.value) || 0)
                        }
                        placeholder="500000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budgetMax" className="text-sm text-gray-600">
                        Máximo
                      </Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        value={formData.budget.max}
                        onChange={e =>
                          handleInputChange('budget.max', parseInt(e.target.value) || 0)
                        }
                        placeholder="1000000"
                      />
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <Label>Requisitos de Propiedad</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newRequirement}
                      onChange={e => setNewRequirement(e.target.value)}
                      placeholder="Ej: 3 dormitorios, estacionamiento..."
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    />
                    <Button type="button" onClick={addRequirement} size="sm">
                      Agregar
                    </Button>
                  </div>
                  {formData.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.requirements.map((requirement, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => removeRequirement(requirement)}
                        >
                          {requirement} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status and Source */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: ClientData['status']) =>
                        handleInputChange('status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospect">Prospecto</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="source">Fuente de Contacto</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value: ClientData['source']) =>
                        handleInputChange('source', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Sitio Web</SelectItem>
                        <SelectItem value="referral">Referencia</SelectItem>
                        <SelectItem value="advertisement">Publicidad</SelectItem>
                        <SelectItem value="social_media">Redes Sociales</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    placeholder="Información adicional sobre el cliente..."
                    rows={4}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Summary Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Resumen del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={formData.avatar} alt={formData.name} />
                    <AvatarFallback>
                      {formData.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{formData.name}</h3>
                    <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
                      {formData.status === 'active'
                        ? 'Activo'
                        : formData.status === 'prospect'
                          ? 'Prospecto'
                          : 'Inactivo'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <span>{formData.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <span>{formData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span>
                      {formData.city}, {formData.region}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-gray-600" />
                    <span>{formData.occupation}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                    <span>{formatCurrency(formData.income)}</span>
                  </div>
                </div>

                {formData.budget.min > 0 || formData.budget.max > 0 ? (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Presupuesto</h4>
                    <div className="text-sm">
                      {formData.budget.min > 0 && (
                        <div>Desde: {formatCurrency(formData.budget.min)}</div>
                      )}
                      {formData.budget.max > 0 && (
                        <div>Hasta: {formatCurrency(formData.budget.max)}</div>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600">
                      Contacto preferido: {formData.preferredContact}
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
