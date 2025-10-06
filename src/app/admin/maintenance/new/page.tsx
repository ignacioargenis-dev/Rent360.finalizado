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
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Wrench,
  Home,
  User,
  Calendar,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';
import { logger } from '@/lib/logger';

export default function NewMaintenanceRequestPage() {
  const router = useRouter();
  const { user } = useUserState();

  const [formData, setFormData] = useState({
    propertyId: '',
    propertyAddress: '',
    tenantId: '',
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    serviceType: '',
    priority: 'medium',
    title: '',
    description: '',
    preferredDate: '',
    preferredTime: '',
    location: '',
    estimatedCost: '',
    contactPerson: '',
    specialInstructions: '',
    attachments: [] as File[],
  });

  const [properties] = useState([
    {
      id: '1',
      address: 'Av. Providencia 123, Santiago',
      tenantId: '1',
      tenantName: 'Ana Rodríguez',
      tenantEmail: 'ana@email.com',
      tenantPhone: '+56912345678',
    },
    {
      id: '2',
      address: 'Calle Las Condes 456, Las Condes',
      tenantId: '2',
      tenantName: 'Pedro Sánchez',
      tenantEmail: 'pedro@email.com',
      tenantPhone: '+56987654321',
    },
    {
      id: '3',
      address: 'Paseo Ñuñoa 789, Ñuñoa',
      tenantId: '3',
      tenantName: 'Laura Martínez',
      tenantEmail: 'laura@email.com',
      tenantPhone: '+56955556666',
    },
    {
      id: '4',
      address: 'Av. Vitacura 321, Vitacura',
      tenantId: '4',
      tenantName: 'Diego Torres',
      tenantEmail: 'diego@email.com',
      tenantPhone: '+56944445555',
    },
  ]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'propertyId') {
      const selectedProperty = properties.find(p => p.id === value);
      if (selectedProperty) {
        setFormData(prev => ({
          ...prev,
          propertyId: value,
          propertyAddress: selectedProperty.address,
          tenantId: selectedProperty.tenantId,
          tenantName: selectedProperty.tenantName,
          tenantEmail: selectedProperty.tenantEmail,
          tenantPhone: selectedProperty.tenantPhone,
        }));
      }
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.propertyId) {
      newErrors.propertyId = 'Debe seleccionar una propiedad';
    }
    if (!formData.serviceType) {
      newErrors.serviceType = 'Debe seleccionar un tipo de servicio';
    }
    if (!formData.title) {
      newErrors.title = 'Debe ingresar un título';
    }
    if (!formData.description) {
      newErrors.description = 'Debe ingresar una descripción';
    }
    if (!formData.preferredDate) {
      newErrors.preferredDate = 'Debe seleccionar una fecha preferida';
    }
    if (!formData.contactPerson) {
      newErrors.contactPerson = 'Debe especificar una persona de contacto';
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

      logger.info('Solicitud de mantenimiento creada exitosamente', {
        propertyId: formData.propertyId,
        serviceType: formData.serviceType,
        priority: formData.priority,
        title: formData.title,
      });

      setSuccessMessage('Solicitud de mantenimiento creada exitosamente');

      setTimeout(() => {
        router.push('/admin/maintenance');
      }, 2000);
    } catch (error) {
      logger.error('Error al crear solicitud de mantenimiento', { error });
      setErrorMessage('Error al crear la solicitud. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/maintenance');
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Baja
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Media
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Alta
          </Badge>
        );
      case 'urgent':
        return <Badge variant="destructive">Urgente</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Mantenimiento</h1>
            <p className="text-gray-600">Crear una nueva solicitud de trabajo de mantenimiento</p>
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
            {/* Información de la Propiedad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Información de la Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="propertyId">Seleccionar Propiedad</Label>
                  <Select
                    value={formData.propertyId}
                    onValueChange={value => handleInputChange('propertyId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una propiedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyId && (
                    <p className="text-sm text-red-600 mt-1">{errors.propertyId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="propertyAddress">Dirección de la Propiedad</Label>
                  <Input
                    id="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={e => handleInputChange('propertyAddress', e.target.value)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Ubicación Específica</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={e => handleInputChange('location', e.target.value)}
                    placeholder="Ej: Piso 3, Departamento 4B, Cocina"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Información del Inquilino */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Inquilino
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tenantName">Nombre del Inquilino</Label>
                  <Input
                    id="tenantName"
                    value={formData.tenantName}
                    onChange={e => handleInputChange('tenantName', e.target.value)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenantEmail">Email</Label>
                    <Input
                      id="tenantEmail"
                      type="email"
                      value={formData.tenantEmail}
                      onChange={e => handleInputChange('tenantEmail', e.target.value)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenantPhone">Teléfono</Label>
                    <Input
                      id="tenantPhone"
                      value={formData.tenantPhone}
                      onChange={e => handleInputChange('tenantPhone', e.target.value)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contactPerson">Persona de Contacto</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={e => handleInputChange('contactPerson', e.target.value)}
                    placeholder="Nombre de la persona que estará disponible"
                  />
                  {errors.contactPerson && (
                    <p className="text-sm text-red-600 mt-1">{errors.contactPerson}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detalles del Servicio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Detalles del Servicio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="serviceType">Tipo de Servicio</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={value => handleInputChange('serviceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo de servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electricidad">Electricidad</SelectItem>
                      <SelectItem value="fontaneria">Fontanería</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento General</SelectItem>
                      <SelectItem value="pintura">Pintura</SelectItem>
                      <SelectItem value="jardineria">Jardinería</SelectItem>
                      <SelectItem value="carpinteria">Carpintería</SelectItem>
                      <SelectItem value="cerrajeria">Cerrajería</SelectItem>
                      <SelectItem value="limpieza">Limpieza</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.serviceType && (
                    <p className="text-sm text-red-600 mt-1">{errors.serviceType}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={value => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Baja - En las próximas semanas
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Media - En los próximos días
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Alta - Esta semana
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Urgente - Hoy o mañana
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Título de la Solicitud</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    placeholder="Breve descripción del problema"
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="estimatedCost">Costo Estimado (opcional)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    step="0.01"
                    value={formData.estimatedCost}
                    onChange={e => handleInputChange('estimatedCost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Programación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Programación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDate">Fecha Preferida</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={e => handleInputChange('preferredDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.preferredDate && (
                      <p className="text-sm text-red-600 mt-1">{errors.preferredDate}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="preferredTime">Hora Preferida</Label>
                    <Select
                      value={formData.preferredTime}
                      onValueChange={value => handleInputChange('preferredTime', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione hora" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00">08:00 - 10:00</SelectItem>
                        <SelectItem value="10:00">10:00 - 12:00</SelectItem>
                        <SelectItem value="14:00">14:00 - 16:00</SelectItem>
                        <SelectItem value="16:00">16:00 - 18:00</SelectItem>
                        <SelectItem value="18:00">18:00 - 20:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Importante:</p>
                      <p className="text-yellow-700">
                        El proveedor contactará al inquilino directamente para coordinar la visita.
                        Asegúrese de que la persona de contacto esté disponible en la fecha y hora
                        seleccionadas.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descripción y Adjuntos */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Descripción Detallada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description">Descripción del Problema</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="Describa detalladamente el problema, síntomas, cuándo comenzó, etc."
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="specialInstructions">Instrucciones Especiales</Label>
                  <Textarea
                    id="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={e => handleInputChange('specialInstructions', e.target.value)}
                    placeholder="Instrucciones adicionales, códigos de acceso, precauciones, etc."
                    rows={3}
                  />
                </div>

                {/* Adjuntos */}
                <div>
                  <Label htmlFor="attachments">Adjuntar Archivos (opcional)</Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Formatos permitidos: imágenes, PDF, Word. Máximo 5 archivos.
                  </p>

                  {formData.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {formData.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm">{file.name}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAttachment(index)}
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
          </div>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Solicitud</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Propiedad</Label>
                  <p className="text-sm text-gray-600">
                    {formData.propertyAddress || 'No seleccionada'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Servicio</Label>
                  <p className="text-sm text-gray-600">
                    {formData.serviceType || 'No seleccionado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Prioridad</Label>
                  <div className="mt-1">{getPriorityBadge(formData.priority)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Fecha Preferida</Label>
                  <p className="text-sm text-gray-600">
                    {formData.preferredDate
                      ? new Date(formData.preferredDate).toLocaleDateString('es-CL')
                      : 'No especificada'}
                    {formData.preferredTime && ` ${formData.preferredTime}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Costo Estimado</Label>
                  <p className="text-sm text-gray-600">
                    {formData.estimatedCost
                      ? `$${parseFloat(formData.estimatedCost).toLocaleString('es-CL')}`
                      : 'No especificado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Adjuntos</Label>
                  <p className="text-sm text-gray-600">{formData.attachments.length} archivo(s)</p>
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
                  Creando Solicitud...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Solicitud
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
