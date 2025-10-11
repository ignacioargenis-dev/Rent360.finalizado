'use client';

import React, { useState, useEffect } from 'react';
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
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

interface TaskFormData {
  propertyId: string;
  propertyAddress: string;
  tenantName: string;
  tenantPhone: string;
  taskType: 'visit' | 'maintenance' | 'inspection' | 'delivery' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: string;
  description: string;
  specialInstructions: string;
  contactMethod: 'call' | 'whatsapp' | 'email';
}

interface Property {
  id: string;
  address: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
}

export default function NewTaskPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState<TaskFormData>({
    propertyId: '',
    propertyAddress: '',
    tenantName: '',
    tenantPhone: '',
    taskType: 'visit',
    priority: 'medium',
    scheduledDate: '',
    scheduledTime: '',
    estimatedDuration: '60',
    description: '',
    specialInstructions: '',
    contactMethod: 'whatsapp',
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<TaskFormData>>({});

  // Mock properties data
  const mockProperties: Property[] = [
    {
      id: '1',
      address: 'Av. Providencia 1234, Santiago',
      tenantName: 'María González',
      tenantPhone: '+56987654321',
      tenantEmail: 'maria@email.com',
    },
    {
      id: '2',
      address: 'Las Condes 5678, Santiago',
      tenantName: 'Carlos Rodríguez',
      tenantPhone: '+56912345678',
      tenantEmail: 'carlos@email.com',
    },
    {
      id: '3',
      address: 'Ñuñoa 9012, Santiago',
      tenantName: 'Ana Silva',
      tenantPhone: '+56955556666',
      tenantEmail: 'ana@email.com',
    },
  ];

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProperties(mockProperties);
    } catch (error) {
      logger.error('Error al cargar propiedades', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-fill property details when property is selected
    if (field === 'propertyId') {
      const selectedProperty = mockProperties.find(p => p.id === value);
      if (selectedProperty) {
        setFormData(prev => ({
          ...prev,
          propertyId: value,
          propertyAddress: selectedProperty.address,
          tenantName: selectedProperty.tenantName,
          tenantPhone: selectedProperty.tenantPhone,
        }));
      }
    }

    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<TaskFormData> = {};

    if (!formData.propertyId) {
      newErrors.propertyId = 'Propiedad requerida';
    }
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Fecha requerida';
    }
    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Hora requerida';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Descripción requerida';
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

      logger.info('Nueva tarea creada', {
        propertyId: formData.propertyId,
        taskType: formData.taskType,
        scheduledDate: formData.scheduledDate,
      });

      // Redirect to tasks page
      router.push('/runner/tasks');
    } catch (error) {
      logger.error('Error al crear tarea', { error });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/runner/tasks');
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Media
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Baja
          </Badge>
        );
      case 'urgent':
        return <Badge variant="destructive">Urgente</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'visit':
        return 'Visita';
      case 'maintenance':
        return 'Mantenimiento';
      case 'inspection':
        return 'Inspección';
      case 'delivery':
        return 'Entrega';
      case 'other':
        return 'Otro';
      default:
        return type;
    }
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Tarea</h1>
            <p className="text-gray-600">Crear una nueva tarea para ejecutar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Tarea</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Property Selection */}
                <div>
                  <Label htmlFor="propertyId">Propiedad *</Label>
                  <Select
                    value={formData.propertyId}
                    onValueChange={value => handleInputChange('propertyId', value)}
                  >
                    <SelectTrigger className={errors.propertyId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar propiedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          <div>
                            <div className="font-medium">{property.address}</div>
                            <div className="text-sm text-gray-600">
                              Inquilino: {property.tenantName}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyId && (
                    <p className="text-sm text-red-600 mt-1">{errors.propertyId}</p>
                  )}
                </div>

                {/* Task Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taskType">Tipo de Tarea</Label>
                    <Select
                      value={formData.taskType}
                      onValueChange={(value: TaskFormData['taskType']) =>
                        handleInputChange('taskType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visit">Visita</SelectItem>
                        <SelectItem value="maintenance">Mantenimiento</SelectItem>
                        <SelectItem value="inspection">Inspección</SelectItem>
                        <SelectItem value="delivery">Entrega</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: TaskFormData['priority']) =>
                        handleInputChange('priority', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="scheduledDate">Fecha Programada *</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={e => handleInputChange('scheduledDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={errors.scheduledDate ? 'border-red-500' : ''}
                    />
                    {errors.scheduledDate && (
                      <p className="text-sm text-red-600 mt-1">{errors.scheduledDate}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="scheduledTime">Hora Programada *</Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={formData.scheduledTime}
                      onChange={e => handleInputChange('scheduledTime', e.target.value)}
                      className={errors.scheduledTime ? 'border-red-500' : ''}
                    />
                    {errors.scheduledTime && (
                      <p className="text-sm text-red-600 mt-1">{errors.scheduledTime}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="estimatedDuration">Duración Estimada (min)</Label>
                    <Select
                      value={formData.estimatedDuration}
                      onValueChange={value => handleInputChange('estimatedDuration', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="90">1.5 horas</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="180">3 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact Method */}
                <div>
                  <Label htmlFor="contactMethod">Método de Contacto</Label>
                  <Select
                    value={formData.contactMethod}
                    onValueChange={(value: TaskFormData['contactMethod']) =>
                      handleInputChange('contactMethod', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Llamada telefónica</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Descripción de la Tarea *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="Describa detalladamente qué debe hacer en esta tarea..."
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Special Instructions */}
                <div>
                  <Label htmlFor="specialInstructions">Instrucciones Especiales</Label>
                  <Textarea
                    id="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={e => handleInputChange('specialInstructions', e.target.value)}
                    placeholder="Instrucciones adicionales, códigos de acceso, etc..."
                    rows={3}
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
                        Creando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Crear Tarea
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Summary Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Resumen de la Tarea
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.propertyId && (
                  <div>
                    <h3 className="font-medium text-sm text-gray-700 mb-2">Propiedad</h3>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium">{formData.propertyAddress}</p>
                        <p className="text-gray-600">Inquilino: {formData.tenantName}</p>
                        <p className="text-gray-600">Teléfono: {formData.tenantPhone}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tipo:</span>
                    <Badge variant="outline">{getTaskTypeLabel(formData.taskType)}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prioridad:</span>
                    {getPriorityBadge(formData.priority)}
                  </div>

                  {(formData.scheduledDate || formData.scheduledTime) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium">
                          {formData.scheduledDate
                            ? new Date(formData.scheduledDate).toLocaleDateString('es-CL')
                            : 'Fecha pendiente'}
                        </p>
                        <p className="text-gray-600">
                          {formData.scheduledTime || 'Hora pendiente'} -{' '}
                          {formData.estimatedDuration} min
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-600" />
                    <span>
                      Contacto:{' '}
                      {formData.contactMethod === 'call'
                        ? 'Llamada'
                        : formData.contactMethod === 'whatsapp'
                          ? 'WhatsApp'
                          : 'Email'}
                    </span>
                  </div>
                </div>

                {formData.description && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Descripción</h4>
                    <p className="text-sm text-gray-600">{formData.description}</p>
                  </div>
                )}

                {formData.specialInstructions && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Instrucciones Especiales
                    </h4>
                    <p className="text-sm text-gray-600">{formData.specialInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
