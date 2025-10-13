'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  propertyTitle: string;
  propertyAddress: string;
  dateTime: string;
  type: 'viewing' | 'meeting' | 'valuation' | 'negotiation';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;
}

interface AppointmentStats {
  totalAppointments: number;
  todayAppointments: number;
  thisWeekAppointments: number;
  pendingConfirmations: number;
  completedThisMonth: number;
}

export default function BrokerAppointmentsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    thisWeekAppointments: 0,
    pendingConfirmations: 0,
    completedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

    const loadAppointmentsData = async () => {
      try {
        // Mock appointments data
        const mockAppointments: Appointment[] = [
          {
            id: '1',
            clientName: 'María González',
            clientEmail: 'maria@email.com',
            clientPhone: '+56912345678',
            propertyTitle: 'Departamento Moderno Providencia',
            propertyAddress: 'Av. Providencia 123, Providencia',
            dateTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // En 2 horas
            type: 'viewing',
            status: 'confirmed',
            notes: 'Cliente interesado en vista panorámica',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          },
          {
            id: '2',
            clientName: 'Carlos Ramírez',
            clientEmail: 'carlos@email.com',
            clientPhone: '+56987654321',
            propertyTitle: 'Casa Familiar Las Condes',
            propertyAddress: 'Calle Las Condes 456, Las Condes',
            dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Mañana
            type: 'meeting',
            status: 'scheduled',
            notes: 'Reunión para discutir negociación',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          },
          {
            id: '3',
            clientName: 'Ana López',
            clientEmail: 'ana@email.com',
            clientPhone: '+56955556666',
            propertyTitle: 'Oficina Corporativa Centro',
            propertyAddress: 'Av. Libertador 789, Santiago Centro',
            dateTime: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // Hace 4 horas
            type: 'viewing',
            status: 'completed',
            notes: 'Vista completada, cliente muy interesado',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          },
          {
            id: '4',
            clientName: 'Roberto Díaz',
            clientEmail: 'roberto@email.com',
            clientPhone: '+56944443333',
            propertyTitle: 'Local Comercial Ñuñoa',
            propertyAddress: 'Irarrázaval 321, Ñuñoa',
            dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // En 3 días
            type: 'valuation',
            status: 'scheduled',
            notes: 'Tasación solicitada por propietario',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          },
        ];

        setAppointments(mockAppointments);

        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const todayAppointments = mockAppointments.filter(apt => {
          const aptDate = new Date(apt.dateTime);
          return aptDate.toDateString() === today.toDateString();
        }).length;

        const thisWeekAppointments = mockAppointments.filter(apt => {
          const aptDate = new Date(apt.dateTime);
          return aptDate >= today && aptDate <= weekFromNow;
        }).length;

        const pendingConfirmations = mockAppointments.filter(
          apt => apt.status === 'scheduled'
        ).length;

        const completedThisMonth = mockAppointments.filter(apt => {
          const aptDate = new Date(apt.dateTime);
          return (
            apt.status === 'completed' &&
            aptDate.getMonth() === now.getMonth() &&
            aptDate.getFullYear() === now.getFullYear()
          );
        }).length;

        const appointmentStats: AppointmentStats = {
          totalAppointments: mockAppointments.length,
          todayAppointments,
          thisWeekAppointments,
          pendingConfirmations,
          completedThisMonth,
        };

        setStats(appointmentStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading appointments data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadAppointmentsData();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Programada', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completada', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
      no_show: { label: 'No Asistió', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      viewing: { label: 'Visita', color: 'bg-blue-100 text-blue-800' },
      meeting: { label: 'Reunión', color: 'bg-purple-100 text-purple-800' },
      valuation: { label: 'Tasación', color: 'bg-orange-100 text-orange-800' },
      negotiation: { label: 'Negociación', color: 'bg-green-100 text-green-800' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.viewing;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const handleNewAppointment = () => {
    // Navigate to new appointment creation page
    window.open('/broker/appointments/new', '_blank');
  };

  const handleViewAppointment = (appointmentId: string) => {
    // Navigate to appointment detail view
    window.open(`/broker/appointments/${appointmentId}`, '_blank');
  };

  const handleEditAppointment = (appointmentId: string) => {
    // Navigate to appointment edit page
    window.open(`/broker/appointments/${appointmentId}/edit`, '_blank');
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch =
      appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || appointment.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Gestión de Citas"
      subtitle="Agenda y administra todas tus citas inmobiliarias"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendario de Citas</h1>
            <p className="text-gray-600">Gestiona tus visitas, reuniones y tasaciones</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNewAppointment}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Citas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisWeekAppointments}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingConfirmations}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar citas por cliente o propiedad..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="scheduled">Programadas</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.map(appointment => (
            <Card
              key={appointment.id}
              className={`border-l-4 ${isToday(appointment.dateTime) ? 'border-l-green-500' : isPast(appointment.dateTime) ? 'border-l-gray-400' : 'border-l-blue-500'}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-lg ${isToday(appointment.dateTime) ? 'bg-green-50' : isPast(appointment.dateTime) ? 'bg-gray-50' : 'bg-blue-50'}`}
                    >
                      <Calendar className="w-6 h-6 text-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{appointment.clientName}</h3>
                        {getStatusBadge(appointment.status)}
                        {getTypeBadge(appointment.type)}
                        {isToday(appointment.dateTime) && (
                          <Badge className="bg-green-100 text-green-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Hoy
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">{appointment.propertyTitle}</span>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">
                            {appointment.propertyAddress}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">
                              {formatDateTime(appointment.dateTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {appointment.clientEmail}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {appointment.clientPhone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {appointment.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewAppointment(appointment.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditAppointment(appointment.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas programadas</h3>
            <p className="text-gray-600 mb-4">Programa tu primera cita para comenzar</p>
            <Button onClick={handleNewAppointment}>
              <Plus className="w-4 h-4 mr-2" />
              Programar Primera Cita
            </Button>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
