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
  MapPin,
  Home,
  User,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Upload,
  Plus,
  X,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';
import { logger } from '@/lib/logger';

interface ServiceRequestData {
  propertyId: string;
  propertyAddress: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  serviceType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  preferredDate: string;
  preferredTimeSlot: string;
  estimatedDuration: string;
  budgetRange: {
    min: number;
    max: number;
  };
  specialRequirements: string[];
  attachments: File[];
  notes: string;
}

export default function NewServiceRequestPage() {
  const router = useRouter();
  const { user } = useUserState();

  const [requestData, setRequestData] = useState<ServiceRequestData>({
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
    preferredTimeSlot: '',
    estimatedDuration: '',
    budgetRange: {
      min: 0,
      max: 0,
    },
    specialRequirements: [],
    attachments: [],
    notes: '',
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

  const [newRequirement, setNewRequirement] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const serviceTypes = [
    'Reparación Eléctrica',
    'Reparación de Fontanería',
    'Mantenimiento General',
    'Reparación de Pintura',
    'Mantenimiento de Jardinería',
    'Limpieza Profunda',
    'Reparación de Cerrajería',
    'Instalación de Equipos',
    'Revisión Técnica',
    'Otro',
  ];

  const timeSlots = [
    'Mañana (8:00 - 12:00)',
    'Tarde (14:00 - 18:00)',
    'Todo el día',
    'Lo antes posible',
  ];

  const durationOptions = [
    '30 minutos',
    '1 hora',
    '2 horas',
    '4 horas',
    '1 día',
    'Varios días',
    'Por definir',
  ];

  const handleInputChange = (field: string, value: string | number) => {
    if (field === 'propertyId') {
      const selectedProperty = properties.find(p => p.id === value);
      if (selectedProperty) {
        setRequestData(prev => ({
          ...prev,
          propertyId: value,
          propertyAddress: selectedProperty.address,
          tenantId: selectedProperty.tenantId,
          tenantName: selectedProperty.tenantName,
          tenantEmail: selectedProperty.tenantEmail,
          tenantPhone: selectedProperty.tenantPhone,
        }));
      }
    } else if (field.includes('budgetRange.')) {
      const budgetField = field.split('.')[1];
      setRequestData(prev => ({
        ...prev,
        budgetRange: {
          ...prev.budgetRange,
          [budgetField]: value,
        },
      }));
    } else {
      setRequestData(prev => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim() && !requestData.specialRequirements.includes(newRequirement.trim())) {
      setRequestData(prev => ({
        ...prev,
        specialRequirements: [...prev.specialRequirements, newRequirement.trim()],
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (requirement: string) => {
    setRequestData(prev => ({
      ...prev,
      specialRequirements: prev.specialRequirements.filter(r => r !== requirement),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setRequestData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };

  const removeAttachment = (index: number) => {
    setRequestData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!requestData.propertyId) {
      newErrors.propertyId = 'Debe seleccionar una propiedad';
    }
    if (!requestData.serviceType) {
      newErrors.serviceType = 'Debe seleccionar un tipo de servicio';
    }
    if (!requestData.title) {
      newErrors.title = 'Debe ingresar un título';
    }
    if (!requestData.description) {
      newErrors.description = 'Debe ingresar una descripción';
    }
    if (!requestData.preferredDate) {
      newErrors.preferredDate = 'Debe seleccionar una fecha preferida';
    }
    if (
      requestData.budgetRange.min > 0 &&
      requestData.budgetRange.max > 0 &&
      requestData.budgetRange.min >= requestData.budgetRange.max
    ) {
      newErrors.budgetRange = 'El presupuesto mínimo debe ser menor al máximo';
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

      logger.info('Solicitud de servicio creada exitosamente', {
        propertyId: requestData.propertyId,
        serviceType: requestData.serviceType,
        title: requestData.title,
      });

      setSuccessMessage('Solicitud de servicio creada exitosamente');

      setTimeout(() => {
        router.push('/provider/requests');
      }, 2000);
    } catch (error) {
      logger.error('Error al crear solicitud de servicio', { error });
      setErrorMessage('Error al crear la solicitud. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/provider/requests');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
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
            <h1 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Servicio</h1>
            <p className="text-gray-600">Crear una nueva solicitud de cotización para un cliente</p>
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
            {/* Información de la Propiedad y Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Propiedad y Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="propertyId">Seleccionar Propiedad *</Label>
                  <Select
                    value={requestData.propertyId}
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
                    value={requestData.propertyAddress}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="tenantName">Nombre del Cliente</Label>
                  <Input
                    id="tenantName"
                    value={requestData.tenantName}
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
                      value={requestData.tenantEmail}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenantPhone">Teléfono</Label>
                    <Input
                      id="tenantPhone"
                      value={requestData.tenantPhone}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalles del Servicio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Detalles del Servicio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="serviceType">Tipo de Servicio *</Label>
                  <Select
                    value={requestData.serviceType}
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
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={requestData.priority}
                    onValueChange={value => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Baja - Servicio regular
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Media - Servicio importante
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Alta - Servicio prioritario
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Urgente - Servicio inmediato
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Título de la Solicitud *</Label>
                  <Input
                    id="title"
                    value={requestData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    placeholder="Ej: Reparación de grifería en baño principal"
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Descripción Detallada *</Label>
                  <Textarea
                    id="description"
                    value={requestData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="Describa detalladamente el problema o servicio requerido..."
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                  )}
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
                    <Label htmlFor="preferredDate">Fecha Preferida *</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={requestData.preferredDate}
                      onChange={e => handleInputChange('preferredDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.preferredDate && (
                      <p className="text-sm text-red-600 mt-1">{errors.preferredDate}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="preferredTimeSlot">Horario Preferido</Label>
                    <Select
                      value={requestData.preferredTimeSlot}
                      onValueChange={value => handleInputChange('preferredTimeSlot', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione horario" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(slot => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="estimatedDuration">Duración Estimada</Label>
                  <Select
                    value={requestData.estimatedDuration}
                    onValueChange={value => handleInputChange('estimatedDuration', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione duración estimada" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map(duration => (
                        <SelectItem key={duration} value={duration}>
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Presupuesto y Requisitos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Presupuesto y Requisitos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Rango de Presupuesto Estimado</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budgetMin" className="text-sm">
                        Mínimo (CLP)
                      </Label>
                      <Input
                        id="budgetMin"
                        type="number"
                        value={requestData.budgetRange.min || ''}
                        onChange={e =>
                          handleInputChange('budgetRange.min', parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budgetMax" className="text-sm">
                        Máximo (CLP)
                      </Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        value={requestData.budgetRange.max || ''}
                        onChange={e =>
                          handleInputChange('budgetRange.max', parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {errors.budgetRange && (
                    <p className="text-sm text-red-600 mt-1">{errors.budgetRange}</p>
                  )}
                  {(requestData.budgetRange.min > 0 || requestData.budgetRange.max > 0) && (
                    <p className="text-sm text-gray-600 mt-2">
                      Rango:{' '}
                      {requestData.budgetRange.min > 0
                        ? formatCurrency(requestData.budgetRange.min)
                        : 'Sin mínimo'}{' '}
                      -{' '}
                      {requestData.budgetRange.max > 0
                        ? formatCurrency(requestData.budgetRange.max)
                        : 'Sin máximo'}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Requisitos Especiales</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newRequirement}
                      onChange={e => setNewRequirement(e.target.value)}
                      placeholder="Ej: Acceso a techo, herramientas especiales"
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    />
                    <Button type="button" onClick={addRequirement} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                  {requestData.specialRequirements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {requestData.specialRequirements.map((requirement, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {requirement}
                          <button
                            type="button"
                            onClick={() => removeRequirement(requirement)}
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

            {/* Adjuntos y Notas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Adjuntos y Notas Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="attachments">Adjuntar Archivos (opcional)</Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Formatos permitidos: imágenes, PDF, Word. Máximo 5 archivos de 10MB cada uno.
                  </p>
                </div>

                {requestData.attachments.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {requestData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
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

                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={requestData.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    placeholder="Información adicional, instrucciones especiales, o cualquier detalle relevante..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen de la Solicitud */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Solicitud</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Propiedad</Label>
                  <p className="text-sm text-gray-600">
                    {requestData.propertyAddress || 'No seleccionada'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Servicio</Label>
                  <p className="text-sm text-gray-600">
                    {requestData.serviceType || 'No especificado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Prioridad</Label>
                  <div className="mt-1">{getPriorityBadge(requestData.priority)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Fecha Preferida</Label>
                  <p className="text-sm text-gray-600">
                    {requestData.preferredDate
                      ? new Date(requestData.preferredDate).toLocaleDateString('es-CL')
                      : 'No especificada'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Horario</Label>
                  <p className="text-sm text-gray-600">
                    {requestData.preferredTimeSlot || 'No especificado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Duración Estimada</Label>
                  <p className="text-sm text-gray-600">
                    {requestData.estimatedDuration || 'No especificada'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Presupuesto</Label>
                  <p className="text-sm text-gray-600">
                    {requestData.budgetRange.min > 0 || requestData.budgetRange.max > 0
                      ? `${requestData.budgetRange.min > 0 ? formatCurrency(requestData.budgetRange.min) : 'Sin mín'} - ${requestData.budgetRange.max > 0 ? formatCurrency(requestData.budgetRange.max) : 'Sin máx'}`
                      : 'No especificado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Adjuntos</Label>
                  <p className="text-sm text-gray-600">
                    {requestData.attachments.length} archivo(s)
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
