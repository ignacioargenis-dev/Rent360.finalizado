'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, 
  Calendar, 
  Clock, 
  Star, 
  MessageCircle, 
  CheckCircle,
  AlertCircle,
  Camera,
  DollarSign,
  Phone,
  Mail,
  Eye, Plus,
  Search,
  Filter,
  MoreHorizontal,
  Home,
  Award,
  Navigation } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface Visit {
  id: string;
  propertyTitle: string;
  address: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedDuration: number;
  actualDuration?: number;
  earnings: number;
  notes?: string;
  photosRequired: boolean;
  photosUploaded: number;
  clientRating?: number;
  clientFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

interface VisitStats {
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  inProgressVisits: number;
  cancelledVisits: number;
  totalEarnings: number;
  averageRating: number;
  completionRate: number;
  averageResponseTime: number;
}

export default function RunnerVisitsPage() {
  const { user, loading: userLoading } = useUserState();

  const [visits, setVisits] = useState<Visit[]>([]);

  const [stats, setStats] = useState<VisitStats>({
    totalVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
    inProgressVisits: 0,
    cancelledVisits: 0,
    totalEarnings: 0,
    averageRating: 0,
    completionRate: 0,
    averageResponseTime: 0,
  });

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      const mockVisits: Visit[] = [
        {
          id: '1',
          propertyTitle: 'Departamento Las Condes',
          address: 'Av. Apoquindo 3400, Las Condes',
          clientName: 'Carlos Ramírez',
          clientPhone: '+56 9 1234 5678',
          clientEmail: 'carlos@ejemplo.com',
          scheduledDate: '2024-03-15',
          scheduledTime: '10:00',
          status: 'PENDING',
          priority: 'HIGH',
          estimatedDuration: 30,
          earnings: 15000,
          notes: 'Cliente necesita ver estacionamiento y bodega',
          photosRequired: true,
          photosUploaded: 0,
          createdAt: '2024-03-14 15:30',
          updatedAt: '2024-03-14 15:30',
        },
        {
          id: '2',
          propertyTitle: 'Oficina Providencia',
          address: 'Av. Providencia 1245, Providencia',
          clientName: 'Ana Martínez',
          clientPhone: '+56 9 8765 4321',
          clientEmail: 'ana@ejemplo.com',
          scheduledDate: '2024-03-15',
          scheduledTime: '14:30',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          estimatedDuration: 45,
          actualDuration: 0,
          earnings: 20000,
          photosRequired: true,
          photosUploaded: 0,
          createdAt: '2024-03-14 16:45',
          updatedAt: '2024-03-15 14:30',
        },
        {
          id: '3',
          propertyTitle: 'Casa Vitacura',
          address: 'Av. Vitacura 8900, Vitacura',
          clientName: 'Pedro Silva',
          clientPhone: '+56 9 2345 6789',
          clientEmail: 'pedro@ejemplo.com',
          scheduledDate: '2024-03-15',
          scheduledTime: '16:00',
          status: 'COMPLETED',
          priority: 'LOW',
          estimatedDuration: 60,
          actualDuration: 55,
          earnings: 25000,
          notes: 'Visita exitosa, cliente muy interesado',
          photosRequired: true,
          photosUploaded: 12,
          clientRating: 5,
          clientFeedback: 'Excelente servicio, muy profesional',
          createdAt: '2024-03-14 09:20',
          updatedAt: '2024-03-15 17:00',
        },
        {
          id: '4',
          propertyTitle: 'Departamento Providencia',
          address: 'Av. Providencia 2345, Providencia',
          clientName: 'Laura Fernández',
          clientPhone: '+56 9 3456 7890',
          clientEmail: 'laura@ejemplo.com',
          scheduledDate: '2024-03-14',
          scheduledTime: '11:00',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          estimatedDuration: 40,
          actualDuration: 42,
          earnings: 18000,
          photosRequired: true,
          photosUploaded: 8,
          clientRating: 4,
          clientFeedback: 'Buen servicio, puntual y amable',
          createdAt: '2024-03-13 14:15',
          updatedAt: '2024-03-14 11:45',
        },
        {
          id: '5',
          propertyTitle: 'Local Comercial Centro',
          address: 'Ahumada 456, Santiago',
          clientName: 'Roberto Gómez',
          clientPhone: '+56 9 4567 8901',
          clientEmail: 'roberto@ejemplo.com',
          scheduledDate: '2024-03-16',
          scheduledTime: '09:00',
          status: 'PENDING',
          priority: 'URGENT',
          estimatedDuration: 30,
          earnings: 22000,
          notes: 'Cliente necesita visita urgente antes de fin de mes',
          photosRequired: true,
          photosUploaded: 0,
          createdAt: '2024-03-15 18:20',
          updatedAt: '2024-03-15 18:20',
        },
      ];

      setVisits(mockVisits);
      
      // Calculate stats
      const totalVisits = mockVisits.length;
      const completedVisits = mockVisits.filter(v => v.status === 'COMPLETED').length;
      const pendingVisits = mockVisits.filter(v => v.status === 'PENDING').length;
      const inProgressVisits = mockVisits.filter(v => v.status === 'IN_PROGRESS').length;
      const cancelledVisits = mockVisits.filter(v => v.status === 'CANCELLED').length;
      const totalEarnings = mockVisits
        .filter(v => v.status === 'COMPLETED')
        .reduce((sum, v) => sum + v.earnings, 0);
      const averageRating = mockVisits
        .filter(v => v.clientRating)
        .reduce((sum, v) => sum + (v.clientRating || 0), 0) / 
        mockVisits.filter(v => v.clientRating).length;
      const completionRate = (completedVisits / totalVisits) * 100;
      const averageResponseTime = 15; // Mock value

      setStats({
        totalVisits,
        completedVisits,
        pendingVisits,
        inProgressVisits,
        cancelledVisits,
        totalEarnings,
        averageRating: Number(averageRating.toFixed(1)),
        completionRate: Number(completionRate.toFixed(1)),
        averageResponseTime,
      });

      setLoading(false);
    }, 1000);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      case 'NO_SHOW':
        return <Badge className="bg-purple-100 text-purple-800">No se presentó</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  const isOverdue = (visit: Visit) => {
    if (visit.status !== 'PENDING') {
return false;
}
    const now = new Date();
    const scheduledDateTime = new Date(`${visit.scheduledDate} ${visit.scheduledTime}`);
    return now > scheduledDateTime;
  };

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = visit.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || visit.priority === priorityFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      if (dateFilter === 'today') {
        matchesDate = isToday(visit.scheduledDate);
      } else if (dateFilter === 'overdue') {
        matchesDate = isOverdue(visit);
      } else if (dateFilter === 'pending') {
        matchesDate = visit.status === 'PENDING';
      }
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  const todayVisits = filteredVisits.filter(visit => isToday(visit.scheduledDate));
  const overdueVisits = filteredVisits.filter(visit => isOverdue(visit));

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando visitas...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader 
        user={user}
        title="Gestión de Visitas"
        subtitle="Administra tus visitas programadas y completadas"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visitas Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}</p>
                  <p className="text-xs text-gray-500">{stats.completedVisits} completadas</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingVisits}</p>
                  <p className="text-xs text-gray-500">{overdueVisits.length} atrasadas</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ganancias</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.totalEarnings)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Calificación</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Visits Summary */}
        {todayVisits.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Calendar className="w-5 h-5" />
                Visitas de Hoy
              </CardTitle>
              <CardDescription className="text-blue-700">
                {todayVisits.length} visita{todayVisits.length !== 1 ? 's' : ''} programada{todayVisits.length !== 1 ? 's' : ''} para hoy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {todayVisits.filter(v => v.status === 'PENDING').length}
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">En Progreso</p>
                  <p className="text-xl font-bold text-blue-600">
                    {todayVisits.filter(v => v.status === 'IN_PROGRESS').length}
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Completadas</p>
                  <p className="text-xl font-bold text-green-600">
                    {todayVisits.filter(v => v.status === 'COMPLETED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por propiedad, cliente o dirección..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="COMPLETED">Completadas</option>
                  <option value="CANCELLED">Canceladas</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">Todas las prioridades</option>
                  <option value="URGENT">Urgentes</option>
                  <option value="HIGH">Altas</option>
                  <option value="MEDIUM">Medias</option>
                  <option value="LOW">Bajas</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">Todas las fechas</option>
                  <option value="today">Hoy</option>
                  <option value="overdue">Atrasadas</option>
                  <option value="pending">Pendientes</option>
                </select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Visita
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visits List */}
        <div className="space-y-4">
          {filteredVisits.map((visit) => (
            <Card 
              key={visit.id} 
              className={`hover:shadow-lg transition-shadow ${
                isOverdue(visit) ? 'border-red-200 bg-red-50' : 
                isToday(visit.scheduledDate) ? 'border-blue-200 bg-blue-50' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {visit.propertyTitle}
                          </h3>
                          <div className="flex gap-2">
                            {getStatusBadge(visit.status)}
                            {getPriorityBadge(visit.priority)}
                            {isOverdue(visit) && (
                              <Badge className="bg-red-100 text-red-800">Atrasada</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 flex items-center gap-1 mb-3">
                          <MapPin className="w-4 h-4" />
                          {visit.address}
                        </p>
                      </div>
                      {visit.status === 'COMPLETED' && visit.clientRating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{visit.clientRating}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Cliente</p>
                        <p className="font-semibold text-gray-900">{visit.clientName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fecha y Hora</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(visit.scheduledDate)} - {formatTime(visit.scheduledTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Duración</p>
                        <p className="font-semibold text-gray-900">
                          {visit.actualDuration || visit.estimatedDuration} min
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ganancia</p>
                        <p className="font-semibold text-green-600">
                          {formatPrice(visit.earnings)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Contacto</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{visit.clientPhone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{visit.clientEmail}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Fotos requeridas</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Camera className="w-4 h-4" />
                            <span className="text-sm">
                              {visit.photosUploaded}/{visit.photosRequired ? '12' : '0'}
                            </span>
                          </div>
                          {visit.photosRequired && visit.photosUploaded === 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Pendientes
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {visit.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-sm text-gray-700">
                          <strong>Notas:</strong> {visit.notes}
                        </p>
                      </div>
                    )}

                    {visit.clientFeedback && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Feedback del cliente:</strong> {visit.clientFeedback}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                    {visit.status === 'PENDING' && (
                      <>
                        <Button size="sm" className="flex-1">
                          <Navigation className="w-4 h-4 mr-2" />
                          Iniciar Visita
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Phone className="w-4 h-4 mr-2" />
                          Llamar Cliente
                        </Button>
                      </>
                    )}
                    {visit.status === 'IN_PROGRESS' && (
                      <>
                        <Button size="sm" className="flex-1">
                          <Camera className="w-4 h-4 mr-2" />
                          Subir Fotos
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Finalizar
                        </Button>
                      </>
                    )}
                    {visit.status === 'COMPLETED' && (
                      <>
                        <Button size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contactar
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" className="flex-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVisits.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron visitas
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all'
                  ? 'Intenta ajustar tus filtros de búsqueda.'
                  : 'Aún no tienes visitas programadas.'
                }
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Programar Nueva Visita
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
