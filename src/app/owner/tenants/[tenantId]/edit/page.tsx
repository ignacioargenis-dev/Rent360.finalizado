'use client';

import React, { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  User,
  Phone,
  Mail,
  DollarSign,
  Calendar,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';
import { logger } from '@/lib/logger';

interface TenantData {
  id: string;
  name: string;
  email: string;
  phone: string;
  rut?: string;
  birthDate?: string;
  occupation?: string;
  income?: number;
  status: 'ACTIVE' | 'PENDING' | 'TERMINATED' | 'NOTICE';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

export default function OwnerTenantEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserState();
  const tenantId = params.tenantId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<TenantData>({
    id: '',
    name: '',
    email: '',
    phone: '',
    rut: '',
    birthDate: '',
    occupation: '',
    income: 0,
    status: 'ACTIVE',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock data for tenant
  const mockTenant: TenantData = {
    id: tenantId,
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+56 9 1234 5678',
    rut: '12.345.678-9',
    birthDate: '1985-03-15',
    occupation: 'Profesora',
    income: 800000,
    status: 'ACTIVE',
    emergencyContactName: 'Carlos González',
    emergencyContactPhone: '+56 9 8765 4321',
    emergencyContactRelationship: 'Hermano',
  };

  useEffect(() => {
    loadTenantData();
  }, [tenantId]);

  const loadTenantData = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFormData(mockTenant);
    } catch (error) {
      logger.error('Error al cargar datos del inquilino', { error, tenantId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TenantData, value: string | number) => {
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (formData.rut && !/^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/.test(formData.rut)) {
      newErrors.rut = 'El RUT no tiene un formato válido';
    }

    if (formData.income && formData.income < 0) {
      newErrors.income = 'Los ingresos deben ser un valor positivo';
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

      logger.info('Inquilino actualizado exitosamente', { tenantId });
      router.push(`/owner/tenants/${tenantId}`);
    } catch (error) {
      logger.error('Error al guardar el inquilino', { error, tenantId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/owner/tenants/${tenantId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin mr-2" />
          <span>Cargando datos del inquilino...</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Editar Inquilino</h1>
              <p className="text-gray-600">Modifica la información del inquilino</p>
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
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label htmlFor="rut">RUT</Label>
                    <Input
                      id="rut"
                      value={formData.rut}
                      onChange={e => handleInputChange('rut', e.target.value)}
                      placeholder="12.345.678-9"
                      className={errors.rut ? 'border-red-500' : ''}
                    />
                    {errors.rut && <p className="text-sm text-red-500 mt-1">{errors.rut}</p>}
                  </div>

                  <div>
                    <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={e => handleInputChange('birthDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="occupation">Ocupación</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={e => handleInputChange('occupation', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="income">Ingresos Mensuales (CLP)</Label>
                    <Input
                      id="income"
                      type="number"
                      min="0"
                      value={formData.income}
                      onChange={e => handleInputChange('income', parseInt(e.target.value) || 0)}
                      className={errors.income ? 'border-red-500' : ''}
                    />
                    {errors.income && <p className="text-sm text-red-500 mt-1">{errors.income}</p>}
                  </div>

                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: TenantData['status']) =>
                        handleInputChange('status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="PENDING">Pendiente</SelectItem>
                        <SelectItem value="NOTICE">Con Aviso</SelectItem>
                        <SelectItem value="TERMINATED">Terminado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contacto de Emergencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Nombre</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={e => handleInputChange('emergencyContactName', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyContactPhone">Teléfono</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={e => handleInputChange('emergencyContactPhone', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyContactRelationship">Relación</Label>
                    <Select
                      value={formData.emergencyContactRelationship || ''}
                      onValueChange={value =>
                        handleInputChange('emergencyContactRelationship', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar relación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Padre">Padre</SelectItem>
                        <SelectItem value="Madre">Madre</SelectItem>
                        <SelectItem value="Hermano">Hermano/a</SelectItem>
                        <SelectItem value="Hijo">Hijo/a</SelectItem>
                        <SelectItem value="Esposo">Esposo/a</SelectItem>
                        <SelectItem value="Amigo">Amigo/a</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nombre:</span>
                  <span className="font-medium">{formData.name || 'No especificado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium">{formData.email || 'No especificado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Teléfono:</span>
                  <span className="font-medium">{formData.phone || 'No especificado'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span className="font-medium">
                    {formData.status === 'ACTIVE'
                      ? 'Activo'
                      : formData.status === 'PENDING'
                        ? 'Pendiente'
                        : formData.status === 'NOTICE'
                          ? 'Con Aviso'
                          : 'Terminado'}
                  </span>
                </div>
                {formData.income && formData.income > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ingresos:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(formData.income)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleInputChange('status', 'ACTIVE')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como Activo
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleInputChange('status', 'NOTICE')}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Dar Aviso de Desalojo
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleInputChange('status', 'TERMINATED')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Terminar Contrato
                </Button>
              </CardContent>
            </Card>

            {/* Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Errores de Validación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-red-600">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>• {error}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
