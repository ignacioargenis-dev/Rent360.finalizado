'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Save,
  X,
  Upload,
  MapPin,
  Home,
  Building,
  DollarSign,
  Bed,
  Bath,
  Square,
  Car,
  Warehouse,
  Dumbbell,
  Shield,
  Wifi,
  Camera,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Property } from '@/types';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface PropertyFormData {
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
  propertyType: 'apartment' | 'house' | 'office' | 'commercial' | 'room';
  features: string[];
  images: File[];
  availabilityDate: string;
  contactPreference: 'email' | 'phone' | 'whatsapp' | 'platform';
}

const propertyFeatures = [
  { id: 'parking', label: 'Estacionamiento', icon: Car },
  { id: 'storage', label: 'Bodega', icon: Warehouse },
  { id: 'gym', label: 'Gimnasio', icon: Dumbbell },
  { id: 'security', label: 'Seguridad 24/7', icon: Shield },
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'furnished', label: 'Amoblado', icon: Home },
  { id: 'pets', label: 'Permitido mascotas', icon: Star },
  { id: 'pool', label: 'Piscina', icon: Building },
];

const propertyTypes = [
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'office', label: 'Oficina' },
  { value: 'commercial', label: 'Local Comercial' },
  { value: 'room', label: 'Habitación' },
];

const regions = [
  'Metropolitana de Santiago',
  'Valparaíso',
  'Antofagasta',
  'Coquimbo',
  'Araucanía',
  'Los Lagos',
  'Biobío',
  'Maule',
  "O'Higgins",
  'Tarapacá',
  'Atacama',
  'Los Ríos',
  'Aysén',
  'Magallanes',
  'Arica y Parinacota',
  'Ñuble',
];

