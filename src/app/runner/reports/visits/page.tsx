'use client';

import { logger } from '@/lib/logger-minimal';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  CheckCircle,
  XCircle,
  Clock3,
  Search,
  Filter,
  Download } from 'lucide-react';
import { User } from '@/types';

interface Visit {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  duration: number;
  clientName?: string;
  clientPhone?: string;
  earnings?: number;
  notes?: string;
  completedAt?: string;
  rating?: number;
}

export default function RunnerVisitsReport() {

  const [user, setUser] = useState<User | null>(null);

  const [visits, setVisits] = useState<Visit[]>([]);

  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [monthFilter, setMonthFilter] = useState<string>('all');

  useEffect(() => {
    // Load user data
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

    // Load visits data
    const loadVisitsData = async () => {
      try {
        // Mock data for demonstration
        const mockVisits: Visit[] = [
          {
            id: '1',
            propertyTitle: 'Departamento Moderno Providencia',
            propertyAddress: 'Av. Providencia 1234, Providencia',
            scheduledAt: '2024-01-15T10:00:00',
            status: 'completed',
            duration: 45,
            clientName: 'María González',
            clientPhone: '+56 9 1234 5678',
            earnings: 15000,
            notes: 'Cliente muy interesado, buena conversación',
            completedAt: '2024-01-15T10:45:00',
            rating: 5,
          },
          {
            id: '2',
            propertyTitle: 'Casa Familiar Las Condes',
            propertyAddress: 'El Alba 456, Las Condes',
            scheduledAt: '2024-01-14T15:30:00',
            status: 'completed',
            duration: 60,
            clientName: 'Juan Pérez',
            clientPhone: '+56 9 2345 6789',
            earnings: 20000,
            notes: 'Visita exitosa, cliente decidido',
            completedAt: '2024-01-14T16:30:00',
            rating: 4,
          },
          {
            id: '3',
            propertyTitle: 'Studio Amoblado Ñuñoa',
            propertyAddress: 'Irarrázaval 789, Ñuñoa',
            scheduledAt: '2024-01-16T11:00:00',
            status: 'scheduled',
            duration: 30,
            clientName: 'Ana Martínez',
            clientPhone: '+56 9 3456 7890',
          },
          {
            id: '4',
            propertyTitle: 'Departamento Céntrico Santiago',
            propertyAddress: 'Ahumada 234, Santiago',
            scheduledAt: '2024-01-13T14:00:00',
            status: 'cancelled',
            duration: 45,
            clientName: 'Carlos López',
            clientPhone: '+56 9 4567 8901',
            notes: 'Cliente canceló última hora',
          },
          {
            id: '5',
            propertyTitle: 'Casa en La Reina',
            propertyAddress: 'Echeverría 567, La Reina',
            scheduledAt: '2024-01-12T16:00:00',
            status: 'no_show',
            duration: 40,
            clientName: 'Laura Silva',
            clientPhone: '+56 9 5678 9012',
            notes: 'Cliente no se presentó',
          },
        ];

        setVisits(mockVisits);
        setFilteredVisits(mockVisits);
      } catch (error) {
        logger.error('Error loading visits data:', { error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    loadVisitsData();
  }, []);

  useEffect(() => {
    // Filter visits based on search and filters
    let filtered = visits;

    if (searchTerm) {
      filtered = filtered.filter(visit =>
        visit.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.clientName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(visit => visit.status === statusFilter);
    }

    if (monthFilter !== 'all') {
      filtered = filtered.filter(visit => {
        const visitDate = new Date(visit.scheduledAt);
        const visitMonth = visitDate.toLocaleString('es-CL', { month: 'long' });
        return visitMonth.toLowerCase() === monthFilter.toLowerCase();
      });
    }

    setFilteredVisits(filtered);
  }, [visits, searchTerm, statusFilter, monthFilter]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Programada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case 'no_show':
        return <Badge className="bg-yellow-100 text-yellow-800">No asistió</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'no_show':
        return <Clock3 className="w-4 h-4 text-yellow-600" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getTotalEarnings = () => {
    return filteredVisits
      .filter(visit => visit.status === 'completed' && visit.earnings)
      .reduce((sum, visit) => sum + (visit.earnings || 0), 0);
  };

  const getCompletedVisits = () => {
    return filteredVisits.filter(visit => visit.status === 'completed').length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reporte de visitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reporte de Visitas</h1>
        <p className="text-gray-600">Análisis detallado de todas tus visitas realizadas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{filteredVisits.length}</div>
              <div className="text-sm text-gray-600">Total Visitas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{getCompletedVisits()}</div>
              <div className="text-sm text-gray-600">Visitas Completadas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{formatPrice(getTotalEarnings())}</div>
              <div className="text-sm text-gray-600">Ganancias Totales</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {filteredVisits.length > 0 ? Math.round((getCompletedVisits() / filteredVisits.length) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Tasa de Completitud</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por propiedad, dirección o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="scheduled">Programadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="no_show">No asistió</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                <SelectItem value="enero">Enero</SelectItem>
                <SelectItem value="febrero">Febrero</SelectItem>
                <SelectItem value="marzo">Marzo</SelectItem>
                <SelectItem value="abril">Abril</SelectItem>
                <SelectItem value="mayo">Mayo</SelectItem>
                <SelectItem value="junio">Junio</SelectItem>
                <SelectItem value="julio">Julio</SelectItem>
                <SelectItem value="agosto">Agosto</SelectItem>
                <SelectItem value="septiembre">Septiembre</SelectItem>
                <SelectItem value="octubre">Octubre</SelectItem>
                <SelectItem value="noviembre">Noviembre</SelectItem>
                <SelectItem value="diciembre">Diciembre</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visits List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Visitas</CardTitle>
          <CardDescription>
            Mostrando {filteredVisits.length} de {visits.length} visitas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVisits.map((visit) => (
              <div key={visit.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(visit.status)}
                      <h3 className="font-semibold text-lg">{visit.propertyTitle}</h3>
                      {getStatusBadge(visit.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{visit.propertyAddress}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateTime(visit.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{visit.duration} min</span>
                      </div>
                    </div>

                    {visit.clientName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{visit.clientName}</span>
                        {visit.clientPhone && (
                          <span className="text-gray-600">• {visit.clientPhone}</span>
                        )}
                      </div>
                    )}

                    {visit.notes && (
                      <p className="text-sm text-gray-600 mt-2">{visit.notes}</p>
                    )}

                    {visit.completedAt && visit.status === 'completed' && (
                      <div className="text-sm text-green-600 mt-1">
                        Completada: {formatDateTime(visit.completedAt)}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    {visit.earnings && visit.status === 'completed' && (
                      <div className="text-lg font-bold text-green-600 mb-2">
                        {formatPrice(visit.earnings)}
                      </div>
                    )}
                    {visit.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-yellow-500">★</span>
                        <span>{visit.rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredVisits.length === 0 && (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron visitas con los filtros seleccionados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
