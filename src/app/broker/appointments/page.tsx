'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  Phone, 
  Mail,
  Plus,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Video, 
  Building, 
  Star,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';
import AppointmentForm from '@/components/calendar/AppointmentForm';

interface Appointment {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  type: 'visit' | 'meeting' | 'call' | 'video';
  priority: 'low' | 'medium' | 'high';
  reminderSent: boolean;
  createdAt: string;
  propertyTitle?: string;
  propertyAddress?: string;
  notes?: string;
}

interface AppointmentStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  completed: number;
  cancelled: number;
  pending: number;
}

export default function BrokerAppointments() {

  const [user, setUser] = useState<User | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
  });

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('all');

  const [searchTerm, setSearchTerm] = useState('');

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [selectedTime, setSelectedTime] = useState<string>('');

  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Mock data for properties and clients
  const [properties] = useState([
    { id: '1', title: 'Departamento Amoblado Centro', address: 'Av. Providencia 1234, Providencia' },
    { id: '2', title: 'Casa Las Condes', address: 'Calle El Alba 567, Las Condes' },
    { id: '3', title: 'Oficina Vitacura', address: 'Av. Kennedy 4567, Vitacura' },
    { id: '4', title: 'Departamento Playa', address: 'Av. Costanera 890, Viña del Mar' },
    { id: '5', title: 'Casa Familiar La Reina', address: 'Calle Los Leones 345, La Reina' },
    { id: '6', title: 'Local Comercial', address: 'Av. Apoquindo 6789, Las Condes' },
  ]);

  const [clients] = useState([
    { id: '1', name: 'Juan Pérez', email: 'juan.perez@email.com', phone: '+56 9 1234 5678' },
    { id: '2', name: 'María García', email: 'maria.garcia@email.com', phone: '+56 9 8765 4321' },
    { id: '3', name: 'Carlos López', email: 'carlos.lopez@email.com', phone: '+56 9 2345 6789' },
    { id: '4', name: 'Ana Martínez', email: 'ana.martinez@email.com', phone: '+56 9 3456 7890' },
    { id: '5', name: 'Roberto Silva', email: 'roberto.silva@email.com', phone: '+56 9 4567 8901' },
    { id: '6', name: 'Laura Fernández', email: 'laura.fernandez@email.com', phone: '+56 9 5678 9012' },
  ]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    const loadAppointments = async () => {
      try {
        // Mock appointments data
        const mockAppointments: Appointment[] = [
          {
            id: '1',
            title: 'Visita Departamento Centro',
            clientName: 'Juan Pérez',
            clientEmail: 'juan.perez@email.com',
            clientPhone: '+56 9 1234 5678',
            date: new Date().toISOString().substring(0, 10),
            time: '10:00',
            duration: 60,
            status: 'scheduled',
            type: 'visit',
            priority: 'medium',
            reminderSent: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            propertyTitle: 'Departamento Centro',
            propertyAddress: 'Av. Providencia 1234, Providencia',
          },
          {
            id: '2',
            title: 'Reunión Firma Contrato',
            clientName: 'María García',
            clientEmail: 'maria.garcia@email.com',
            clientPhone: '+56 9 8765 4321',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().substring(0, 10),
            time: '15:00',
            duration: 90,
            status: 'scheduled',
            type: 'meeting',
            priority: 'high',
            reminderSent: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            propertyTitle: 'Casa Las Condes',
            propertyAddress: 'Calle El Alba 567, Las Condes',
          },
          {
            id: '3',
            title: 'Llamada Seguimiento',
            clientName: 'Carlos López',
            clientEmail: 'carlos.lopez@email.com',
            clientPhone: '+56 9 2345 6789',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().substring(0, 10),
            time: '11:30',
            duration: 30,
            status: 'completed',
            type: 'call',
            priority: 'low',
            reminderSent: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
            propertyTitle: 'Oficina Vitacura',
            propertyAddress: 'Av. Kennedy 4567, Vitacura',
          },
          {
            id: '4',
            title: 'Video Visita Remota',
            clientName: 'Ana Martínez',
            clientEmail: 'ana.martinez@email.com',
            clientPhone: '+56 9 3456 7890',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().substring(0, 10),
            time: '16:00',
            duration: 45,
            status: 'scheduled',
            type: 'video',
            priority: 'medium',
            reminderSent: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            propertyTitle: 'Departamento Playa',
            propertyAddress: 'Av. Costanera 890, Viña del Mar',
          },
          {
            id: '5',
            title: 'Visita Casa Familia',
            clientName: 'Roberto Silva',
            clientEmail: 'roberto.silva@email.com',
            clientPhone: '+56 9 4567 8901',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString().substring(0, 10),
            time: '14:00',
            duration: 60,
            status: 'no_show',
            type: 'visit',
            priority: 'high',
            reminderSent: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            propertyTitle: 'Casa Familiar La Reina',
            propertyAddress: 'Calle Los Leones 345, La Reina',
          },
          {
            id: '6',
            title: 'Reunión Propuesta',
            clientName: 'Laura Fernández',
            clientEmail: 'laura.fernandez@email.com',
            clientPhone: '+56 9 5678 9012',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().substring(0, 10),
            time: '10:30',
            duration: 120,
            status: 'scheduled',
            type: 'meeting',
            priority: 'medium',
            reminderSent: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            propertyTitle: 'Local Comercial',
            propertyAddress: 'Av. Apoquindo 6789, Las Condes',
          },
        ];

        setAppointments(mockAppointments);

        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        const appointmentStats = mockAppointments.reduce((acc, appointment) => {
          acc.total++;
          
          const appointmentDate = new Date(appointment.date);
          if (appointmentDate.toDateString() === today.toDateString()) {
            acc.today++;
          }
          if (appointmentDate >= today && appointmentDate <= weekFromNow) {
            acc.thisWeek++;
          }
          if (appointmentDate >= today && appointmentDate <= monthFromNow) {
            acc.thisMonth++;
          }
          
          if (appointment.status === 'completed') {
            acc.completed++;
          } else if (appointment.status === 'cancelled') {
            acc.cancelled++;
          } else {
            acc.pending++;
          }
          
          return acc;
        }, {
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          completed: 0,
          cancelled: 0,
          pending: 0,
        } as AppointmentStats);

        setStats(appointmentStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading appointments:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadAppointments();
  }, []);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    setAppointments(prev => prev.map(appointment => 
      appointment.id === appointmentId 
        ? { ...appointment, status: newStatus as Appointment['status'] }
        : appointment,
    ));
  };

  const deleteAppointment = async (appointmentId: string) => {
    setAppointments(prev => prev.filter(appointment => appointment.id !== appointmentId));
  };

  // Calendar and form handlers
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowAppointmentForm(true);
  };

  const handleCreateAppointment = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
    setEditingAppointment(null);
    setShowAppointmentForm(true);
  };

  const handleSaveAppointment = (appointmentData: any) => {
    if (editingAppointment) {
      // Update existing appointment
      setAppointments(prev => prev.map(appointment => 
        appointment.id === editingAppointment.id 
          ? { ...appointment, ...appointmentData }
          : appointment,
      ));
    } else {
      // Create new appointment
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        ...appointmentData,
        createdAt: new Date().toISOString(),
        reminderSent: false,
      };
      setAppointments(prev => [...prev, newAppointment]);
    }
    
    setShowAppointmentForm(false);
    setEditingAppointment(null);
    setSelectedDate(null);
    setSelectedTime('');
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setSelectedDate(new Date());
    setSelectedTime('');
    setShowAppointmentForm(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visit':
        return <Building className="w-5 h-5" />;
      case 'meeting':
        return <UserIcon className="w-5 h-5" />;
      case 'call':
        return <Phone className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'no_show':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-emerald-100 text-emerald-800">Programada</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case 'no_show':
        return <Badge className="bg-orange-100 text-orange-800">No asistió</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (date: string, time: string) => {
    return new Date(`${date}T${time}`).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
return `Hace ${diffMins} minutos`;
}
    if (diffHours < 24) {
return `Hace ${diffHours} horas`;
}
    if (diffDays < 7) {
return `Hace ${diffDays} días`;
}
    
    return date.toLocaleDateString('es-CL');
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  const isUpcoming = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    return date >= today;
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = filter === 'all' || appointment.status === filter || appointment.type === filter;
    const matchesSearch = appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                   appointment.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Citas y Visitas"
      subtitle="Gestiona todas tus citas y visitas programadas"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Citas y Visitas</h1>
            <p className="text-gray-600">Gestiona todas tus citas y visitas programadas</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleNewAppointment}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {viewMode === 'calendar' ? 'Vista Lista' : 'Vista Calendario'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600">Total Citas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.today}</p>
                <p className="text-xs text-gray-600">Hoy</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-gray-600">Completadas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                <p className="text-xs text-gray-600">Pendientes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {viewMode === 'calendar' ? (
          <AppointmentCalendar
            appointments={appointments.map(apt => ({
              id: apt.id,
              title: apt.title,
              clientName: apt.clientName,
              date: apt.date,
              time: apt.time,
              duration: apt.duration,
              status: apt.status,
              type: apt.type,
              priority: apt.priority,
              propertyTitle: apt.propertyTitle || '',
              propertyAddress: apt.propertyAddress || '',
            }))}
            onDateClick={handleDateClick}
            onAppointmentClick={(apt) => {
              const fullAppointment = appointments.find(a => a.id === apt.id);
              if (fullAppointment) {
                handleAppointmentClick(fullAppointment);
              }
            }}
            onCreateAppointment={handleCreateAppointment}
          />
        ) : (
          <>
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar citas..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Todas</option>
                  <option value="scheduled">Programadas</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                  <option value="no_show">No asistió</option>
                  <option value="visit">Visitas</option>
                  <option value="meeting">Reuniones</option>
                  <option value="call">Llamadas</option>
                  <option value="video">Video</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>

        {/* Today's Appointments */}
        {stats.today > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Citas de Hoy</h2>
            <div className="space-y-4">
              {appointments
                .filter(apt => isToday(apt.date))
                .map((appointment) => (
                  <Card key={appointment.id} className={`border-l-4 ${getStatusColor(appointment.status)}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${getStatusColor(appointment.status)}`}>
                            {getTypeIcon(appointment.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
                              {getStatusBadge(appointment.status)}
                              <Badge className={getPriorityColor(appointment.priority)}>
                                {appointment.priority === 'high' ? 'Alta' : 
                                 appointment.priority === 'medium' ? 'Media' : 'Baja'}
                              </Badge>
                              {appointment.reminderSent && (
                                <Badge className="bg-purple-100 text-purple-800">Recordatorio</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                <span>{appointment.clientName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{appointment.time} ({appointment.duration} min)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                <span>{appointment.propertyTitle}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{appointment.propertyAddress}</span>
                              </div>
                            </div>
                            
                            {appointment.notes && (
                              <p className="text-sm text-gray-600 mb-2">{appointment.notes}</p>
                            )}
                            
                            <div className="flex gap-4 text-xs text-gray-500">
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
                        <div className="flex items-center gap-2 ml-4">
                          {appointment.status === 'scheduled' && (
                            <>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`tel:${appointment.clientPhone}`}>
                                  <Phone className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`mailto:${appointment.clientEmail}`}>
                                  <Mail className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteAppointment(appointment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* All Appointments */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {filter === 'all' ? 'Todas las Citas' : 
             filter === 'scheduled' ? 'Citas Programadas' :
             filter === 'completed' ? 'Citas Completadas' :
             filter === 'cancelled' ? 'Citas Canceladas' : 
             filter === 'visit' ? 'Visitas' :
             filter === 'meeting' ? 'Reuniones' :
             filter === 'call' ? 'Llamadas' : 'Video Citas'}
          </h2>
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron citas</p>
                    <p className="text-sm text-gray-400">Intenta ajustar tus filtros de búsqueda</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredAppointments
                .filter(apt => !isToday(apt.date))
                .map((appointment) => (
                  <Card key={appointment.id} className={`border-l-4 ${getStatusColor(appointment.status)}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${getStatusColor(appointment.status)}`}>
                            {getTypeIcon(appointment.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
                              {getStatusBadge(appointment.status)}
                              <Badge className={getPriorityColor(appointment.priority)}>
                                {appointment.priority === 'high' ? 'Alta' : 
                                 appointment.priority === 'medium' ? 'Media' : 'Baja'}
                              </Badge>
                              {isUpcoming(appointment.date) && appointment.status === 'scheduled' && (
                                <Badge className="bg-emerald-100 text-emerald-800">Próxima</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                <span>{appointment.clientName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{formatDateTime(appointment.date, appointment.time)} ({appointment.duration} min)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                <span>{appointment.propertyTitle}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{appointment.propertyAddress}</span>
                              </div>
                            </div>
                            
                            {appointment.notes && (
                              <p className="text-sm text-gray-600 mb-2">{appointment.notes}</p>
                            )}
                            
                            <div className="flex gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {appointment.clientEmail}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {appointment.clientPhone}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Creada {formatRelativeTime(appointment.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {appointment.status === 'scheduled' && (
                            <>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`tel:${appointment.clientPhone}`}>
                                  <Phone className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`mailto:${appointment.clientEmail}`}>
                                  <Mail className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteAppointment(appointment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </div>
          </>
        )}
      </div>

      {/* Appointment Form Modal */}
      <AppointmentForm
        isOpen={showAppointmentForm}
        onClose={() => {
          setShowAppointmentForm(false);
          setEditingAppointment(null);
        }}
        onSave={handleSaveAppointment}
        selectedDate={selectedDate || new Date()}
        selectedTime={selectedTime}
        properties={properties}
        clients={clients}
        editingAppointment={editingAppointment}
      />
    </EnhancedDashboardLayout>
  );
}
