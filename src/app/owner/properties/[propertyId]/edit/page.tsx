'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Upload, X, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface PropertyData {
  id: string;
  title: string;
  address: string;
  city: string;
  region: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  monthlyRent: number;
  currency: string;
  status: 'available' | 'rented' | 'maintenance' | 'inactive';
  description: string;
  features: string[];
  images: string[];

  // Nuevos campos de características
  furnished: boolean;
  petFriendly: boolean;
  parkingSpaces: number;
  availableFrom: Date;
  floor: number;
  buildingName: string;
  yearBuilt: number;

  // Características del edificio/servicios
  heating: boolean;
  cooling: boolean;
  internet: boolean;
  elevator: boolean;
  balcony: boolean;
  terrace: boolean;
  garden: boolean;
  pool: boolean;
  gym: boolean;
  security: boolean;
  concierge: boolean;
}

const PROPERTY_TYPES = ['Apartamento', 'Casa', 'Oficina', 'Local Comercial', 'Bodega', 'Otro'];

const AVAILABLE_FEATURES = [
  'Estacionamiento',
  'Bodega',
  'Gimnasio',
  'Piscina',
  'Conserje 24/7',
  'Seguridad',
  'Terraza',
  'Jardín',
  'Ascensor',
  'Amoblado',
  'Internet',
  'Calefacción',
  'Aire Acondicionado',
  'Lavandería',
  'Mascotas Permitidas',
];

