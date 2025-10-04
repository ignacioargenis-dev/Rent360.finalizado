'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
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
  Users,
  Search,
  Filter,
  Eye,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  MapPin,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Home,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import { User } from '@/types';

interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string;
  interestedIn: string[];
  budget: {
    min: number;
    max: number;
  };
  preferredLocation: string;
  status: 'active' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: 'website' | 'referral' | 'social' | 'advertising' | 'other';
  createdAt: string;
  lastContact: string;
  notes: string;
  // Property owner information
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  propertyId?: string;
}

interface ProspectStats {
  total: number;
  active: number;
  contacted: number;
  qualified: number;
  converted: number;
  conversionRate: number;
}

export default function BrokerProspectsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<ProspectStats>({
    total: 0,
    active: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

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

    const loadProspectsData = async () => {
      try {
        // Mock prospects data
        const mockProspects: Prospect[] = [
          {
            id: '1',
            name: 'María González',
            email: 'maria.gonzalez@email.com',
            phone: '+56912345678',
            interestedIn: ['apartment', 'house'],
            budget: { min: 300000, max: 600000 },
            preferredLocation: 'Las Condes',
            status: 'active',
            source: 'website',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            notes: 'Busca departamento de 2 dormitorios, buena ubicación',
          },
          {
            id: '2',
            name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@email.com',
            phone: '+56987654321',
            interestedIn: ['apartment'],
            budget: { min: 200000, max: 400000 },
            preferredLocation: 'Providencia',
            status: 'contacted',
            source: 'referral',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
            lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            notes: 'Interesado en inversiones, primera reunión programada',
          },
          {
            id: '3',
            name: 'Ana Silva',
            email: 'ana.silva@email.com',
            phone: '+56955556666',
            interestedIn: ['office'],
            budget: { min: 500000, max: 1000000 },
            preferredLocation: 'Centro',
            status: 'qualified',
            source: 'social',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
            lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            notes: 'Busca oficina para empresa tech, presupuesto flexible',
            ownerName: 'Carlos Mendoza',
            ownerEmail: 'carlos.mendoza@email.com',
            ownerPhone: '+56977774444',
            propertyId: 'prop-001',
          },
          {
            id: '4',
            name: 'Roberto Díaz',
            email: 'roberto.diaz@email.com',
            phone: '+56977778888',
            interestedIn: ['house', 'land'],
            budget: { min: 800000, max: 1500000 },
            preferredLocation: 'Colina',
            status: 'converted',
            source: 'advertising',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            notes: 'Compra completada - casa en Chicureo',
            ownerName: 'María Torres',
            ownerEmail: 'maria.torres@email.com',
            ownerPhone: '+56988885555',
            propertyId: 'prop-002',
          },
          {
            id: '5',
            name: 'Patricia Morales',
            email: 'patricia.morales@email.com',
            phone: '+56944443333',
            interestedIn: ['apartment'],
            budget: { min: 150000, max: 250000 },
            preferredLocation: 'Ñuñoa',
            status: 'lost',
            source: 'website',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
            lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
            notes: 'Perdió interés, encontró opción más económica',
          },
        ];

        setProspects(mockProspects);
        setFilteredProspects(mockProspects);

        // Calculate stats
        const total = mockProspects.length;
        const active = mockProspects.filter(p => p.status === 'active').length;
        const contacted = mockProspects.filter(p => p.status === 'contacted').length;
        const qualified = mockProspects.filter(p => p.status === 'qualified').length;
        const converted = mockProspects.filter(p => p.status === 'converted').length;
        const conversionRate = total > 0 ? (converted / total) * 100 : 0;

        setStats({
          total,
          active,
          contacted,
          qualified,
          converted,
          conversionRate,
        });

        setLoading(false);
      } catch (error) {
        logger.error('Error loading prospects data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadProspectsData();
  }, []);

  useEffect(() => {
    let filtered = prospects;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        prospect =>
          prospect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prospect.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prospect.preferredLocation.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(prospect => prospect.status === statusFilter);
    }

    // Filter by source
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(prospect => prospect.source === sourceFilter);
    }

    setFilteredProspects(filtered);
  }, [prospects, searchQuery, statusFilter, sourceFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Activo</Badge>;
      case 'contacted':
        return <Badge className="bg-yellow-100 text-yellow-800">Contactado</Badge>;
      case 'qualified':
        return <Badge className="bg-purple-100 text-purple-800">Calificado</Badge>;
      case 'converted':
        return <Badge className="bg-green-100 text-green-800">Convertido</Badge>;
      case 'lost':
        return <Badge className="bg-red-100 text-red-800">Perdido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    const colors: { [key: string]: string } = {
      website: 'bg-blue-100 text-blue-800',
      referral: 'bg-green-100 text-green-800',
      social: 'bg-purple-100 text-purple-800',
      advertising: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };

    return <Badge className={colors[source] || colors.other}>{source}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewProspect = (prospectId: string) => {
    // Navigate to prospect detail
    alert(`Abriendo detalles del prospecto ${prospectId}`);
    // TODO: Implement navigation to prospect detail page
    // router.push(`/broker/prospects/${prospectId}`);
  };

  const handleContactProspect = (prospect: Prospect) => {
    // Open email client
    const subject = encodeURIComponent(
      `Información sobre propiedades en ${prospect.preferredLocation}`
    );
    const body = encodeURIComponent(
      `Hola ${prospect.name},\n\nMe comunico respecto a su interés en propiedades en ${prospect.preferredLocation}.\n\nAtentamente,\n${user?.name || 'Equipo Rent360'}`
    );
    window.open(`mailto:${prospect.email}?subject=${subject}&body=${body}`);
  };

  const handleContactOwner = (prospect: Prospect) => {
    if (!prospect.ownerEmail) {
      alert('No hay información de contacto del propietario disponible');
      return;
    }

    // Open email client to contact property owner
    const subject = encodeURIComponent(`Consulta sobre propiedad en ${prospect.preferredLocation}`);
    const body = encodeURIComponent(
      `Hola ${prospect.ownerName},\n\nMe comunico respecto a su propiedad en ${prospect.preferredLocation}.\n\nAtentamente,\n${user?.name || 'Equipo Rent360'}`
    );
    window.open(`mailto:${prospect.ownerEmail}?subject=${subject}&body=${body}`);
  };

  const handleCallOwner = (prospect: Prospect) => {
    if (!prospect.ownerPhone) {
      alert('No hay número de teléfono del propietario disponible');
      return;
    }

    window.open(`tel:${prospect.ownerPhone}`);
  };

  const handleViewProperty = (prospect: Prospect) => {
    if (!prospect.propertyId) {
      alert('No hay información de propiedad disponible');
      return;
    }

    // Navigate to property detail page
    alert(`Redirigiendo a la propiedad ${prospect.propertyId}`);
    // In a real app: router.push(`/properties/${prospect.propertyId}`);
  };

  const handleConvertProspect = (prospectId: string) => {
    if (confirm('¿Está seguro de que desea convertir este prospecto en cliente?')) {
      // Update prospect status in the list
      setProspects(prevProspects =>
        prevProspects.map(prospect =>
          prospect.id === prospectId
            ? { ...prospect, status: 'converted' as const, lastContact: new Date().toISOString() }
            : prospect
        )
      );
      alert(`Prospecto ${prospectId} convertido exitosamente a cliente`);

      // Recalculate stats
      const updatedProspects = prospects.map(prospect =>
        prospect.id === prospectId
          ? { ...prospect, status: 'converted' as const, lastContact: new Date().toISOString() }
          : prospect
      );
      const converted = updatedProspects.filter(p => p.status === 'converted').length;
      const conversionRate =
        updatedProspects.length > 0 ? (converted / updatedProspects.length) * 100 : 0;

      setStats(prev => ({
        ...prev,
        converted,
        conversionRate,
      }));
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Prospectos" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando prospectos...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Prospectos de Clientes"
      subtitle="Gestiona tus leads y prospectos potenciales"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prospectos</h1>
            <p className="text-gray-600">Gestiona tus leads y prospectos potenciales</p>
          </div>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar Prospecto
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contactados</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.contacted}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Calificados</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.qualified}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Convertidos</p>
                  <p className="text-2xl font-bold text-green-900">{stats.converted}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversión</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {stats.conversionRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar por nombre, email o ubicación..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="contacted">Contactados</SelectItem>
                  <SelectItem value="qualified">Calificados</SelectItem>
                  <SelectItem value="converted">Convertidos</SelectItem>
                  <SelectItem value="lost">Perdidos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fuentes</SelectItem>
                  <SelectItem value="website">Sitio web</SelectItem>
                  <SelectItem value="referral">Referencia</SelectItem>
                  <SelectItem value="social">Redes sociales</SelectItem>
                  <SelectItem value="advertising">Publicidad</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Prospects List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Prospectos ({filteredProspects.length})</CardTitle>
            <CardDescription>Prospectos filtrados según tus criterios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProspects.map(prospect => (
                <Card key={prospect.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{prospect.name}</h3>
                          {getStatusBadge(prospect.status)}
                          {getSourceBadge(prospect.source)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{prospect.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{prospect.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{prospect.preferredLocation}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Último contacto: {formatDate(prospect.lastContact)}</span>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Presupuesto:</strong> {formatCurrency(prospect.budget.min)} -{' '}
                          {formatCurrency(prospect.budget.max)}
                        </div>

                        <div className="text-sm text-gray-600">
                          <strong>Interesado en:</strong> {prospect.interestedIn.join(', ')}
                        </div>

                        {/* Property Owner Information */}
                        {prospect.ownerName && (
                          <div className="text-sm text-gray-600 mt-2 p-2 bg-blue-50 rounded">
                            <strong>Propietario:</strong> {prospect.ownerName}
                            {prospect.ownerEmail && (
                              <span className="ml-2">
                                <Mail className="w-3 h-3 inline mr-1" />
                                {prospect.ownerEmail}
                              </span>
                            )}
                            {prospect.ownerPhone && (
                              <span className="ml-2">
                                <Phone className="w-3 h-3 inline mr-1" />
                                {prospect.ownerPhone}
                              </span>
                            )}
                          </div>
                        )}

                        {prospect.notes && (
                          <div className="text-sm text-gray-600 mt-2">
                            <strong>Notas:</strong> {prospect.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewProspect(prospect.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContactProspect(prospect)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        {prospect.status !== 'converted' && prospect.status !== 'lost' && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertProspect(prospect.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Convertir
                          </Button>
                        )}

                        {/* Property Owner Contact Buttons */}
                        {prospect.ownerName && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContactOwner(prospect)}
                              title={`Contactar propietario: ${prospect.ownerName}`}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                            {prospect.ownerPhone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCallOwner(prospect)}
                                title={`Llamar propietario: ${prospect.ownerPhone}`}
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}

                        {/* Property View Button */}
                        {prospect.propertyId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProperty(prospect)}
                            title="Ver propiedad"
                          >
                            <Home className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Message Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const message = prompt('Escribe un mensaje para el prospecto:');
                            if (message) {
                              alert(`Mensaje enviado: "${message}"`);
                            }
                          }}
                          title="Enviar mensaje"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredProspects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron prospectos que coincidan con los filtros</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
