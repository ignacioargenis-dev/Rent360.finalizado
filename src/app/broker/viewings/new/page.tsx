'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import dynamic from 'next/dynamic';

// Importar componentes que requieren client-side rendering
const Calendar = dynamic(
  () => import('@/components/ui/calendar').then(mod => ({ default: mod.Calendar })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center">Cargando calendario...</div>
    ),
  }
);

const Popover = dynamic(
  () => import('@/components/ui/popover').then(mod => ({ default: mod.Popover })),
  {
    ssr: false,
  }
);

const PopoverContent = dynamic(
  () => import('@/components/ui/popover').then(mod => ({ default: mod.PopoverContent })),
  {
    ssr: false,
  }
);

const PopoverTrigger = dynamic(
  () => import('@/components/ui/popover').then(mod => ({ default: mod.PopoverTrigger })),
  {
    ssr: false,
  }
);
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Save,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface Property {
  id: string;
  title: string;
  address: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
}

interface ViewingFormData {
  propertyId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  viewingDate: Date | undefined;
  viewingTime: string;
  duration: string;
  viewingType: 'in_person' | 'virtual';
  notes: string;
  priority: 'low' | 'medium' | 'high';
}

export default function NewViewingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const propertyId = searchParams.get('propertyId');

  const [formData, setFormData] = useState<ViewingFormData>({
    propertyId: propertyId || '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    viewingDate: undefined,
    viewingTime: '',
    duration: '60',
    viewingType: 'in_person',
    notes: '',
    priority: 'medium',
  });

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<ViewingFormData>>({});

  // Mock properties data
  const mockProperties: Property[] = [
    {
      id: '1',
      title: 'Departamento moderno en Las Condes',
      address: 'Av. Apoquindo 3456, Las Condes',
      ownerName: 'Carlos Martínez',
      ownerEmail: 'carlos@email.com',
      ownerPhone: '+56912345678',
      tenantName: 'María González',
      tenantEmail: 'maria@email.com',
      tenantPhone: '+56987654321',
    },
    {
      id: '2',
      title: 'Casa amplia en Providencia',
      address: 'Providencia 1234, Santiago',
      ownerName: 'Ana Silva',
      ownerEmail: 'ana@email.com',
      ownerPhone: '+56955556666',
    },
  ];

  useEffect(() => {
    if (propertyId) {
      const property = mockProperties.find(p => p.id === propertyId);
      if (property) {
        setSelectedProperty(property);
        setFormData(prev => ({ ...prev, propertyId }));
      }
    }
  }, [propertyId]);

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'propertyId') {
      const property = mockProperties.find(p => p.id === value);
      setSelectedProperty(property || null);
    }

    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<ViewingFormData> = {};

    if (!formData.propertyId) {
      newErrors.propertyId = 'Propiedad requerida';
    }
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Nombre del cliente requerido';
    }
    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Email del cliente requerido';
    }
    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'Teléfono del cliente requerido';
    }
    if (!formData.viewingDate) {
      newErrors.viewingDate = 'Fecha de visita requerida' as any;
    }
    if (!formData.viewingTime) {
      newErrors.viewingTime = 'Hora de visita requerida';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.clientEmail && !emailRegex.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Email inválido';
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

      logger.info('Nueva visita programada', {
        propertyId: formData.propertyId,
        clientName: formData.clientName,
        viewingDate: formData.viewingDate,
      });

      // Redirect to appointments page
      router.push('/broker/appointments');
    } catch (error) {
      logger.error('Error al programar visita', { error });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/broker/properties');
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
      default:
        return <Badge variant="secondary">{priority}</Badge>;
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
            <h1 className="text-2xl font-bold text-gray-900">Programar Nueva Visita</h1>
            <p className="text-gray-600">Organiza una visita de propiedad para un cliente</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Visita</CardTitle>
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
                      {mockProperties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          <div>
                            <div className="font-medium">{property.title}</div>
                            <div className="text-sm text-gray-600">{property.address}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyId && (
                    <p className="text-sm text-red-600 mt-1">{errors.propertyId}</p>
                  )}
                </div>

                {/* Client Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Nombre del Cliente *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={e => handleInputChange('clientName', e.target.value)}
                      placeholder="Juan Pérez"
                      className={errors.clientName ? 'border-red-500' : ''}
                    />
                    {errors.clientName && (
                      <p className="text-sm text-red-600 mt-1">{errors.clientName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="clientEmail">Email del Cliente *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={e => handleInputChange('clientEmail', e.target.value)}
                      placeholder="juan@email.com"
                      className={errors.clientEmail ? 'border-red-500' : ''}
                    />
                    {errors.clientEmail && (
                      <p className="text-sm text-red-600 mt-1">{errors.clientEmail}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="clientPhone">Teléfono del Cliente *</Label>
                    <Input
                      id="clientPhone"
                      value={formData.clientPhone}
                      onChange={e => handleInputChange('clientPhone', e.target.value)}
                      placeholder="+56912345678"
                      className={errors.clientPhone ? 'border-red-500' : ''}
                    />
                    {errors.clientPhone && (
                      <p className="text-sm text-red-600 mt-1">{errors.clientPhone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') =>
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Fecha de Visita *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !formData.viewingDate && 'text-muted-foreground'
                          } ${errors.viewingDate ? 'border-red-500' : ''}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.viewingDate ? (
                            format(formData.viewingDate, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.viewingDate}
                          onSelect={date => handleInputChange('viewingDate', date)}
                          disabled={date => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.viewingDate && typeof errors.viewingDate === 'string' && (
                      <p className="text-sm text-red-600 mt-1">{errors.viewingDate}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="viewingTime">Hora de Visita *</Label>
                    <Input
                      id="viewingTime"
                      type="time"
                      value={formData.viewingTime}
                      onChange={e => handleInputChange('viewingTime', e.target.value)}
                      className={errors.viewingTime ? 'border-red-500' : ''}
                    />
                    {errors.viewingTime && (
                      <p className="text-sm text-red-600 mt-1">{errors.viewingTime}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="duration">Duración (minutos)</Label>
                    <Select
                      value={formData.duration}
                      onValueChange={value => handleInputChange('duration', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="90">1.5 horas</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Viewing Type */}
                <div>
                  <Label htmlFor="viewingType">Tipo de Visita</Label>
                  <Select
                    value={formData.viewingType}
                    onValueChange={(value: 'in_person' | 'virtual') =>
                      handleInputChange('viewingType', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">Presencial</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    placeholder="Información adicional sobre la visita..."
                    rows={4}
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
                        Programando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Programar Visita
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Details Sidebar */}
          <div>
            {selectedProperty && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Detalles de la Propiedad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">{selectedProperty.title}</h3>
                    <p className="text-sm text-gray-600">{selectedProperty.address}</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Propietario</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4" />
                        <span>{selectedProperty.ownerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="w-4 h-4" />
                        <span>{selectedProperty.ownerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{selectedProperty.ownerPhone}</span>
                      </div>
                    </div>

                    {selectedProperty.tenantName && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Inquilino Actual</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4" />
                          <span>{selectedProperty.tenantName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Mail className="w-4 h-4" />
                          <span>{selectedProperty.tenantEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{selectedProperty.tenantPhone}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-600 font-medium">
                        Prioridad: {getPriorityBadge(formData.priority)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span>Duración: {formData.duration} minutos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
