'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
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
  User as UserIcon,
  FileText,
  Shield,
  Receipt,
  Zap,
  MoreHorizontal,
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
  // Owner information
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerRut: string;
  ownerIsRegistered: boolean;
  // Documents
  propertyDeed: File | null;
  certificateOfTitle: File | null;
  utilitiesBills: File[];
  propertyTaxReceipt: File | null;
  insurancePolicy: File | null;
  otherDocuments: File[];
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
    // Owner information
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerRut: '',
    ownerIsRegistered: false,
    // Documents
    propertyDeed: null,
    certificateOfTitle: null,
    utilitiesBills: [],
    propertyTaxReceipt: null,
    insurancePolicy: null,
    otherDocuments: [],
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

  const handleFileChange = (field: keyof PropertyForm, files: FileList | null) => {
    if (!files) return;

    if (field === 'utilitiesBills' || field === 'otherDocuments') {
      setFormData(prev => ({
        ...prev,
        [field]: Array.from(files),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: files[0] || null,
      }));
    }
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
      alert('Por favor complete todos los campos obligatorios de la propiedad.');
      return;
    }

    if (!formData.ownerName.trim() || !formData.ownerEmail.trim() || !formData.ownerPhone.trim()) {
      alert('Por favor complete toda la información del propietario.');
      return;
    }

    if (!formData.ownerRut.trim()) {
      alert('El RUT del propietario es obligatorio.');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add property data
      formDataToSend.append('title', formData.title);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('region', formData.region);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('bedrooms', formData.bedrooms);
      formDataToSend.append('bathrooms', formData.bathrooms);
      formDataToSend.append('area', formData.area);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('propertyType', formData.propertyType);
      formDataToSend.append('furnished', formData.furnished.toString());
      formDataToSend.append('parking', formData.parking.toString());
      formDataToSend.append('petsAllowed', formData.petsAllowed.toString());

      // Add owner data
      formDataToSend.append('ownerName', formData.ownerName);
      formDataToSend.append('ownerEmail', formData.ownerEmail);
      formDataToSend.append('ownerPhone', formData.ownerPhone);
      formDataToSend.append('ownerRut', formData.ownerRut);
      formDataToSend.append('ownerIsRegistered', formData.ownerIsRegistered.toString());

      // Add images
      formData.images.forEach((image, index) => {
        formDataToSend.append(`images`, image);
      });

      // Add documents
      if (formData.propertyDeed) {
        formDataToSend.append('propertyDeed', formData.propertyDeed);
      }
      if (formData.certificateOfTitle) {
        formDataToSend.append('certificateOfTitle', formData.certificateOfTitle);
      }
      if (formData.propertyTaxReceipt) {
        formDataToSend.append('propertyTaxReceipt', formData.propertyTaxReceipt);
      }
      if (formData.insurancePolicy) {
        formDataToSend.append('insurancePolicy', formData.insurancePolicy);
      }

      // Add multiple files
      formData.utilitiesBills.forEach((bill, index) => {
        formDataToSend.append(`utilitiesBills`, bill);
      });

      formData.otherDocuments.forEach((doc, index) => {
        formDataToSend.append(`otherDocuments`, doc);
      });

      const response = await fetch('/api/broker/properties', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        alert('Propiedad creada exitosamente con todos los documentos');

        // Redirect to the created property
        router.push(`/broker/properties/${result.propertyId}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la propiedad');
      }
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

                {/* Owner Information */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      Información del Propietario
                    </CardTitle>
                    <CardDescription>
                      Datos del propietario de la propiedad
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Owner Registration Status */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ownerIsRegistered"
                        checked={formData.ownerIsRegistered}
                        onCheckedChange={checked =>
                          handleInputChange('ownerIsRegistered', checked as boolean)
                        }
                      />
                      <Label htmlFor="ownerIsRegistered" className="text-sm">
                        El propietario ya está registrado en la plataforma
                      </Label>
                    </div>

                    {!formData.ownerIsRegistered && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 mb-4">
                          Como corredor, puedes registrar propiedades de propietarios que no están en la plataforma.
                          Tú tendrás control administrativo completo sobre esta propiedad.
                        </p>
                      </div>
                    )}

                    {/* Owner Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ownerName" className="text-sm font-medium">
                          Nombre Completo del Propietario *
                        </Label>
                        <Input
                          id="ownerName"
                          type="text"
                          placeholder="Ej: Juan Pérez González"
                          value={formData.ownerName}
                          onChange={e => handleInputChange('ownerName', e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="ownerRut" className="text-sm font-medium">
                          RUT del Propietario *
                        </Label>
                        <Input
                          id="ownerRut"
                          type="text"
                          placeholder="Ej: 12.345.678-9"
                          value={formData.ownerRut}
                          onChange={e => handleInputChange('ownerRut', e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ownerEmail" className="text-sm font-medium">
                          Correo Electrónico *
                        </Label>
                        <Input
                          id="ownerEmail"
                          type="email"
                          placeholder="Ej: propietario@email.com"
                          value={formData.ownerEmail}
                          onChange={e => handleInputChange('ownerEmail', e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="ownerPhone" className="text-sm font-medium">
                          Teléfono *
                        </Label>
                        <Input
                          id="ownerPhone"
                          type="tel"
                          placeholder="Ej: +56912345678"
                          value={formData.ownerPhone}
                          onChange={e => handleInputChange('ownerPhone', e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
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

                {/* Documents Upload */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documentos Legales
                    </CardTitle>
                    <CardDescription>
                      Suba los documentos legales requeridos para la propiedad
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Property Deed */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Escritura de Propiedad
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <Label htmlFor="propertyDeed" className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-800">
                              Seleccionar archivo PDF
                            </span>
                            <Input
                              id="propertyDeed"
                              type="file"
                              accept=".pdf"
                              onChange={e => handleFileChange('propertyDeed', e.target.files)}
                              className="hidden"
                            />
                          </Label>
                          {formData.propertyDeed && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ {formData.propertyDeed.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Certificate of Title */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Certificado de Título
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <Label htmlFor="certificateOfTitle" className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-800">
                              Seleccionar archivo PDF
                            </span>
                            <Input
                              id="certificateOfTitle"
                              type="file"
                              accept=".pdf"
                              onChange={e => handleFileChange('certificateOfTitle', e.target.files)}
                              className="hidden"
                            />
                          </Label>
                          {formData.certificateOfTitle && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ {formData.certificateOfTitle.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Property Tax Receipt */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Recibo de Contribuciones
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <Label htmlFor="propertyTaxReceipt" className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-800">
                              Seleccionar archivo PDF
                            </span>
                            <Input
                              id="propertyTaxReceipt"
                              type="file"
                              accept=".pdf"
                              onChange={e => handleFileChange('propertyTaxReceipt', e.target.files)}
                              className="hidden"
                            />
                          </Label>
                          {formData.propertyTaxReceipt && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ {formData.propertyTaxReceipt.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Utilities Bills */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Recibos de Servicios Básicos
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <Label htmlFor="utilitiesBills" className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-800">
                              Seleccionar archivos (luz, agua, gas, etc.)
                            </span>
                            <Input
                              id="utilitiesBills"
                              type="file"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={e => handleFileChange('utilitiesBills', e.target.files)}
                              className="hidden"
                            />
                          </Label>
                          {formData.utilitiesBills.length > 0 && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ {formData.utilitiesBills.length} archivo(s) seleccionado(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Insurance Policy */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Póliza de Seguro (Opcional)
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <Label htmlFor="insurancePolicy" className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-800">
                              Seleccionar archivo PDF
                            </span>
                            <Input
                              id="insurancePolicy"
                              type="file"
                              accept=".pdf"
                              onChange={e => handleFileChange('insurancePolicy', e.target.files)}
                              className="hidden"
                            />
                          </Label>
                          {formData.insurancePolicy && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ {formData.insurancePolicy.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Other Documents */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <MoreHorizontal className="w-4 h-4" />
                        Otros Documentos (Opcional)
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <Label htmlFor="otherDocuments" className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-800">
                              Seleccionar archivos adicionales
                            </span>
                            <Input
                              id="otherDocuments"
                              type="file"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={e => handleFileChange('otherDocuments', e.target.files)}
                              className="hidden"
                            />
                          </Label>
                          {formData.otherDocuments.length > 0 && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ {formData.otherDocuments.length} archivo(s) seleccionado(s)
                            </p>
                          )}
                        </div>
                      </div>
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