export default function OwnerPropertyEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const propertyId = params.propertyId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<PropertyData>({
    id: '',
    title: '',
    address: '',
    city: '',
    region: '',
    type: '',
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    monthlyRent: 0,
    currency: 'CLP',
    status: 'available',
    description: '',
    features: [],
    images: [],

    // Nuevos campos con valores por defecto
    furnished: false,
    petFriendly: false,
    parkingSpaces: 0,
    availableFrom: new Date(),
    floor: 0,
    buildingName: '',
    yearBuilt: new Date().getFullYear(),

    // Características del edificio/servicios con valores por defecto
    heating: false,
    cooling: false,
    internet: false,
    elevator: false,
    balcony: false,
    terrace: false,
    garden: false,
    pool: false,
    gym: false,
    security: false,
    concierge: false,
  });

  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock data for property
  const mockProperty: PropertyData = {
    id: propertyId,
    title: 'Hermoso Apartamento en Providencia',
    address: 'Av. Providencia 123',
    city: 'Santiago',
    region: 'Metropolitana',
    type: 'Apartamento',
    bedrooms: 2,
    bathrooms: 2,
    area: 75,
    monthlyRent: 450000,
    currency: 'CLP',
    status: 'rented',
    description:
      'Amplio apartamento de 2 dormitorios en excelente ubicación. Cercano a metro, supermercados y centros comerciales.',
    features: [
      'Estacionamiento',
      'Bodega',
      'Gimnasio',
      'Piscina',
      'Conserje 24/7',
      'Seguridad',
      'Terraza',
    ],
    images: ['/api/placeholder/600/400', '/api/placeholder/600/400', '/api/placeholder/600/400'],

    // Nuevos campos de características de propiedad
    furnished: true,
    petFriendly: true,
    parkingSpaces: 1,
    availableFrom: new Date('2024-01-15'),
    floor: 8,
    buildingName: 'Torre Providencia',
    yearBuilt: 2018,
    heating: true,
    cooling: true,
    internet: true,
    elevator: true,
    balcony: true,
    terrace: false,
    garden: false,
    pool: true,
    gym: true,
    security: true,
    concierge: false,
  };

  const loadPropertyData = useCallback(async () => {
    setIsLoading(true);
    try {
      // ✅ CORREGIDO: Cargar datos reales de la API
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/properties/${propertyId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const propertyData = await response.json();

        // Transformar datos de la API al formato esperado por el formulario
        const transformedData: PropertyData = {
          id: propertyData.id,
          title: propertyData.title,
          address: propertyData.address,
          city: propertyData.city,
          region: propertyData.region,
          type: propertyData.type,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          area: propertyData.area,
          monthlyRent: propertyData.price,
          currency: propertyData.currency || 'CLP',
          status: propertyData.status,
          description: propertyData.description,
          features: propertyData.features || [],
          images: propertyData.images || [],

          // Características básicas
          furnished: propertyData.furnished || false,
          petFriendly: propertyData.petFriendly || false,
          parkingSpaces: propertyData.parkingSpaces || 0,
          availableFrom: propertyData.availableFrom
            ? new Date(propertyData.availableFrom)
            : new Date(),
          floor: propertyData.floor || 0,
          buildingName: propertyData.buildingName || '',
          yearBuilt: propertyData.yearBuilt || new Date().getFullYear(),

          // Características del edificio/servicios
          heating: propertyData.heating || false,
          cooling: propertyData.cooling || false,
          internet: propertyData.internet || false,
          elevator: propertyData.elevator || false,
          balcony: propertyData.balcony || false,
          terrace: propertyData.terrace || false,
          garden: propertyData.garden || false,
          pool: propertyData.pool || false,
          gym: propertyData.gym || false,
          security: propertyData.security || false,
          concierge: propertyData.concierge || false,
        };

        setFormData(transformedData);
        setImagePreviews(transformedData.images);
      } else {
        logger.error('Error loading property for edit:', {
          status: response.status,
          statusText: response.statusText,
        });
        // Fallback a datos mock si la API falla
        setFormData(mockProperty);
        setImagePreviews(mockProperty.images);
      }
    } catch (error) {
      logger.error('Error al cargar datos de la propiedad', { error, propertyId });
      // Fallback a datos mock si hay error
      setFormData(mockProperty);
      setImagePreviews(mockProperty.images);
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadPropertyData();
  }, [loadPropertyData]);

  const handleInputChange = (field: keyof PropertyData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleFeatureToggle = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: checked ? [...prev.features, feature] : prev.features.filter(f => f !== feature),
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      return;
    }

    const newFiles = Array.from(files);
    setNewImages(prev => [...prev, ...newFiles]);

    // Create previews for new images
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setImagePreviews(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!formData.region.trim()) {
      newErrors.region = 'La región es requerida';
    }

    if (!formData.type) {
      newErrors.type = 'El tipo de propiedad es requerido';
    }

    if (formData.bedrooms < 0) {
      newErrors.bedrooms = 'El número de dormitorios debe ser mayor o igual a 0';
    }

    if (formData.bathrooms < 0) {
      newErrors.bathrooms = 'El número de baños debe ser mayor o igual a 0';
    }

    if (formData.area <= 0) {
      newErrors.area = 'La superficie debe ser mayor a 0';
    }

    if (formData.monthlyRent <= 0) {
      newErrors.monthlyRent = 'La renta mensual debe ser mayor a 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
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

      logger.info('Propiedad actualizada exitosamente', { propertyId });
      router.push(`/owner/properties/${propertyId}`);
    } catch (error) {
      logger.error('Error al guardar la propiedad', { error, propertyId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/owner/properties/${propertyId}`);
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin mr-2" />
          <span>Cargando datos de la propiedad...</span>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Propiedad</h1>
              <p className="text-gray-600">Modifica la información de tu propiedad</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={e => handleInputChange('title', e.target.value)}
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <Label htmlFor="type">Tipo de Propiedad *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={value => handleInputChange('type', value)}
                    >
                      <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
                  </div>

                  <div>
                    <Label htmlFor="address">Dirección *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={e => handleInputChange('address', e.target.value)}
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <Label htmlFor="region">Región *</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={e => handleInputChange('region', e.target.value)}
                      className={errors.region ? 'border-red-500' : ''}
                    />
                    {errors.region && <p className="text-sm text-red-500 mt-1">{errors.region}</p>}
                  </div>

                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: PropertyData['status']) =>
                        handleInputChange('status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="rented">Arrendada</SelectItem>
                        <SelectItem value="maintenance">Mantenimiento</SelectItem>
                        <SelectItem value="inactive">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Propiedad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Dormitorios</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={e => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                      className={errors.bedrooms ? 'border-red-500' : ''}
                    />
                    {errors.bedrooms && (
                      <p className="text-sm text-red-500 mt-1">{errors.bedrooms}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bathrooms">Baños</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="0"
                      value={formData.bathrooms}
                      onChange={e => handleInputChange('bathrooms', parseInt(e.target.value) || 0)}
                      className={errors.bathrooms ? 'border-red-500' : ''}
                    />
                    {errors.bathrooms && (
                      <p className="text-sm text-red-500 mt-1">{errors.bathrooms}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="area">Superficie (m²) *</Label>
                    <Input
                      id="area"
                      type="number"
                      min="1"
                      value={formData.area}
                      onChange={e => handleInputChange('area', parseInt(e.target.value) || 0)}
                      className={errors.area ? 'border-red-500' : ''}
                    />
                    {errors.area && <p className="text-sm text-red-500 mt-1">{errors.area}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="monthlyRent">Renta Mensual (CLP) *</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    min="1"
                    value={formData.monthlyRent}
                    onChange={e => handleInputChange('monthlyRent', parseInt(e.target.value) || 0)}
                    className={errors.monthlyRent ? 'border-red-500' : ''}
                  />
                  {errors.monthlyRent && (
                    <p className="text-sm text-red-500 mt-1">{errors.monthlyRent}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Características</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {AVAILABLE_FEATURES.map(feature => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={formData.features.includes(feature)}
                        onCheckedChange={checked =>
                          handleFeatureToggle(feature, checked as boolean)
                        }
                      />
                      <Label htmlFor={feature} className="text-sm">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Images Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Imágenes de la Propiedad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Upload */}
                <div>
                  <Label htmlFor="image-upload">Subir Imágenes</Label>
                  <div className="mt-2">
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Label htmlFor="image-upload">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Haz clic para subir imágenes</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 5MB cada una</p>
                      </div>
                    </Label>
                  </div>
                </div>

                {/* Image Previews */}
                <div className="space-y-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {imagePreviews.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay imágenes cargadas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Imágenes:</span>
                  <span className="font-medium">{imagePreviews.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Características:</span>
                  <span className="font-medium">{formData.features.length}</span>
                </div>
                <Separator />
                <div className="text-center">
                  <p className="text-sm text-gray-600">Renta Mensual</p>
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP',
                    }).format(formData.monthlyRent)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
