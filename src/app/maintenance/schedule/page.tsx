'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
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
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wrench,
  Phone,
  Mail,
  Eye,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface ScheduledJob {
  id: string;
  title: string;
  propertyAddress: string;
  ownerName: string;
  ownerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  maintenanceType: 'plumbing' | 'electrical' | 'structural' | 'cleaning' | 'other';
  estimatedCost: number;
  notes?: string;
}

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

export default function MaintenanceSchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSchedule();
  }, [currentWeek]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration
      const mockJobs: ScheduledJob[] = [
        {
          id: '1',
          title: 'Reparación de cañería',
          propertyAddress: 'Av. Las Condes 1234, Depto 5B',
          ownerName: 'María González',
          ownerPhone: '+56912345678',
          date: getDateForDay(1), // Lunes
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
          propertyAddress: 'Providencia 567, Oficina 301',
          ownerName: 'Carlos Rodríguez',
          ownerPhone: '+56987654321',
          date: getDateForDay(2), // Martes
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
          propertyAddress: 'Ñuñoa 890, Casa Principal',
          ownerName: 'Ana López',
          ownerPhone: '+56911223344',
          date: getDateForDay(3), // Miércoles
          startTime: '10:00',
          endTime: '12:00',
          status: 'confirmed',
          priority: 'low',
          maintenanceType: 'cleaning',
          estimatedCost: 30000,
        },
        {
          id: '4',
          title: 'Revisión estructural',
          propertyAddress: 'Vitacura 1500, Casa 45',
          ownerName: 'Pedro Sánchez',
          ownerPhone: '+56944332211',
          date: getDateForDay(4), // Jueves
          startTime: '13:00',
          endTime: '17:00',
          status: 'scheduled',
          priority: 'high',
          maintenanceType: 'structural',
          estimatedCost: 120000,
          notes: 'Revisión completa de cimientos',
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setScheduledJobs(mockJobs);
    } catch (error) {
      logger.error('Error loading schedule:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar el horario');
    } finally {
      setLoading(false);
    }
  };

  const getDateForDay = (dayIndex: number): string => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + dayIndex);
    return startOfWeek.toISOString().substring(0, 10);
  };

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeek);
      date.setDate(currentWeek.getDate() - currentWeek.getDay() + i);
      dates.push(date);
    }
    return dates;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getJobsForDay = (dateString: string) => {
    return scheduledJobs.filter(job => job.date === dateString);
  };

  const getJobsForTimeSlot = (dayIndex: number, hour: number) => {
    const dateString = getDateForDay(dayIndex);
    return scheduledJobs.filter(job => {
      if (job.date !== dateString) {
        return false;
      }

      const startTimeParts = job.startTime.split(':');
      const endTimeParts = job.endTime.split(':');

      if (!startTimeParts[0] || !endTimeParts[0]) {
        return false;
      }

      const startHour = parseInt(startTimeParts[0]);
      const endHour = parseInt(endTimeParts[0]);

      return hour >= startHour && hour < endHour;
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Programado', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En Progreso', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (time: string) => {
    const timeParts = time.split(':');
    if (!timeParts[0] || !timeParts[1]) {
      return time;
    }

    const hour = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Horario de Trabajo" subtitle="Cargando horario...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando horario de trabajo...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Horario de Trabajo" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadSchedule}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Horario de Trabajo"
      subtitle="Gestiona tu agenda semanal de mantenimientos"
    >
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

        {/* Header with Navigation */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Semana del {getWeekDates()[0]?.toLocaleDateString('es-CL')} al{' '}
                  {getWeekDates()[6]?.toLocaleDateString('es-CL')}
                </CardTitle>
                <CardDescription>
                  {scheduledJobs.length} trabajos programados esta semana
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select
                  value={viewMode}
                  onValueChange={(value: 'week' | 'day') => setViewMode(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Vista Semana</SelectItem>
                    <SelectItem value="day">Vista Día</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
                    Hoy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Trabajo
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {viewMode === 'week' ? (
          /* Weekly View */
          <div className="grid grid-cols-8 gap-1 bg-white rounded-lg border overflow-hidden">
            {/* Time Column Header */}
            <div className="bg-gray-50 p-4 border-b font-semibold text-gray-700">Hora</div>

            {/* Day Headers */}
            {getWeekDates().map((date, index) => (
              <div key={index} className="bg-gray-50 p-4 border-b text-center">
                <div className="font-semibold text-gray-700">{DAYS_OF_WEEK[date.getDay()]}</div>
                <div className="text-sm text-gray-500">
                  {date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {getJobsForDay(date.toISOString().substring(0, 10)).length} trabajos
                </div>
              </div>
            ))}

            {/* Time Slots */}
            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                <div className="bg-gray-50 p-2 border-b text-center text-sm text-gray-600">
                  {hour}:00
                </div>
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const jobsInSlot = getJobsForTimeSlot(dayIndex, hour);
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className="bg-white p-1 border-b min-h-[60px] hover:bg-gray-50 transition-colors"
                    >
                      {jobsInSlot.map(job => (
                        <div
                          key={job.id}
                          className="bg-blue-100 border border-blue-200 rounded p-2 mb-1 text-xs cursor-pointer hover:bg-blue-200 transition-colors"
                          title={`${job.title} - ${job.propertyAddress}`}
                        >
                          <div className="font-semibold truncate">{job.title}</div>
                          <div className="text-gray-600 truncate">
                            {job.propertyAddress.split(',')[0]}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-gray-500">
                              {formatTime(job.startTime)} - {formatTime(job.endTime)}
                            </span>
                            {getPriorityBadge(job.priority)}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        ) : (
          /* Daily View - Placeholder for now */
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Vista Diaria Próximamente
                </h3>
                <p className="text-gray-600">
                  La vista detallada por día estará disponible próximamente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Hoy</CardTitle>
            <CardDescription>
              Trabajos programados para{' '}
              {new Date().toLocaleDateString('es-CL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getJobsForDay(new Date().toISOString().substring(0, 10)).map(job => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.propertyAddress}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(job.status)}
                      {getPriorityBadge(job.priority)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {formatTime(job.startTime)} - {formatTime(job.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{job.ownerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-gray-400" />
                      <span className="text-sm capitalize">{job.maintenanceType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(job.estimatedCost)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalles
                    </Button>
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4 mr-1" />
                      Contactar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>
              ))}

              {getJobsForDay(new Date().toISOString().substring(0, 10)).length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay trabajos programados para hoy
                  </h3>
                  <p className="text-gray-600">Tu agenda está libre para el día de hoy.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
