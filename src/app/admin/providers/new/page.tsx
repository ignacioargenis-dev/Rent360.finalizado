'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Save, User, MapPin, Phone, Mail, Wrench, Star, Upload, X } from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

export default function NewProviderPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    serviceType: '',
    specialties: [] as string[],
    description: '',
    experience: '',
    certifications: [] as string[],
    insurance: false,
    bonded: false,
    backgroundCheck: false,
    availability: {
      weekdays: true,
      weekends: false,
      emergencies: false,
    },
    workingHours: {
      start: '08:00',
      end: '18:00',
    },
    serviceArea: '',
    pricing: {
      hourlyRate: '',
      minimumCharge: '',
      travelFee: '',
    },
    references: [] as { name: string; contact: string; project: string }[],
    documents: [] as File[],
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newReference, setNewReference] = useState({ name: '', contact: '', project: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const serviceTypes = [
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

  const handleInputChange = (field: string, value: string | boolean) => {
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
      setFormData(prev => ({ ...prev, [field as keyof typeof prev]: value }));
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()],
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty),
    }));
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()],
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certification),
    }));
  };

  const addReference = () => {
    if (newReference.name.trim() && newReference.contact.trim() && newReference.project.trim()) {
      setFormData(prev => ({
        ...prev,
        references: [...prev.references, { ...newReference }],
      }));
      setNewReference({ name: '', contact: '', project: '' });
    }
  };

  const removeReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.companyName) {
      newErrors.companyName = 'Debe ingresar el nombre de la empresa';
    }
    if (!formData.contactName) {
      newErrors.contactName = 'Debe ingresar el nombre del contacto';
    }
    if (!formData.email) {
      newErrors.email = 'Debe ingresar el email';
    }
    if (!formData.phone) {
      newErrors.phone = 'Debe ingresar el teléfono';
    }
    if (!formData.serviceType) {
      newErrors.serviceType = 'Debe seleccionar el tipo de servicio';
    }
    if (!formData.address) {
      newErrors.address = 'Debe ingresar la dirección';
    }
    if (!formData.city) {
      newErrors.city = 'Debe ingresar la ciudad';
    }
    if (!formData.region) {
      newErrors.region = 'Debe seleccionar la región';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Debe ingresar un email válido';
    }

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
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      logger.info('Proveedor creado exitosamente', {
        companyName: formData.companyName,
        serviceType: formData.serviceType,
        email: formData.email,
      });

      setSuccessMessage('Proveedor creado exitosamente');

      setTimeout(() => {
        router.push('/admin/providers');
      }, 2000);
    } catch (error) {
      logger.error('Error al crear proveedor', { error });
      setErrorMessage('Error al crear el proveedor. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/providers');
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Proveedor</h1>
            <p className="text-gray-600">Registrar un nuevo proveedor de servicios</p>
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
            {/* Información de la Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información de la Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={e => handleInputChange('companyName', e.target.value)}
                    placeholder="Ej: Servicios Eléctricos Ltda"
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactName">Nombre del Contacto *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={e => handleInputChange('contactName', e.target.value)}
                    placeholder="Nombre de la persona de contacto"
                  />
                  {errors.contactName && (
                    <p className="text-sm text-red-600 mt-1">{errors.contactName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder="contacto@empresa.cl"
                    />
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      placeholder="+56 9 1234 5678"
                    />
                    {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="mobile">Teléfono Móvil (opcional)</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={e => handleInputChange('mobile', e.target.value)}
                    placeholder="+56 9 8765 4321"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Dirección *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Calle, número, comuna"
                  />
                  {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                      placeholder="Ej: Santiago"
                    />
                    {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={e => handleInputChange('postalCode', e.target.value)}
                      placeholder="Ej: 7500000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="region">Región *</Label>
                  <Select
                    value={formData.region}
                    onValueChange={value => handleInputChange('region', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione región" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map(region => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.region && <p className="text-sm text-red-600 mt-1">{errors.region}</p>}
                </div>

                <div>
                  <Label htmlFor="serviceArea">Área de Servicio</Label>
                  <Textarea
                    id="serviceArea"
                    value={formData.serviceArea}
                    onChange={e => handleInputChange('serviceArea', e.target.value)}
                    placeholder="Describa las comunas o áreas donde presta servicios..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Servicios y Especialidades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Servicios y Especialidades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="serviceType">Tipo de Servicio Principal *</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={value => handleInputChange('serviceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo de servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.serviceType && (
                    <p className="text-sm text-red-600 mt-1">{errors.serviceType}</p>
                  )}
                </div>

                <div>
                  <Label>Especialidades</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newSpecialty}
                      onChange={e => setNewSpecialty(e.target.value)}
                      placeholder="Ej: Instalaciones eléctricas"
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    />
                    <Button type="button" onClick={addSpecialty} size="sm">
                      Agregar
                    </Button>
                  </div>
                  {formData.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties.map(specialty => (
                        <Badge
                          key={specialty}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {specialty}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => removeSpecialty(specialty)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descripción de Servicios</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="Describa los servicios que ofrece..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Años de Experiencia</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience}
                    onChange={e => handleInputChange('experience', e.target.value)}
                    placeholder="Ej: 5"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Disponibilidad y Precios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Disponibilidad y Precios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Disponibilidad</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="weekdays"
                        checked={formData.availability.weekdays}
                        onCheckedChange={checked =>
                          handleInputChange('availability.weekdays', checked)
                        }
                      />
                      <Label htmlFor="weekdays">Días de semana</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="weekends"
                        checked={formData.availability.weekends}
                        onCheckedChange={checked =>
                          handleInputChange('availability.weekends', checked)
                        }
                      />
                      <Label htmlFor="weekends">Fines de semana</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="emergencies"
                        checked={formData.availability.emergencies}
                        onCheckedChange={checked =>
                          handleInputChange('availability.emergencies', checked)
                        }
                      />
                      <Label htmlFor="emergencies">Emergencias 24/7</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hora Inicio</Label>
                    <Input
                      type="time"
                      value={formData.workingHours.start}
                      onChange={e => handleInputChange('workingHours.start', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Hora Fin</Label>
                    <Input
                      type="time"
                      value={formData.workingHours.end}
                      onChange={e => handleInputChange('workingHours.end', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Precios (CLP)</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <Label htmlFor="hourlyRate" className="text-sm">
                        Tarifa por Hora
                      </Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        value={formData.pricing.hourlyRate}
                        onChange={e => handleInputChange('pricing.hourlyRate', e.target.value)}
                        placeholder="Ej: 25000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="minimumCharge" className="text-sm">
                        Cargo Mínimo
                      </Label>
                      <Input
                        id="minimumCharge"
                        type="number"
                        value={formData.pricing.minimumCharge}
                        onChange={e => handleInputChange('pricing.minimumCharge', e.target.value)}
                        placeholder="Ej: 50000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="travelFee" className="text-sm">
                        Tarifa de Desplazamiento
                      </Label>
                      <Input
                        id="travelFee"
                        type="number"
                        value={formData.pricing.travelFee}
                        onChange={e => handleInputChange('pricing.travelFee', e.target.value)}
                        placeholder="Ej: 15000"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificaciones y Seguro */}
            <Card>
              <CardHeader>
                <CardTitle>Certificaciones y Seguro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Certificaciones</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newCertification}
                      onChange={e => setNewCertification(e.target.value)}
                      placeholder="Ej: Certificación SENCE"
                      onKeyPress={e =>
                        e.key === 'Enter' && (e.preventDefault(), addCertification())
                      }
                    />
                    <Button type="button" onClick={addCertification} size="sm">
                      Agregar
                    </Button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map(certification => (
                        <Badge
                          key={certification}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {certification}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => removeCertification(certification)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="insurance"
                      checked={formData.insurance}
                      onCheckedChange={checked => handleInputChange('insurance', checked)}
                    />
                    <Label htmlFor="insurance">Tiene seguro de responsabilidad civil</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="bonded"
                      checked={formData.bonded}
                      onCheckedChange={checked => handleInputChange('bonded', checked)}
                    />
                    <Label htmlFor="bonded">Tiene fianza</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="backgroundCheck"
                      checked={formData.backgroundCheck}
                      onCheckedChange={checked => handleInputChange('backgroundCheck', checked)}
                    />
                    <Label htmlFor="backgroundCheck">Ha pasado verificación de antecedentes</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referencias */}
            <Card>
              <CardHeader>
                <CardTitle>Referencias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="refName">Nombre</Label>
                    <Input
                      id="refName"
                      value={newReference.name}
                      onChange={e => setNewReference(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nombre de la referencia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="refContact">Contacto</Label>
                    <Input
                      id="refContact"
                      value={newReference.contact}
                      onChange={e =>
                        setNewReference(prev => ({ ...prev, contact: e.target.value }))
                      }
                      placeholder="Teléfono o email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="refProject">Proyecto</Label>
                    <Input
                      id="refProject"
                      value={newReference.project}
                      onChange={e =>
                        setNewReference(prev => ({ ...prev, project: e.target.value }))
                      }
                      placeholder="Descripción del proyecto"
                    />
                  </div>
                  <Button type="button" onClick={addReference} size="sm" className="w-full">
                    Agregar Referencia
                  </Button>
                </div>

                {formData.references.length > 0 && (
                  <div className="space-y-2">
                    <Label>Referencias Agregadas</Label>
                    {formData.references.map((ref, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{ref.name}</p>
                            <p className="text-sm text-gray-600">{ref.contact}</p>
                            <p className="text-sm text-gray-500">{ref.project}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeReference(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="documents">Subir Documentos</Label>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Formatos permitidos: PDF, Word, imágenes. Máximo 5 archivos.
                  </p>
                </div>

                {formData.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label>Documentos Subidos</Label>
                    {formData.documents.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDocument(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando Proveedor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Proveedor
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
