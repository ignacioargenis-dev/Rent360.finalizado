'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  ArrowLeft,
  Save,
  MapPin,
  DollarSign,
  Building,
  Users,
  ImageIcon,
  Upload,
} from 'lucide-react';
import { User } from '@/types';

interface PropertyForm {
  title: string;
  address: string;
  city: string;
  region: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  description: string;
  propertyType: string;
  furnished: boolean;
  parking: boolean;
  petsAllowed: boolean;
  images: File[];
}

export default function BrokerNewPropertyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PropertyForm>({
    title: '',
    address: '',
    city: '',
    region: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    description: '',
    propertyType: 'apartment',
    furnished: false,
    parking: false,
    petsAllowed: false,
    images: [],
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    loadUserData();
  }, []);

  const handleInputChange = (field: keyof PropertyForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFormData(prev => ({
        ...prev,
        images: Array.from(files),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.address.trim() || !formData.price) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement actual API call to create property
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful creation
      alert('Propiedad creada exitosamente');

      // Redirect back to properties list
      router.push('/broker/properties');
    } catch (error) {
      logger.error('Error creating property:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al crear la propiedad. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/broker/properties');
  };

  return (
    <UnifiedDashboardLayout
      title="Nueva Propiedad"
      subtitle="Registra una nueva propiedad en el sistema"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva Propiedad</h1>
              <p className="text-gray-600">Complete el formulario para registrar una propiedad</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Información de la Propiedad
                    </CardTitle>
                    <CardDescription>Detalles principales de la propiedad</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium">
                        Título de la Propiedad *
                      </Label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="Ej: Hermoso departamento en Las Condes"
                        value={formData.title}
                        onChange={e => handleInputChange('title', e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <Label htmlFor="address" className="text-sm font-medium">
                        Dirección *
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Ej: Av. Providencia 1234"
                        value={formData.address}
                        onChange={e => handleInputChange('address', e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    {/* Location */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Ciudad</Label>
                        <Select
                          value={formData.city}
                          onValueChange={value => handleInputChange('city', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seleccione ciudad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="santiago">Santiago</SelectItem>
                            <SelectItem value="vina-del-mar">Viña del Mar</SelectItem>
                            <SelectItem value="concepcion">Concepción</SelectItem>
                            <SelectItem value="antofagasta">Antofagasta</SelectItem>
                            <SelectItem value="temuco">Temuco</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Región</Label>
                        <Select
                          value={formData.region}
                          onValueChange={value => handleInputChange('region', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seleccione región" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="metropolitana">Metropolitana</SelectItem>
                            <SelectItem value="valparaiso">Valparaíso</SelectItem>
                            <SelectItem value="biobio">Biobío</SelectItem>
                            <SelectItem value="antofagasta">Antofagasta</SelectItem>
                            <SelectItem value="araucania">Araucanía</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="price" className="text-sm font-medium">
                          Precio (CLP) *
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="Ej: 500000"
                          value={formData.price}
                          onChange={e => handleInputChange('price', e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="bedrooms" className="text-sm font-medium">
                          Dormitorios
                        </Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          placeholder="Ej: 2"
                          value={formData.bedrooms}
                          onChange={e => handleInputChange('bedrooms', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bathrooms" className="text-sm font-medium">
                          Baños
                        </Label>
                        <Input
                          id="bathrooms"
                          type="number"
                          placeholder="Ej: 1"
                          value={formData.bathrooms}
                          onChange={e => handleInputChange('bathrooms', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="area" className="text-sm font-medium">
                          Área (m²)
                        </Label>
                        <Input
                          id="area"
                          type="number"
                          placeholder="Ej: 65"
                          value={formData.area}
                          onChange={e => handleInputChange('area', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Property Type */}
                    <div>
                      <Label className="text-sm font-medium">Tipo de Propiedad</Label>
                      <Select
                        value={formData.propertyType}
                        onValueChange={value => handleInputChange('propertyType', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Departamento</SelectItem>
                          <SelectItem value="house">Casa</SelectItem>
                          <SelectItem value="office">Oficina</SelectItem>
                          <SelectItem value="warehouse">Bodega</SelectItem>
                          <SelectItem value="land">Terreno</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Características</Label>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="furnished"
                            checked={formData.furnished}
                            onCheckedChange={checked =>
                              handleInputChange('furnished', checked as boolean)
                            }
                          />
                          <Label htmlFor="furnished" className="text-sm">
                            Amoblado
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="parking"
                            checked={formData.parking}
                            onCheckedChange={checked =>
                              handleInputChange('parking', checked as boolean)
                            }
                          />
                          <Label htmlFor="parking" className="text-sm">
                            Estacionamiento
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="petsAllowed"
                            checked={formData.petsAllowed}
                            onCheckedChange={checked =>
                              handleInputChange('petsAllowed', checked as boolean)
                            }
                          />
                          <Label htmlFor="petsAllowed" className="text-sm">
                            Mascotas permitidas
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium">
                        Descripción
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describa detalladamente la propiedad..."
                        value={formData.description}
                        onChange={e => handleInputChange('description', e.target.value)}
                        className="mt-1 min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div>
                {/* Images Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Imágenes
                    </CardTitle>
                    <CardDescription>Suba fotos de la propiedad</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Arrastra y suelta imágenes aquí o
                        </p>
                        <Label htmlFor="images" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-800">
                            selecciona archivos
                          </span>
                          <Input
                            id="images"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </Label>
                      </div>

                      {formData.images.length > 0 && (
                        <div className="text-sm text-gray-600">
                          {formData.images.length} imagen(es) seleccionada(s)
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Vista Previa</CardTitle>
                    <CardDescription>Resumen de la propiedad</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="truncate">
                          {formData.title || 'Título de la propiedad'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{formData.address || 'Dirección'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span>
                          {formData.price
                            ? `$${parseInt(formData.price).toLocaleString()}`
                            : 'Precio'}
                        </span>
                      </div>

                      {formData.bedrooms && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{formData.bedrooms} dormitorio(s)</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Crear Propiedad
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
