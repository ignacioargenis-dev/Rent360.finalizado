'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  MapPin,
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
  Eye,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Home,
  Award,
  Navigation,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useAuth();

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

  // Inicializar filtro de estado desde query params si existe
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams?.get('status') || 'all'
  );

  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchVisits = async () => {
    try {
      setLoading(true);
      // ✅ CORREGIDO: Obtener datos reales desde la API
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter);
      
      const response = await fetch(`/api/runner/visits?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al cargar visitas: ${response.status}`);
      }

      const result = await response.json();
      const visitsData = result.visits || [];
      const statsData = result.stats || {};

      // Transformar datos al formato esperado
      const transformedVisits: Visit[] = visitsData.map((visit: any) => ({
        id: visit.id,
        propertyTitle: visit.propertyTitle || 'Sin título',
        address: visit.address || '',
        clientName: visit.clientName || 'Sin cliente',
        clientPhone: visit.clientPhone || 'No disponible',
        clientEmail: visit.clientEmail || 'No disponible',
        scheduledDate: visit.scheduledDate || '',
        scheduledTime: visit.scheduledTime || '',
        status: visit.status || 'PENDING',
        priority: visit.priority || 'MEDIUM',
        estimatedDuration: visit.estimatedDuration || 30,
        actualDuration: visit.actualDuration,
        earnings: visit.earnings || 0,
        notes: visit.notes || '',
        photosRequired: visit.photosRequired !== undefined ? visit.photosRequired : true,
        photosUploaded: visit.photosUploaded || 0,
        clientRating: visit.clientRating,
        clientFeedback: visit.clientFeedback,
        createdAt: visit.createdAt || new Date().toISOString(),
        updatedAt: visit.updatedAt || new Date().toISOString(),
      }));

      setVisits(transformedVisits);
      setStats({
        totalVisits: statsData.totalVisits || 0,
        completedVisits: statsData.completedVisits || 0,
        pendingVisits: statsData.pendingVisits || 0,
        inProgressVisits: statsData.inProgressVisits || 0,
        cancelledVisits: statsData.cancelledVisits || 0,
        totalEarnings: statsData.totalEarnings || 0,
        averageRating: statsData.averageRating || 0,
        completionRate: statsData.completionRate || 0,
        averageResponseTime: statsData.averageResponseTime || 0,
      });
      setError(null);
    } catch (error) {
      setError('Error al cargar las visitas');
      logger.error('Error fetching visits:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Efecto para inicializar el filtro desde query params
  useEffect(() => {
    const statusParam = searchParams?.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // ✅ CORREGIDO: Cargar datos reales
    fetchVisits();
  }, [statusFilter, priorityFilter, dateFilter]);

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
    const matchesSearch =
      visit.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const handleNewVisit = () => {
    router.push('/runner/visits/new');
  };

  const handleStartVisit = (visitId: string) => {
    setVisits(prev =>
      prev.map(visit =>
        visit.id === visitId
          ? { ...visit, status: 'IN_PROGRESS' as const, actualDuration: 0 }
          : visit
      )
    );
    alert('Visita iniciada exitosamente');
  };

  const handleCallClient = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleUploadPhotos = (visitId: string) => {
    router.push(`/runner/photos?visitId=${visitId}`);
  };

  const handleCompleteVisit = (visitId: string) => {
    setVisits(prev =>
      prev.map(visit =>
        visit.id === visitId
          ? { ...visit, status: 'COMPLETED' as const, actualDuration: visit.estimatedDuration }
          : visit
      )
    );
    alert('Visita completada exitosamente');
  };

  const handleViewDetails = (visitId: string) => {
    router.push(`/runner/visits/${visitId}`);
  };

  const handleContactClient = (visitId: string) => {
    const visit = visits.find(v => v.id === visitId);
    if (visit) {
      // Guardar datos del cliente para iniciar conversación
      const recipientData = {
        id: `client_${visit.id}`,
        name: visit.clientName,
        email: visit.clientEmail,
        phone: visit.clientPhone,
        type: 'client' as const,
        propertyTitle: visit.propertyTitle,
      };
      sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
      router.push('/runner/messages?new=true');
    }
  };

  const handleFilterToggle = () => {
    setSuccessMessage('Filtros avanzados aplicados correctamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

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
    <UnifiedDashboardLayout>
      <DashboardHeader
        user={user}
        title="Gestión de Visitas"
        subtitle="Administra tus visitas programadas y completadas"
      />

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

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
                {todayVisits.length} visita{todayVisits.length !== 1 ? 's' : ''} programada
                {todayVisits.length !== 1 ? 's' : ''} para hoy
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
                  <Input
                    type="text"
                    placeholder="Buscar por propiedad, cliente o dirección..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="PENDING">Pendientes</SelectItem>
                    <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                    <SelectItem value="COMPLETED">Completadas</SelectItem>
                    <SelectItem value="CANCELLED">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="URGENT">Urgentes</SelectItem>
                    <SelectItem value="HIGH">Altas</SelectItem>
                    <SelectItem value="MEDIUM">Medias</SelectItem>
                    <SelectItem value="LOW">Bajas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las fechas</SelectItem>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="overdue">Atrasadas</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleFilterToggle}>
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button onClick={handleNewVisit}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Visita
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visits List */}
        <div className="space-y-4">
          {filteredVisits.map(visit => (
            <Card
              key={visit.id}
              className={`hover:shadow-lg transition-shadow ${
                isOverdue(visit)
                  ? 'border-red-200 bg-red-50'
                  : isToday(visit.scheduledDate)
                    ? 'border-blue-200 bg-blue-50'
                    : ''
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
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleStartVisit(visit.id)}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Iniciar Visita
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleCallClient(visit.clientPhone)}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Llamar Cliente
                        </Button>
                      </>
                    )}
                    {visit.status === 'IN_PROGRESS' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUploadPhotos(visit.id)}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Subir Fotos
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleCompleteVisit(visit.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Finalizar
                        </Button>
                      </>
                    )}
                    {visit.status === 'COMPLETED' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewDetails(visit.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleContactClient(visit.id)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contactar
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => alert('Más opciones próximamente')}
                    >
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
                {searchTerm ||
                statusFilter !== 'all' ||
                priorityFilter !== 'all' ||
                dateFilter !== 'all'
                  ? 'Intenta ajustar tus filtros de búsqueda.'
                  : 'Aún no tienes visitas programadas.'}
              </p>
              <Button onClick={handleNewVisit}>
                <Plus className="w-4 h-4 mr-2" />
                Programar Nueva Visita
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
