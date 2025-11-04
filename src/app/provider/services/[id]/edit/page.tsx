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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Wrench,
  Clock,
  DollarSign,
  Image,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface ServiceData {
  name: string;
  category: string;
  description: string;
  shortDescription: string;
  pricing: {
    type: 'fixed' | 'hourly' | 'quote';
    amount: number;
    currency: string;
    minimumCharge?: number;
  };
  duration: {
    estimated: string;
    unit: 'minutes' | 'hours' | 'days';
  };
  features: string[];
  requirements: string[];
  availability: {
    active: boolean;
    regions: string[];
    emergency: boolean;
  };
  images: File[];
  existingImages: string[];
  tags: string[];
}

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const serviceId = params?.id as string;

  const [serviceData, setServiceData] = useState<ServiceData>({
    name: '',
    category: '',
    description: '',
    shortDescription: '',
    pricing: {
      type: 'fixed',
      amount: 0,
      currency: 'CLP',
      minimumCharge: 0,
    },
    duration: {
      estimated: '',
      unit: 'hours',
    },
    features: [],
    requirements: [],
    availability: {
      active: true,
      regions: [],
      emergency: false,
    },
    images: [],
    existingImages: [],
    tags: [],
  });

  const [newFeature, setNewFeature] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    'Electricidad',
    'Fontanería',
    'Mantenimiento General',
    'Pintura',
    'Jardinería',
    'Carpintería',
    'Cerrajería',
    'Limpieza',
    'Seguridad',
    'Climatización',
    'Construcción',
    'Mudanzas',
    'Reparaciones Domésticas',
    'Instalaciones',
    'Otros',
  ];

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

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    try {
      setIsLoading(true);

      // ✅ Cargar datos reales desde la API usando ID único
      const response = await fetch(`/api/provider/services/${serviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar el servicio');
      }

      // Parsear disponibilidad
      let availability = {
        active: data.availability?.active !== undefined ? data.availability.active : true,
        regions: data.availability?.regions || [],
        emergency: data.availability?.emergency || false,
      };

      // Parsear duración
      let durationEstimated = data.duration?.estimated || '2-4';
      let durationUnit = data.duration?.unit || 'hours';

      // Si la duración viene como "2-4 horas", extraer solo el número
      if (typeof durationEstimated === 'string' && durationEstimated.includes('-')) {
        durationEstimated = durationEstimated.split('-')[0];
      }

      // Transformar datos de la API al formato del formulario
      const serviceDataFromAPI: ServiceData = {
        name: data.name || '',
        category: data.category || '',
        description: data.description || '',
        shortDescription: data.shortDescription || data.description?.substring(0, 100) || '',
        pricing: {
          type: data.pricing?.type || 'fixed',
          amount: data.pricing?.amount || 0,
          currency: data.pricing?.currency || 'CLP',
          minimumCharge: data.pricing?.minimumCharge || 0,
        },
        duration: {
          estimated: durationEstimated,
          unit: durationUnit as 'minutes' | 'hours' | 'days',
        },
        features: data.features || [],
        requirements: data.requirements || [],
        availability,
        images: [],
        existingImages: data.images || [],
        tags: data.tags || [],
      };

      setServiceData(serviceDataFromAPI);

      logger.info('Servicio cargado para edición', {
        serviceId,
        name: serviceDataFromAPI.name,
        category: serviceDataFromAPI.category,
      });
    } catch (error) {
      logger.error('Error al cargar servicio', {
        error: error instanceof Error ? error.message : String(error),
        serviceId,
      });
      setErrorMessage('Error al cargar el servicio. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setServiceData(prev => ({
        ...prev,
        [parent as keyof typeof prev]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child as any]: value,
        },
      }));
    } else {
      setServiceData(prev => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !serviceData.features.includes(newFeature.trim())) {
      setServiceData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setServiceData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature),
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim() && !serviceData.requirements.includes(newRequirement.trim())) {
      setServiceData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()],
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (requirement: string) => {
    setServiceData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(r => r !== requirement),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !serviceData.tags.includes(newTag.trim())) {
      setServiceData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setServiceData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const addRegion = () => {
    if (newRegion && !serviceData.availability.regions.includes(newRegion)) {
      setServiceData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          regions: [...prev.availability.regions, newRegion],
        },
      }));
      setNewRegion('');
    }
  };

  const removeRegion = (region: string) => {
    setServiceData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        regions: prev.availability.regions.filter(r => r !== region),
      },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setServiceData(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeImage = (index: number) => {
    setServiceData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeExistingImage = (imageUrl: string) => {
    setServiceData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter(img => img !== imageUrl),
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!serviceData.name) newErrors.name = 'Debe ingresar el nombre del servicio';
    if (!serviceData.category) newErrors.category = 'Debe seleccionar una categoría';
    if (!serviceData.description) newErrors.description = 'Debe ingresar una descripción';
    if (!serviceData.shortDescription)
      newErrors.shortDescription = 'Debe ingresar una descripción corta';
    if (serviceData.pricing.amount <= 0)
      newErrors['pricing.amount'] = 'Debe ingresar un precio válido';
    if (!serviceData.duration.estimated)
      newErrors['duration.estimated'] = 'Debe ingresar duración estimada';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      setErrorMessage('Por favor complete todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Llamar a la API real para actualizar el servicio usando ID único
      const response = await fetch(`/api/provider/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: serviceData.name,
          category: serviceData.category,
          description: serviceData.description,
          shortDescription: serviceData.shortDescription,
          pricing: {
            type: serviceData.pricing.type,
            amount: Math.round(serviceData.pricing.amount), // ✅ Asegurar entero
            currency: serviceData.pricing.currency,
            minimumCharge: serviceData.pricing.minimumCharge
              ? Math.round(serviceData.pricing.minimumCharge)
              : undefined,
          },
          duration: {
            estimated: serviceData.duration.estimated,
            unit: serviceData.duration.unit,
          },
          availability: {
            active: serviceData.availability.active,
            regions: serviceData.availability.regions,
            emergency: serviceData.availability.emergency,
          },
          features: serviceData.features, // ✅ Incluir características
          requirements: serviceData.requirements, // ✅ Incluir requisitos
          tags: serviceData.tags, // ✅ Incluir etiquetas
          images: serviceData.existingImages, // ✅ Incluir imágenes existentes (las nuevas se subirían por separado)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el servicio');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar el servicio');
      }

      logger.info('Servicio actualizado exitosamente', {
        serviceId,
        name: serviceData.name,
        category: serviceData.category,
        features: serviceData.features,
        requirements: serviceData.requirements,
        tags: serviceData.tags,
        imagesCount: serviceData.existingImages.length,
      });

      console.log('✅ [PROVIDER SERVICES EDIT] Servicio actualizado:', {
        serviceId,
        name: serviceData.name,
        features: serviceData.features,
        requirements: serviceData.requirements,
        tags: serviceData.tags,
        images: serviceData.existingImages,
        payload: {
          features: serviceData.features,
          requirements: serviceData.requirements,
          tags: serviceData.tags,
          images: serviceData.existingImages,
        },
      });

      setSuccessMessage('Servicio actualizado exitosamente');

      setTimeout(() => {
        router.push(`/provider/services/${serviceId}`);
      }, 2000);
    } catch (error) {
      logger.error('Error al actualizar servicio', {
        error: error instanceof Error ? error.message : String(error),
        serviceId,
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al actualizar el servicio. Por favor intente nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/provider/services/${serviceId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: serviceData.pricing.currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando servicio...</span>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Servicio</h1>
            <p className="text-gray-600">Modifica la información de tu servicio</p>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre del Servicio *</Label>
                  <Input
                    id="name"
                    value={serviceData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Reparación de Grifería Completa"
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={serviceData.category}
                    onValueChange={value => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600 mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="shortDescription">Descripción Corta *</Label>
                  <Input
                    id="shortDescription"
                    value={serviceData.shortDescription}
                    onChange={e => handleInputChange('shortDescription', e.target.value)}
                    placeholder="Breve descripción que aparecerá en listados"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {serviceData.shortDescription.length}/100 caracteres
                  </p>
                  {errors.shortDescription && (
                    <p className="text-sm text-red-600 mt-1">{errors.shortDescription}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descripción Detallada *</Label>
                  <Textarea
                    id="description"
                    value={serviceData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="Describe detalladamente el servicio, qué incluye, proceso, etc."
                    rows={6}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Precios y Duración */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Precios y Duración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pricingType">Tipo de Precio</Label>
                    <Select
                      value={serviceData.pricing.type}
                      onValueChange={value => handleInputChange('pricing.type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Precio Fijo</SelectItem>
                        <SelectItem value="hourly">Por Hora</SelectItem>
                        <SelectItem value="quote">Cotización</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <Select
                      value={serviceData.pricing.currency}
                      onValueChange={value => handleInputChange('pricing.currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">
                      {serviceData.pricing.type === 'hourly' ? 'Precio por Hora' : 'Precio'} *
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={serviceData.pricing.amount || ''}
                      onChange={e =>
                        handleInputChange('pricing.amount', parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                    />
                    {errors['pricing.amount'] && (
                      <p className="text-sm text-red-600 mt-1">{errors['pricing.amount']}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="minimumCharge">Cargo Mínimo (opcional)</Label>
                    <Input
                      id="minimumCharge"
                      type="number"
                      value={serviceData.pricing.minimumCharge || ''}
                      onChange={e =>
                        handleInputChange('pricing.minimumCharge', parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Precio mostrado:</strong>{' '}
                    {serviceData.pricing.type === 'hourly'
                      ? `${formatCurrency(serviceData.pricing.amount)}/hora`
                      : serviceData.pricing.type === 'quote'
                        ? 'Cotización personalizada'
                        : formatCurrency(serviceData.pricing.amount)}
                    {serviceData.pricing.minimumCharge &&
                    serviceData.pricing.minimumCharge > serviceData.pricing.amount &&
                    serviceData.pricing.type !== 'quote'
                      ? ` (mínimo ${formatCurrency(serviceData.pricing.minimumCharge)})`
                      : ''}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedDuration">Duración Estimada *</Label>
                    <Input
                      id="estimatedDuration"
                      value={serviceData.duration.estimated}
                      onChange={e => handleInputChange('duration.estimated', e.target.value)}
                      placeholder="Ej: 2"
                    />
                    {errors['duration.estimated'] && (
                      <p className="text-sm text-red-600 mt-1">{errors['duration.estimated']}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="durationUnit">Unidad</Label>
                    <Select
                      value={serviceData.duration.unit}
                      onValueChange={value => handleInputChange('duration.unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutos</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                        <SelectItem value="days">Días</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Características */}
            <Card>
              <CardHeader>
                <CardTitle>Características del Servicio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Características Principales</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newFeature}
                      onChange={e => setNewFeature(e.target.value)}
                      placeholder="Ej: Reparación de fugas"
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                  {serviceData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {serviceData.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {feature}
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Requisitos del Servicio</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newRequirement}
                      onChange={e => setNewRequirement(e.target.value)}
                      placeholder="Ej: Acceso al baño principal"
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    />
                    <Button type="button" onClick={addRequirement} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                  {serviceData.requirements.length > 0 && (
                    <div className="space-y-2">
                      {serviceData.requirements.map((requirement, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm">{requirement}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeRequirement(requirement)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Disponibilidad y Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Disponibilidad y Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="serviceActive"
                    checked={serviceData.availability.active}
                    onCheckedChange={checked => handleInputChange('availability.active', checked)}
                  />
                  <Label htmlFor="serviceActive">Servicio activo y disponible</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="emergencyService"
                    checked={serviceData.availability.emergency}
                    onCheckedChange={checked =>
                      handleInputChange('availability.emergency', checked)
                    }
                  />
                  <Label htmlFor="emergencyService">Servicio de emergencias disponible</Label>
                </div>

                <div>
                  <Label>Regiones donde se presta el servicio</Label>
                  <div className="flex gap-2 mb-2">
                    <Select value={newRegion} onValueChange={setNewRegion}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar región" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(region => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addRegion} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                  {serviceData.availability.regions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {serviceData.availability.regions.map(region => (
                        <Badge key={region} variant="outline" className="flex items-center gap-1">
                          {region}
                          <button
                            type="button"
                            onClick={() => removeRegion(region)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Etiquetas e Imágenes */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Etiquetas e Imágenes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Etiquetas para búsqueda</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      placeholder="Ej: reparación, baño, plomería"
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Tag className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                  {serviceData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {serviceData.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="flex items-center gap-1">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Imágenes existentes */}
                {serviceData.existingImages.length > 0 && (
                  <div>
                    <Label>Imágenes Actuales</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {serviceData.existingImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Imagen actual ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 w-6 h-6 p-0"
                            onClick={() => removeExistingImage(image)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="images">Agregar Nuevas Imágenes (opcional)</Label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Formatos: JPG, PNG. Máximo 10 imágenes adicionales de 5MB cada una.
                  </p>
                </div>

                {serviceData.images.length > 0 && (
                  <div>
                    <Label>Imágenes Nuevas a Agregar</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {serviceData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Nueva imagen ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 w-6 h-6 p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Advertencia de Cambios */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Cambios Inmediatos</p>
                  <p className="text-orange-700 mt-1">
                    Los cambios que realices serán visibles inmediatamente para los clientes que
                    busquen este servicio. Asegúrate de que toda la información sea correcta antes
                    de guardar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando Cambios...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
