'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertCircle,
  CheckCircle,
  MapPin,
  User,
  Phone,
  Mail,
  Wrench,
  DollarSign,
  Calendar,
  Clock,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';
import { logger } from '@/lib/logger';

interface JobFormData {
  title: string;
  description: string;
  propertyAddress: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  maintenanceType: string;
  priority: string;
  estimatedCost: string;
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
}

export default function NewMaintenanceJobPage() {
  const { user } = useUserState();
  const router = useRouter();

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    propertyAddress: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    maintenanceType: '',
    priority: 'medium',
    estimatedCost: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<Partial<JobFormData>>({});

  const handleInputChange = (field: keyof JobFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<JobFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (!formData.propertyAddress.trim()) {
      newErrors.propertyAddress = 'La dirección es requerida';
    }
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'El nombre del propietario es requerido';
    }
    if (!formData.ownerPhone.trim()) {
      newErrors.ownerPhone = 'El teléfono del propietario es requerido';
    }
    if (!formData.ownerEmail.trim()) {
      newErrors.ownerEmail = 'El email del propietario es requerido';
    }
    if (!formData.maintenanceType) {
      newErrors.maintenanceType = 'El tipo de mantenimiento es requerido';
    }
    if (!formData.priority) {
      newErrors.priority = 'La prioridad es requerida';
    }
    if (!formData.estimatedCost.trim()) {
      newErrors.estimatedCost = 'El costo estimado es requerido';
    }
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'La fecha programada es requerida';
    }
    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'La hora programada es requerida';
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.ownerEmail && !emailRegex.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Formato de email inválido';
    }

    // Validar costo estimado
    const cost = parseInt(formData.estimatedCost.replace(/\D/g, ''));
    if (formData.estimatedCost && (isNaN(cost) || cost <= 0)) {
      newErrors.estimatedCost = 'Costo estimado debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrorMessage('Por favor, corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      logger.info('Nuevo trabajo de mantenimiento creado', {
        title: formData.title,
        propertyAddress: formData.propertyAddress,
        maintenanceType: formData.maintenanceType,
      });

      setSuccessMessage('Trabajo de mantenimiento creado exitosamente');

      // Redirect after success
      setTimeout(() => {
        router.push('/maintenance/jobs');
      }, 2000);
    } catch (error) {
      logger.error('Error creando trabajo de mantenimiento:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al crear el trabajo de mantenimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/maintenance/jobs');
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) {
      return '';
    }

    const formatted = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseInt(numericValue));

    return formatted.replace('$', '').trim();
  };

  const handleCostChange = (value: string) => {
    const formatted = formatCurrency(value);
    handleInputChange('estimatedCost', formatted);
  };

  return (
    <UnifiedDashboardLayout
      title="Nuevo Trabajo de Mantenimiento"
      subtitle="Crear un nuevo trabajo de mantenimiento"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="h-6 border-l border-gray-300"></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Trabajo</h1>
            <p className="text-gray-600">Complete la información del trabajo de mantenimiento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Detalles principales del trabajo de mantenimiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título del Trabajo *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    placeholder="Ej: Reparación de cañería"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="maintenanceType">Tipo de Mantenimiento *</Label>
                  <Select
                    value={formData.maintenanceType}
                    onValueChange={value => handleInputChange('maintenanceType', value)}
                  >
                    <SelectTrigger className={errors.maintenanceType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumbing">Plomería</SelectItem>
                      <SelectItem value="electrical">Eléctrica</SelectItem>
                      <SelectItem value="structural">Estructural</SelectItem>
                      <SelectItem value="cleaning">Limpieza</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.maintenanceType && (
                    <p className="text-sm text-red-600 mt-1">{errors.maintenanceType}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción del Trabajo *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  placeholder="Describa detalladamente el trabajo a realizar..."
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioridad *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={value => handleInputChange('priority', value)}
                  >
                    <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-100 text-gray-800">Baja</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">Media</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-100 text-orange-800">Alta</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-100 text-red-800">Urgente</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="text-sm text-red-600 mt-1">{errors.priority}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="estimatedCost">Costo Estimado *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="estimatedCost"
                      value={formData.estimatedCost}
                      onChange={e => handleCostChange(e.target.value)}
                      placeholder="0"
                      className={`pl-10 ${errors.estimatedCost ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.estimatedCost && (
                    <p className="text-sm text-red-600 mt-1">{errors.estimatedCost}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Propiedad</CardTitle>
              <CardDescription>
                Detalles de la propiedad donde se realizará el mantenimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="propertyAddress">Dirección de la Propiedad *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={e => handleInputChange('propertyAddress', e.target.value)}
                    placeholder="Ej: Av. Las Condes 1234, Depto 5B"
                    className={`pl-10 ${errors.propertyAddress ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.propertyAddress && (
                  <p className="text-sm text-red-600 mt-1">{errors.propertyAddress}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Propietario</CardTitle>
              <CardDescription>Datos de contacto del propietario de la propiedad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerName">Nombre del Propietario *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={e => handleInputChange('ownerName', e.target.value)}
                      placeholder="Nombre completo"
                      className={`pl-10 ${errors.ownerName ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.ownerName && (
                    <p className="text-sm text-red-600 mt-1">{errors.ownerName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ownerPhone">Teléfono *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={e => handleInputChange('ownerPhone', e.target.value)}
                      placeholder="+56912345678"
                      className={`pl-10 ${errors.ownerPhone ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.ownerPhone && (
                    <p className="text-sm text-red-600 mt-1">{errors.ownerPhone}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="ownerEmail">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={formData.ownerEmail}
                    onChange={e => handleInputChange('ownerEmail', e.target.value)}
                    placeholder="email@ejemplo.com"
                    className={`pl-10 ${errors.ownerEmail ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.ownerEmail && (
                  <p className="text-sm text-red-600 mt-1">{errors.ownerEmail}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle>Programación</CardTitle>
              <CardDescription>Fecha y hora programada para realizar el trabajo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledDate">Fecha Programada *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={e => handleInputChange('scheduledDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`pl-10 ${errors.scheduledDate ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.scheduledDate && (
                    <p className="text-sm text-red-600 mt-1">{errors.scheduledDate}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="scheduledTime">Hora Programada *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={formData.scheduledTime}
                      onChange={e => handleInputChange('scheduledTime', e.target.value)}
                      className={`pl-10 ${errors.scheduledTime ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.scheduledTime && (
                    <p className="text-sm text-red-600 mt-1">{errors.scheduledTime}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notas Adicionales</CardTitle>
              <CardDescription>
                Información adicional relevante para el trabajo (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
                placeholder="Notas especiales, instrucciones, materiales requeridos, etc."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Trabajo
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
