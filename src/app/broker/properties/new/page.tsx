'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, 
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
  AlertCircle, Info, User as UserIcon,
  FileText,
  Calendar,
  Phone,
  Mail,
  MessageCircle } from 'lucide-react';
import { User, Property } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
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
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerContactPreference: 'email' | 'phone' | 'whatsapp' | 'platform';
  commissionRate: number;
  exclusive: boolean;
  contractType: 'rental' | 'sale' | 'both';
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
  { id: 'laundry', label: 'Lavandería', icon: Home },
  { id: 'balcony', label: 'Balcón', icon: Building },
  { id: 'garden', label: 'Jardín', icon: Home },
  { id: 'air_conditioning', label: 'Aire acondicionado', icon: Star },
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
  'O\'Higgins',
  'Tarapacá',
  'Atacama',
  'Los Ríos',
  'Aysén',
  'Magallanes',
  'Arica y Parinacota',
  'Ñuble',
];

export default function BrokerNewPropertyPage() {
  const { user, loading: userLoading } = useUserState();

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
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerContactPreference: 'platform',
    commissionRate: 5,
    exclusive: false,
    contractType: 'rental',
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
}
        if (!formData.description.trim()) {
newErrors.description = 'La descripción es requerida';
}
        if (!formData.propertyType) {
newErrors.propertyType = 'El tipo de propiedad es requerido';
}
        if (!formData.contractType) {
newErrors.contractType = 'El tipo de contrato es requerido';
}
        break;
      case 2:
        if (!formData.address.trim()) {
newErrors.address = 'La dirección es requerida';
}
        if (!formData.city.trim()) {
newErrors.city = 'La ciudad es requerida';
}
        if (!formData.commune.trim()) {
newErrors.commune = 'La comuna es requerida';
}
        if (!formData.region) {
newErrors.region = 'La región es requerida';
}
        break;
      case 3:
        if (formData.price <= 0) {
newErrors.price = 'El precio debe ser mayor a 0';
}
        if (formData.commissionRate < 0 || formData.commissionRate > 20) {
          newErrors.commissionRate = 'La comisión debe estar entre 0% y 20%';
        }
        if (formData.bedrooms < 0) {
newErrors.bedrooms = 'El número de dormitorios no puede ser negativo';
}
        if (formData.bathrooms < 0) {
newErrors.bathrooms = 'El número de baños no puede ser negativo';
}
        if (formData.area <= 0) {
newErrors.area = 'El área debe ser mayor a 0';
}
        break;
      case 4:
        if (!formData.ownerName.trim()) {
newErrors.ownerName = 'El nombre del propietario es requerido';
}
        if (!formData.ownerEmail.trim()) {
newErrors.ownerEmail = 'El email del propietario es requerido';
}
        if (!formData.ownerPhone.trim()) {
newErrors.ownerPhone = 'El teléfono del propietario es requerido';
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

  const handleInputChange = (field: keyof PropertyFormData, value: string | number | string[] | File[] | boolean) => {
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

  const calculateCommission = () => {
    return (formData.price * formData.commissionRate) / 100;
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
      formDataToSend.append('commissionRate', formData.commissionRate.toString());
      formDataToSend.append('availableFrom', formData.availabilityDate);
      formDataToSend.append('contactName', formData.ownerName);
      formDataToSend.append('contactPhone', formData.ownerPhone);
      formDataToSend.append('contactEmail', formData.ownerEmail);
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
        window.location.href = '/broker/properties';
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear la propiedad');
      }
    } catch (error) {
      logger.error('Error creating property:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al crear la propiedad');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
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
    <EnhancedDashboardLayout
      user={user}
      title="Nueva Propiedad"
      subtitle="Registra una nueva propiedad"
    >
      <DashboardHeader 
        user={user}
        title="Nueva Propiedad"
        subtitle="Publica una nueva propiedad como corredor"
      />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Progreso de Publicación</h2>
                <span className="text-sm text-gray-600">Paso {step} de 5</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= stepNumber
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {stepNumber}
                    </div>
                    {stepNumber < 5 && (
                      <div
                        className={`w-16 h-1 ${
                          step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
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
                          onChange={(e) => handleInputChange('title', e.target.value)}
                        />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
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
                          placeholder="Describe las características principales de la propiedad..."
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Propiedad *
                          </label>
                          <select
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.propertyType ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={formData.propertyType}
                            onChange={(e) => handleInputChange('propertyType', e.target.value)}
                          >
                            <option value="">Selecciona un tipo</option>
                            {propertyTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          {errors.propertyType && <p className="text-red-500 text-sm mt-1">{errors.propertyType}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Contrato *
                          </label>
                          <select
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.contractType ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={formData.contractType}
                            onChange={(e) => handleInputChange('contractType', e.target.value)}
                          >
                            <option value="">Selecciona un tipo</option>
                            <option value="rental">Arriendo</option>
                            <option value="sale">Venta</option>
                            <option value="both">Arriendo y Venta</option>
                          </select>
                          {errors.contractType && <p className="text-red-500 text-sm mt-1">{errors.contractType}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={formData.exclusive}
                            onChange={(e) => handleInputChange('exclusive', e.target.checked)}
                          />
                          <span className="text-sm font-medium text-gray-700">Propiedad exclusiva</span>
                        </label>
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
                          onChange={(e) => handleInputChange('address', e.target.value)}
                        />
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
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
                            onChange={(e) => handleInputChange('city', e.target.value)}
                          />
                          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
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
                            onChange={(e) => handleInputChange('commune', e.target.value)}
                          />
                          {errors.commune && <p className="text-red-500 text-sm mt-1">{errors.commune}</p>}
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
                            onChange={(e) => handleInputChange('region', e.target.value)}
                          >
                            <option value="">Selecciona una región</option>
                            {regions.map((region) => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                          {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Detalles y Comisiones</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio (CLP) *
                          </label>
                          <input
                            type="number"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.price ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="550000"
                            value={formData.price || ''}
                            onChange={(e) => handleInputChange('price', Number(e.target.value))}
                          />
                          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comisión (%) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="20"
                              className={`w-full px-4 py-2 pr-16 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.commissionRate ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="5"
                              value={formData.commissionRate || ''}
                              onChange={(e) => handleInputChange('commissionRate', Number(e.target.value))}
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                          </div>
                          {errors.commissionRate && <p className="text-red-500 text-sm mt-1">{errors.commissionRate}</p>}
                          {formData.price > 0 && formData.commissionRate > 0 && (
                            <p className="text-sm text-green-600 mt-1">
                              Comisión estimada: {formatPrice(calculateCommission())}
                            </p>
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
                            onChange={(e) => handleInputChange('deposit', Number(e.target.value))}
                          />
                          {errors.deposit && <p className="text-red-500 text-sm mt-1">{errors.deposit}</p>}
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
                            onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}
                          />
                          {errors.bedrooms && <p className="text-red-500 text-sm mt-1">{errors.bedrooms}</p>}
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
                            onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                          />
                          {errors.bathrooms && <p className="text-red-500 text-sm mt-1">{errors.bathrooms}</p>}
                        </div>

                        <div>
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
                            onChange={(e) => handleInputChange('area', Number(e.target.value))}
                          />
                          {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Características
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {propertyFeatures.map((feature) => {
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
                    <h3 className="text-lg font-semibold mb-4">Información del Propietario</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Propietario *
                          </label>
                          <input
                            type="text"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.ownerName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="María González"
                            value={formData.ownerName}
                            onChange={(e) => handleInputChange('ownerName', e.target.value)}
                          />
                          {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email del Propietario *
                          </label>
                          <input
                            type="email"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.ownerEmail ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="maria@ejemplo.com"
                            value={formData.ownerEmail}
                            onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                          />
                          {errors.ownerEmail && <p className="text-red-500 text-sm mt-1">{errors.ownerEmail}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono del Propietario *
                          </label>
                          <input
                            type="tel"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.ownerPhone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="+56 9 1234 5678"
                            value={formData.ownerPhone}
                            onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                          />
                          {errors.ownerPhone && <p className="text-red-500 text-sm mt-1">{errors.ownerPhone}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preferencia de Contacto
                          </label>
                          <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.ownerContactPreference}
                            onChange={(e) => handleInputChange('ownerContactPreference', e.target.value)}
                          >
                            <option value="platform">A través de la plataforma</option>
                            <option value="email">Email</option>
                            <option value="phone">Teléfono</option>
                            <option value="whatsapp">WhatsApp</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
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
                          onChange={(e) => handleInputChange('availabilityDate', e.target.value)}
                        />
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">Resumen de la Publicación</h4>
                            <div className="text-sm text-blue-700 space-y-1">
                              <p><strong>Propiedad:</strong> {formData.title}</p>
                              <p><strong>Precio:</strong> {formatPrice(formData.price)}</p>
                              <p><strong>Comisión:</strong> {formData.commissionRate}% ({formatPrice(calculateCommission())})</p>
                              <p><strong>Propietario:</strong> {formData.ownerName}</p>
                              <p><strong>Contacto:</strong> {formData.ownerEmail}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                >
                  Anterior
                </Button>
                
                <div className="flex gap-2">
                  {step < 5 ? (
                    <Button onClick={nextStep}>
                      Siguiente
                    </Button>
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
    </EnhancedDashboardLayout>
  );
}
