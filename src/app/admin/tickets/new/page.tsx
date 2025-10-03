'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
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
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Ticket,
} from 'lucide-react';
import { User as UserType } from '@/types';

interface CreateTicketForm {
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  category: 'technical' | 'billing' | 'account' | 'feature' | 'bug' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTicketForm>({
    title: '',
    description: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    category: 'technical',
    priority: 'medium',
    assignedTo: '',
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

  const handleInputChange = (field: keyof CreateTicketForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.clientName.trim() ||
      !formData.clientEmail.trim()
    ) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.clientEmail)) {
      alert('Por favor ingrese un email válido.');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement actual API call to create ticket
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful creation
      alert('Ticket creado exitosamente');

      // Redirect back to tickets list
      router.push('/admin/tickets');
    } catch (error) {
      logger.error('Error creating ticket:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al crear el ticket. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/tickets');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'billing':
        return <AlertTriangle className="w-5 h-5 text-green-600" />;
      case 'account':
        return <User className="w-5 h-5 text-purple-600" />;
      case 'feature':
        return <Ticket className="w-5 h-5 text-indigo-600" />;
      case 'bug':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'other':
        return <Clock className="w-5 h-5 text-gray-600" />;
      default:
        return <Ticket className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-300 bg-red-50';
      case 'high':
        return 'border-orange-300 bg-orange-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      case 'low':
        return 'border-green-300 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <UnifiedDashboardLayout
      title="Crear Nuevo Ticket"
      subtitle="Registra un nuevo ticket de soporte"
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
              <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Ticket</h1>
              <p className="text-gray-600">
                Complete el formulario para registrar un ticket de soporte
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="w-5 h-5" />
                      Información del Ticket
                    </CardTitle>
                    <CardDescription>Detalles principales del ticket de soporte</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium">
                        Título del Ticket *
                      </Label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="Ej: Problema con pago en línea"
                        value={formData.title}
                        onChange={e => handleInputChange('title', e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium">
                        Descripción *
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describa detalladamente el problema o solicitud..."
                        value={formData.description}
                        onChange={e => handleInputChange('description', e.target.value)}
                        className="mt-1 min-h-[120px]"
                        required
                      />
                    </div>

                    {/* Category and Priority */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Categoría *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={value => handleInputChange('category', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seleccione categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technical">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                Técnico
                              </div>
                            </SelectItem>
                            <SelectItem value="billing">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-green-600" />
                                Facturación
                              </div>
                            </SelectItem>
                            <SelectItem value="account">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-purple-600" />
                                Cuenta
                              </div>
                            </SelectItem>
                            <SelectItem value="feature">
                              <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-indigo-600" />
                                Funcionalidad
                              </div>
                            </SelectItem>
                            <SelectItem value="bug">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-600" />
                                Bug
                              </div>
                            </SelectItem>
                            <SelectItem value="other">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-600" />
                                Otro
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Prioridad *</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={value => handleInputChange('priority', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seleccione prioridad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                Baja
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                Media
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                Alta
                              </div>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                Urgente
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Information */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Información del Cliente
                    </CardTitle>
                    <CardDescription>
                      Datos de contacto del cliente que reporta el ticket
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="clientName" className="text-sm font-medium">
                        Nombre del Cliente *
                      </Label>
                      <Input
                        id="clientName"
                        type="text"
                        placeholder="Ej: Carlos Ramírez"
                        value={formData.clientName}
                        onChange={e => handleInputChange('clientName', e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clientEmail" className="text-sm font-medium">
                          Email *
                        </Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          placeholder="cliente@email.com"
                          value={formData.clientEmail}
                          onChange={e => handleInputChange('clientEmail', e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="clientPhone" className="text-sm font-medium">
                          Teléfono
                        </Label>
                        <Input
                          id="clientPhone"
                          type="tel"
                          placeholder="+56912345678"
                          value={formData.clientPhone}
                          onChange={e => handleInputChange('clientPhone', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div>
                {/* Assignment */}
                <Card>
                  <CardHeader>
                    <CardTitle>Asignación</CardTitle>
                    <CardDescription>Asigne este ticket a un agente de soporte</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label className="text-sm font-medium">Asignar a</Label>
                      <Select
                        value={formData.assignedTo || ''}
                        onValueChange={value => handleInputChange('assignedTo', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar agente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maría_gonzález">María González</SelectItem>
                          <SelectItem value="juan_pérez">Juan Pérez</SelectItem>
                          <SelectItem value="carmen_rodríguez">Carmen Rodríguez</SelectItem>
                          <SelectItem value="pedro_silva">Pedro Silva</SelectItem>
                          <SelectItem value="ana_soto">Ana Soto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Vista Previa</CardTitle>
                    <CardDescription>Cómo se verá el ticket</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`p-4 rounded-lg border-2 ${getPriorityColor(formData.priority)}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(formData.category)}
                        <span className="font-medium text-sm">
                          {formData.title || 'Título del ticket'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {formData.description || 'Descripción del ticket...'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{formData.clientName || 'Cliente'}</span>
                        <Mail className="w-3 h-3 ml-2" />
                        <span>{formData.clientEmail || 'email@cliente.com'}</span>
                      </div>
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
                        Crear Ticket
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
