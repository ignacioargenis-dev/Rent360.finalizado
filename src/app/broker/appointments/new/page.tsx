'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
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
import { ArrowLeft, Calendar, Clock, User, MapPin, Phone, Mail, Save, Loader2 } from 'lucide-react';
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
  notes: string;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AppointmentForm>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    propertyTitle: '',
    propertyAddress: '',
    date: '',
    time: '',
    type: 'viewing',
    notes: '',
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
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

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
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, this would be:
      // const response = await fetch('/api/appointments', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      alert('Cita programada exitosamente');
      router.push('/broker/appointments');
    } catch (error) {
      logger.error('Error creating appointment:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al programar la cita. Por favor intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/broker/appointments');
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Nueva Cita" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Programar Nueva Cita"
      subtitle="Registra los detalles de la nueva cita inmobiliaria"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Cita</h1>
            <p className="text-gray-600">Completa la información para programar la cita</p>
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
                  <CardTitle>Resumen de la Cita</CardTitle>
                  <CardDescription>Verificación de la información ingresada</CardDescription>
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
                            Programando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Programar Cita
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
