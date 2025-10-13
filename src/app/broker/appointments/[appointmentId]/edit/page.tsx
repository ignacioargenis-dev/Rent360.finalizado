'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Save,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { User as UserType } from '@/types';

interface AppointmentForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  propertyTitle: string;
  propertyAddress: string;
  date: string;
  time: string;
  type: 'viewing' | 'meeting' | 'valuation' | 'negotiation';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes: string;
}

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.appointmentId as string;

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AppointmentForm>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    propertyTitle: '',
    propertyAddress: '',
    date: '',
    time: '',
    type: 'viewing',
    status: 'scheduled',
    notes: '',
  });

  const loadUserData = useCallback(async () => {
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
  }, []);

  const loadAppointmentData = useCallback(async () => {
    try {
      setLoading(true);

      // Mock appointment data - in a real app this would come from API
      const mockAppointment = {
        id: appointmentId,
        clientName: 'María González',
        clientEmail: 'maria@email.com',
        clientPhone: '+56912345678',
        propertyTitle: 'Departamento Moderno Providencia',
        propertyAddress: 'Av. Providencia 123, Providencia',
        dateTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // En 2 horas
        type: 'viewing' as const,
        status: 'confirmed' as const,
        notes: 'Cliente interesado en vista panorámica. Traer documentos de la propiedad.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      };

      // Convert dateTime to separate date and time
      const dateTime = new Date(mockAppointment.dateTime);
      const date = dateTime.toISOString().split('T')[0]!;
      const time = dateTime.toTimeString().slice(0, 5)!;

      setFormData({
        clientName: mockAppointment.clientName,
        clientEmail: mockAppointment.clientEmail,
        clientPhone: mockAppointment.clientPhone,
        propertyTitle: mockAppointment.propertyTitle,
        propertyAddress: mockAppointment.propertyAddress,
        date,
        time,
        type: mockAppointment.type,
        status: mockAppointment.status,
        notes: mockAppointment.notes || '',
      });

      setError(null);
    } catch (err) {
      logger.error('Error loading appointment data:', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Error al cargar los datos de la cita');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadAppointmentData();
    loadUserData();
  }, [appointmentId, loadAppointmentData, loadUserData]);

  const handleInputChange = (field: keyof AppointmentForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.clientName ||
      !formData.clientEmail ||
      !formData.propertyTitle ||
      !formData.date ||
      !formData.time
    ) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Success - navigate back to appointment details
      router.push(`/broker/appointments/${appointmentId}`);
    } catch (error) {
      logger.error('Error updating appointment:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al actualizar la cita. Por favor intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/broker/appointments/${appointmentId}`);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Editar Cita" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando datos de la cita...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Editar Cita" subtitle="Error">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/broker/appointments')}>Volver a Citas</Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout title="Editar Cita" subtitle={`Modificar cita #${appointmentId}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Cita</h1>
            <p className="text-gray-600">Modifica la información de la cita programada</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Información del Cliente
                  </CardTitle>
                  <CardDescription>Datos del cliente que asistirá a la cita</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Cliente *
                      </label>
                      <Input
                        placeholder="Ej: María González"
                        value={formData.clientName}
                        onChange={e => handleInputChange('clientName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Cita
                      </label>
                      <Select
                        value={formData.type}
                        onValueChange={value => handleInputChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewing">Visita a Propiedad</SelectItem>
                          <SelectItem value="meeting">Reunión</SelectItem>
                          <SelectItem value="valuation">Tasación</SelectItem>
                          <SelectItem value="negotiation">Negociación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email del Cliente *
                      </label>
                      <Input
                        type="email"
                        placeholder="cliente@email.com"
                        value={formData.clientEmail}
                        onChange={e => handleInputChange('clientEmail', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Teléfono del Cliente
                      </label>
                      <Input
                        placeholder="+56912345678"
                        value={formData.clientPhone}
                        onChange={e => handleInputChange('clientPhone', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Información de la Propiedad
                  </CardTitle>
                  <CardDescription>
                    Detalles de la propiedad relacionada con la cita
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título de la Propiedad *
                    </label>
                    <Input
                      placeholder="Ej: Departamento Moderno Providencia"
                      value={formData.propertyTitle}
                      onChange={e => handleInputChange('propertyTitle', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección de la Propiedad
                    </label>
                    <Input
                      placeholder="Ej: Av. Providencia 123, Providencia"
                      value={formData.propertyAddress}
                      onChange={e => handleInputChange('propertyAddress', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Date and Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Fecha y Hora
                  </CardTitle>
                  <CardDescription>Selecciona la fecha y hora para la cita</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha *
                      </label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={e => handleInputChange('date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Hora *
                      </label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={e => handleInputChange('time', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado de la Cita</CardTitle>
                  <CardDescription>Actualiza el estado actual de la cita</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.status}
                    onValueChange={value => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Programada</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="no_show">No Asistió</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notas Adicionales</CardTitle>
                  <CardDescription>Información adicional sobre la cita (opcional)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Agrega notas importantes sobre la cita, requisitos especiales, etc."
                    rows={4}
                    value={formData.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Cambios</CardTitle>
                  <CardDescription>Verificación de la información modificada</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Cliente:</span>
                      <p className="text-sm">{formData.clientName || 'No especificado'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Tipo:</span>
                      <p className="text-sm">
                        {formData.type === 'viewing'
                          ? 'Visita a Propiedad'
                          : formData.type === 'meeting'
                            ? 'Reunión'
                            : formData.type === 'valuation'
                              ? 'Tasación'
                              : 'Negociación'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Estado:</span>
                      <p className="text-sm">
                        {formData.status === 'scheduled'
                          ? 'Programada'
                          : formData.status === 'confirmed'
                            ? 'Confirmada'
                            : formData.status === 'completed'
                              ? 'Completada'
                              : formData.status === 'cancelled'
                                ? 'Cancelada'
                                : 'No Asistió'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Propiedad:</span>
                      <p className="text-sm">{formData.propertyTitle || 'No especificada'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Fecha y Hora:</span>
                      <p className="text-sm">
                        {formData.date && formData.time
                          ? `${new Date(formData.date).toLocaleDateString('es-CL')} ${formData.time}`
                          : 'No especificada'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
