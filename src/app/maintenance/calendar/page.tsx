'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  User,
  Wrench,
  Clock,
  Phone,
  MessageCircle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';

interface CalendarJob {
  id: string;
  title: string;
  propertyAddress: string;
  ownerName: string;
  ownerPhone?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  maintenanceType: 'plumbing' | 'electrical' | 'structural' | 'cleaning' | 'other';
  estimatedCost: number;
  notes?: string;
}

export default function MaintenanceCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jobs, setJobs] = useState<CalendarJob[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Estado para modales
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CalendarJob | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadCalendarJobs();
  }, [currentDate]);

  const loadCalendarJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration
      const mockJobs: CalendarJob[] = [
        {
          id: '1',
          title: 'Reparación de cañería',
          propertyAddress: 'Av. Las Condes 1234, Depto 5B',
          ownerName: 'María González',
          ownerPhone: '+56912345678',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '11:00',
          status: 'confirmed',
          priority: 'high',
          maintenanceType: 'plumbing',
          estimatedCost: 45000,
          notes: 'Cliente solicita reparación urgente',
        },
        {
          id: '2',
          title: 'Mantenimiento eléctrico',
          propertyAddress: 'Providencia 567',
          ownerName: 'Carlos Rodríguez',
          ownerPhone: '+56987654321',
          date: '2024-01-18',
          startTime: '14:00',
          endTime: '16:00',
          status: 'scheduled',
          priority: 'medium',
          maintenanceType: 'electrical',
          estimatedCost: 80000,
        },
        {
          id: '3',
          title: 'Limpieza general',
          propertyAddress: 'Ñuñoa 890',
          ownerName: 'Ana López',
          ownerPhone: '+56911223344',
          date: '2024-01-20',
          startTime: '10:00',
          endTime: '12:00',
          status: 'scheduled',
          priority: 'low',
          maintenanceType: 'cleaning',
          estimatedCost: 30000,
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setJobs(mockJobs);
    } catch (error) {
      logger.error('Error loading calendar jobs:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar el calendario');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Programado', color: 'bg-blue-100 text-blue-800' },
      confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
      in_progress: { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completado', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Media', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getJobsForDate = (day: number) => {
    if (!day) {
      return [];
    }
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return jobs.filter(job => job.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Funciones para manejar botones
  const handleViewJobDetails = (job: CalendarJob) => {
    setSelectedJob(job);
    setShowJobDetailsModal(true);
  };

  const handleContactOwner = (job: CalendarJob) => {
    setSelectedJob(job);
    setShowContactModal(true);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Calendario" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando calendario...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Calendario" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadCalendarJobs}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  const daysInMonth = getDaysInMonth(currentDate);
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  return (
    <UnifiedDashboardLayout title="Calendario" subtitle="Agenda tus trabajos de mantenimiento">
      <div className="space-y-6">
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

        {/* Header with navigation */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Select
                  value={viewMode}
                  onValueChange={(value: 'month' | 'week') => setViewMode(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Mes</SelectItem>
                    <SelectItem value="week">Semana</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={loadCalendarJobs} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {daysInMonth.map((day, index) => {
                const dayJobs = day ? getJobsForDate(day) : [];
                const isToday =
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={index}
                    className={`
                      min-h-24 p-2 border rounded-lg cursor-pointer transition-colors
                      ${day ? 'hover:bg-gray-50' : ''}
                      ${isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}
                    `}
                    onClick={() =>
                      day &&
                      setSelectedDate(
                        new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                      )
                    }
                  >
                    {day && (
                      <>
                        <div
                          className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}
                        >
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayJobs.slice(0, 2).map(job => (
                            <div
                              key={job.id}
                              className={`
                                text-xs p-1 rounded truncate
                                ${
                                  job.priority === 'urgent'
                                    ? 'bg-red-100 text-red-800'
                                    : job.priority === 'high'
                                      ? 'bg-orange-100 text-orange-800'
                                      : job.priority === 'medium'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                }
                              `}
                              title={`${job.title} - ${job.startTime} ${job.ownerName}`}
                            >
                              {job.startTime} {job.title}
                            </div>
                          ))}
                          {dayJobs.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayJobs.length - 2} más
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle>
                Trabajos del{' '}
                {selectedDate.toLocaleDateString('es-CL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getJobsForDate(selectedDate.getDate()).map(job => (
                  <Card key={job.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            {getStatusBadge(job.status)}
                            {getPriorityBadge(job.priority)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{job.propertyAddress}</span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>{job.ownerName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>
                                  {job.startTime} - {job.endTime}
                                </span>
                              </div>
                            </div>

                            <div>
                              <div className="mb-1">
                                <span className="font-medium">Tipo: </span>
                                <span className="capitalize">{job.maintenanceType}</span>
                              </div>
                              <div className="mb-1">
                                <span className="font-medium">Costo estimado: </span>
                                <span className="text-green-600 font-semibold">
                                  {formatCurrency(job.estimatedCost)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {job.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                              {job.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewJobDetails(job)}
                          >
                            <Wrench className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContactOwner(job)}
                          >
                            <User className="w-4 h-4 mr-2" />
                            Contactar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {getJobsForDate(selectedDate.getDate()).length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay trabajos programados
                    </h3>
                    <p className="text-gray-600">No tienes trabajos agendados para este día.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Herramientas para gestión del calendario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Plus}
                label="Nuevo Trabajo"
                description="Agendar mantenimiento"
                onClick={() => router.push('/maintenance/jobs/new')}
              />

              <QuickActionButton
                icon={Calendar}
                label="Vista Semana"
                description="Cambiar a vista semanal"
                onClick={() => setViewMode('week')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar calendario"
                onClick={loadCalendarJobs}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalles del trabajo */}
      <Dialog open={showJobDetailsModal} onOpenChange={setShowJobDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Detalles del Trabajo
            </DialogTitle>
            <DialogDescription>Información completa del trabajo programado</DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Información del Trabajo</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Título:</span> {selectedJob.title}
                    </p>
                    <p>
                      <span className="font-medium">Estado:</span>{' '}
                      {getStatusBadge(selectedJob.status)}
                    </p>
                    <p>
                      <span className="font-medium">Prioridad:</span>{' '}
                      {getPriorityBadge(selectedJob.priority)}
                    </p>
                    <p>
                      <span className="font-medium">Tipo:</span> {selectedJob.maintenanceType}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Información de Horario</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Fecha:</span>{' '}
                      {new Date(selectedJob.date).toLocaleDateString('es-CL')}
                    </p>
                    <p>
                      <span className="font-medium">Horario:</span> {selectedJob.startTime} -{' '}
                      {selectedJob.endTime}
                    </p>
                    <p>
                      <span className="font-medium">Costo Estimado:</span>{' '}
                      {formatCurrency(selectedJob.estimatedCost)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del propietario */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Información del Propietario</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{selectedJob.ownerName}</span>
                    </div>
                    {selectedJob.ownerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedJob.ownerPhone}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedJob.propertyAddress}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {selectedJob.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Notas</h4>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{selectedJob.notes}</p>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowJobDetailsModal(false)}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    handleContactOwner(selectedJob);
                    setShowJobDetailsModal(false);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contactar Propietario
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de contacto */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Contactar Propietario
            </DialogTitle>
            <DialogDescription>
              Envía un mensaje al propietario sobre el trabajo programado
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Trabajo: {selectedJob.title}</h4>
                <p className="text-sm text-gray-600">
                  Programado para el {new Date(selectedJob.date).toLocaleDateString('es-CL')} a las{' '}
                  {selectedJob.startTime}
                </p>
                <p className="text-sm text-gray-600 mt-1">Propietario: {selectedJob.ownerName}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Método de Contacto</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="radio" id="phone" name="contactMethod" defaultChecked />
                      <label htmlFor="phone" className="text-sm">
                        Llamada telefónica
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="radio" id="message" name="contactMethod" />
                      <label htmlFor="message" className="text-sm">
                        Mensaje de texto
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="radio" id="email" name="contactMethod" />
                      <label htmlFor="email" className="text-sm">
                        Correo electrónico
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mensaje (opcional)</label>
                  <textarea
                    className="w-full p-2 border rounded-md text-sm"
                    rows={3}
                    placeholder="Escribe un mensaje personalizado..."
                    defaultValue={`Hola ${selectedJob.ownerName}, te contacto respecto al trabajo de mantenimiento programado para el ${new Date(selectedJob.date).toLocaleDateString('es-CL')}.`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowContactModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setSuccessMessage('Mensaje enviado exitosamente al propietario');
                    setShowContactModal(false);
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar Contacto
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}