export default function NewPropertyPage() {
  const { user } = useUserState();

  // Define empty arrays with explicit types
  const emptyFeatures: string[] = [];
  const emptyImages: File[] = [];

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    address: '',
    city: '',
    commune: '',
    region: '',
    price: 0,
    deposit: 0,
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    propertyType: 'apartment',
    features: emptyFeatures,
    images: emptyImages,
    availabilityDate: '',
    contactPreference: 'platform',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) {
          newErrors.title = 'El título es requerido';
        } else if (formData.title.trim().length < 5) {
          newErrors.title = 'El título debe tener al menos 5 caracteres';
        } else if (formData.title.trim().length > 200) {
          newErrors.title = 'El título no puede exceder 200 caracteres';
        }

        if (!formData.description.trim()) {
          newErrors.description = 'La descripción es requerida';
        } else if (formData.description.trim().length < 20) {
          newErrors.description = 'La descripción debe tener al menos 20 caracteres';
        } else if (formData.description.trim().length > 2000) {
          newErrors.description = 'La descripción no puede exceder 2000 caracteres';
        }

        if (!formData.propertyType) {
          newErrors.propertyType = 'El tipo de propiedad es requerido';
        }
        break;

      case 2:
        if (!formData.address.trim()) {
          newErrors.address = 'La dirección es requerida';
        } else if (formData.address.trim().length < 10) {
          newErrors.address = 'La dirección debe tener al menos 10 caracteres';
        }

        if (!formData.city.trim()) {
          newErrors.city = 'La ciudad es requerida';
        } else if (formData.city.trim().length < 2) {
          newErrors.city = 'La ciudad debe tener al menos 2 caracteres';
        }

        if (!formData.commune.trim()) {
          newErrors.commune = 'La comuna es requerida';
        } else if (formData.commune.trim().length < 2) {
          newErrors.commune = 'La comuna debe tener al menos 2 caracteres';
        }

        if (!formData.region) {
          newErrors.region = 'La región es requerida';
        }
        break;

      case 3:
        if (formData.price <= 0) {
          newErrors.price = 'El precio debe ser mayor a 0';
        } else if (formData.price > 10000000) {
          newErrors.price = 'El precio no puede exceder $10,000,000';
        }

        if (formData.deposit < 0) {
          newErrors.deposit = 'El depósito no puede ser negativo';
        } else if (formData.deposit > formData.price * 2) {
          newErrors.deposit = 'El depósito no puede exceder el doble del precio';
        }

        if (formData.bedrooms < 0) {
          newErrors.bedrooms = 'El número de dormitorios no puede ser negativo';
        } else if (formData.bedrooms > 20) {
          newErrors.bedrooms = 'El número de dormitorios no puede exceder 20';
        }

        if (formData.bathrooms < 0) {
          newErrors.bathrooms = 'El número de baños no puede ser negativo';
        } else if (formData.bathrooms > 20) {
          newErrors.bathrooms = 'El número de baños no puede exceder 20';
        }

        if (formData.area <= 0) {
          newErrors.area = 'El área debe ser mayor a 0';
        } else if (formData.area > 10000) {
          newErrors.area = 'El área no puede exceder 10,000 m²';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleInputChange = (
    field: keyof PropertyFormData,
    value: string | number | string[] | File[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId],
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Validate file types
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      alert('Solo se permiten imágenes en formato JPEG, PNG o WebP');
    }

    // Validate file size (max 5MB per file)
    const sizeValidFiles = validFiles.filter(file => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      return file.size <= maxSize;
    });

    if (sizeValidFiles.length !== validFiles.length) {
      alert('Las imágenes no pueden superar los 5MB cada una');
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...sizeValidFiles],
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) {
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add all property data
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('commune', formData.commune);
      formDataToSend.append('region', formData.region);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('deposit', formData.deposit.toString());
      formDataToSend.append('bedrooms', formData.bedrooms.toString());
      formDataToSend.append('bathrooms', formData.bathrooms.toString());
      formDataToSend.append('area', formData.area.toString());
      formDataToSend.append('type', formData.propertyType);
      formDataToSend.append('furnished', formData.features.includes('furnished').toString());
      formDataToSend.append('petFriendly', formData.features.includes('pets').toString());
      formDataToSend.append('parkingSpaces', formData.features.includes('parking') ? '1' : '0');
      formDataToSend.append('availableFrom', formData.availabilityDate);
      formDataToSend.append('contactName', user?.name || '');
      formDataToSend.append('contactPhone', user?.phone || '');
      formDataToSend.append('contactEmail', user?.email || '');
      formDataToSend.append('features', JSON.stringify(formData.features));

      // Add images
      formData.images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      const response = await fetch('/api/properties', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        alert('Propiedad creada exitosamente');
        // Redirect to properties list
        window.location.href = '/owner/properties';
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear la propiedad');
      }
    } catch (error) {
      logger.error('Error creating property:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al crear la propiedad');
    } finally {
      setLoading(false);
    }
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
    <UnifiedDashboardLayout>
      <DashboardHeader
        user={user}
        title="Nueva Propiedad"
        subtitle="Publica una nueva propiedad en Rent360"
      />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Progreso de Publicación</h2>
                <span className="text-sm text-gray-600">Paso {step} de 4</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(stepNumber => (
                  <div key={stepNumber} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {stepNumber}
                    </div>
                    {stepNumber < 4 && (
                      <div
                        className={`w-16 h-1 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Content */}
          <Card>
            <CardContent className="pt-6">
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título de la Propiedad *
                        </label>
                        <input
                          type="text"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.title ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Ej: Departamento Las Condes con vista panorámica"
                          value={formData.title}
                          onChange={e => handleInputChange('title', e.target.value)}
                        />
                        {errors.title && (
                          <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción *
                        </label>
                        <textarea
                          rows={4}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.description ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Describe las características principales de tu propiedad..."
                          value={formData.description}
                          onChange={e => handleInputChange('description', e.target.value)}
                        />
                        {errors.description && (
                          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Propiedad *
                        </label>
                        <select
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.propertyType ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={formData.propertyType}
                          onChange={e => handleInputChange('propertyType', e.target.value)}
                        >
                          <option value="">Selecciona un tipo</option>
                          {propertyTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        {errors.propertyType && (
                          <p className="text-red-500 text-sm mt-1">{errors.propertyType}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Ubicación</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dirección *
                        </label>
                        <input
                          type="text"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Ej: Av. Apoquindo 3400"
                          value={formData.address}
                          onChange={e => handleInputChange('address', e.target.value)}
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ciudad *
                          </label>
                          <input
                            type="text"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.city ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Ej: Santiago"
                            value={formData.city}
                            onChange={e => handleInputChange('city', e.target.value)}
                          />
                          {errors.city && (
                            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comuna *
                          </label>
                          <input
                            type="text"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.commune ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Ej: Las Condes"
                            value={formData.commune}
                            onChange={e => handleInputChange('commune', e.target.value)}
                          />
                          {errors.commune && (
                            <p className="text-red-500 text-sm mt-1">{errors.commune}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Región *
                          </label>
                          <select
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.region ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={formData.region}
                            onChange={e => handleInputChange('region', e.target.value)}
                          >
                            <option value="">Selecciona una región</option>
                            {regions.map(region => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                          {errors.region && (
                            <p className="text-red-500 text-sm mt-1">{errors.region}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Detalles y Características</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio de Arriendo (CLP) *
                          </label>
                          <input
                            type="number"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.price ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="550000"
                            value={formData.price || ''}
                            onChange={e => handleInputChange('price', Number(e.target.value))}
                          />
                          {errors.price && (
                            <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Depósito (CLP)
                          </label>
                          <input
                            type="number"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.deposit ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="550000"
                            value={formData.deposit || ''}
                            onChange={e => handleInputChange('deposit', Number(e.target.value))}
                          />
                          {errors.deposit && (
                            <p className="text-red-500 text-sm mt-1">{errors.deposit}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dormitorios *
                          </label>
                          <input
                            type="number"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.bedrooms ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="2"
                            value={formData.bedrooms || ''}
                            onChange={e => handleInputChange('bedrooms', Number(e.target.value))}
                          />
                          {errors.bedrooms && (
                            <p className="text-red-500 text-sm mt-1">{errors.bedrooms}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Baños *
                          </label>
                          <input
                            type="number"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.bathrooms ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="2"
                            value={formData.bathrooms || ''}
                            onChange={e => handleInputChange('bathrooms', Number(e.target.value))}
                          />
                          {errors.bathrooms && (
                            <p className="text-red-500 text-sm mt-1">{errors.bathrooms}</p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Superficie (m²) *
                          </label>
                          <input
                            type="number"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.area ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="85"
                            value={formData.area || ''}
                            onChange={e => handleInputChange('area', Number(e.target.value))}
                          />
                          {errors.area && (
                            <p className="text-red-500 text-sm mt-1">{errors.area}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Características
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {propertyFeatures.map(feature => {
                            const Icon = feature.icon;
                            const isSelected = formData.features.includes(feature.id);
                            return (
                              <button
                                key={feature.id}
                                type="button"
                                className={`p-3 border rounded-lg text-center transition-colors ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                                onClick={() => toggleFeature(feature.id)}
                              >
                                <Icon className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-xs">{feature.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Imágenes y Publicación</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Fotos de la Propiedad
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">
                            Arrastra tus imágenes aquí o haz clic para seleccionar
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            PNG, JPG, GIF hasta 10MB cada una
                          </p>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            id="image-upload"
                            onChange={handleImageUpload}
                          />
                          <Button asChild>
                            <label htmlFor="image-upload" className="cursor-pointer">
                              <Camera className="w-4 h-4 mr-2" />
                              Seleccionar Imágenes
                            </label>
                          </Button>
                        </div>

                        {formData.images.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Imágenes seleccionadas ({formData.images.length})
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {formData.images.map((image, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={URL.createObjectURL(image)}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                    onClick={() => removeImage(index)}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Disponibilidad
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.availabilityDate}
                          onChange={e => handleInputChange('availabilityDate', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preferencia de Contacto
                        </label>
                        <select
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.contactPreference}
                          onChange={e => handleInputChange('contactPreference', e.target.value)}
                        >
                          <option value="platform">A través de la plataforma</option>
                          <option value="email">Email</option>
                          <option value="phone">Teléfono</option>
                          <option value="whatsapp">WhatsApp</option>
                        </select>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">
                              Información importante
                            </h4>
                            <p className="text-sm text-blue-700">
                              Al publicar tu propiedad, aceptas nuestros términos y condiciones. La
                              propiedad será revisada por nuestro equipo antes de ser publicada.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button variant="outline" onClick={prevStep} disabled={step === 1}>
                  Anterior
                </Button>

                <div className="flex gap-2">
                  {step < 4 ? (
                    <Button onClick={nextStep}>Siguiente</Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={loading}>
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Publicando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Publicar Propiedad
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
