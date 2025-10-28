'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Users,
  UserPlus,
  Eye,
  Mail,
  Target,
  TrendingUp,
  Filter,
  Search,
  MessageSquare,
  Calendar,
  Home,
  Phone,
  UserCheck,
  Settings,
  Building,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { User } from '@/types';

// Tipos del nuevo sistema
interface BrokerProspect {
  id: string;
  name: string;
  email: string;
  phone: string;
  rut?: string;
  prospectType: 'OWNER_LEAD' | 'TENANT_LEAD';
  status:
    | 'NEW'
    | 'CONTACTED'
    | 'QUALIFIED'
    | 'MEETING_SCHEDULED'
    | 'PROPOSAL_SENT'
    | 'NEGOTIATING'
    | 'CONVERTED'
    | 'LOST';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  leadScore: number;
  conversionProbability: number;
  source: string;
  sourceDetails?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  contactCount: number;
  emailsSent: number;
  propertiesShared: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  activities?: Array<{
    id: string;
    activityType: string;
    title: string;
    createdAt: string;
  }>;
  sharedProperties?: Array<{
    id: string;
    propertyId: string;
    sharedAt: string;
    viewCount: number;
  }>;
}

interface ProspectMetrics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  avgLeadScore: number;
  highPriority: number;
  needFollowUp: number;
}

export default function BrokerProspectsNewPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [prospects, setProspects] = useState<BrokerProspect[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<BrokerProspect[]>([]);
  const [metrics, setMetrics] = useState<ProspectMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showAddProspectModal, setShowAddProspectModal] = useState(false);
  const [submittingProspect, setSubmittingProspect] = useState(false);
  const [newProspectForm, setNewProspectForm] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    prospectType: 'OWNER_LEAD' as 'OWNER_LEAD' | 'TENANT_LEAD',
    source: 'platform',
    sourceDetails: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    notes: '',
    interestedIn: [] as string[],
    budget: { min: 0, max: 0 },
    preferredLocations: [] as string[],
  });

  useEffect(() => {
    loadUserData();
    loadProspectsData();
  }, []);

  useEffect(() => {
    filterProspects();
  }, [prospects, searchQuery, statusFilter, typeFilter, priorityFilter]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadProspectsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/broker/prospects', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProspects(data.data || []);
        setMetrics(data.metrics || null);
        logger.info('Prospects cargados', { count: data.data?.length || 0 });
      } else {
        logger.error('Error al cargar prospects', { status: response.status });
      }
    } catch (error) {
      logger.error('Error al cargar prospects', { error });
    } finally {
      setLoading(false);
    }
  };

  const filterProspects = () => {
    let filtered = [...prospects];

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.phone.includes(query)
      );
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter.toUpperCase());
    }

    // Filtro de tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.prospectType === typeFilter.toUpperCase());
    }

    // Filtro de prioridad
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(p => p.priority === priorityFilter);
    }

    setFilteredProspects(filtered);
  };

  const handleSubmitNewProspect = async () => {
    if (!newProspectForm.name || !newProspectForm.email || !newProspectForm.phone) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }

    setSubmittingProspect(true);

    try {
      const response = await fetch('/api/broker/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newProspectForm),
      });

      if (response.ok) {
        alert(`✅ Prospecto "${newProspectForm.name}" agregado exitosamente!`);
        setShowAddProspectModal(false);

        // Resetear formulario
        setNewProspectForm({
          name: '',
          email: '',
          phone: '',
          rut: '',
          prospectType: 'OWNER_LEAD',
          source: 'platform',
          sourceDetails: '',
          priority: 'medium',
          notes: '',
          interestedIn: [],
          budget: { min: 0, max: 0 },
          preferredLocations: [],
        });

        // Recargar prospects
        await loadProspectsData();
      } else {
        const error = await response.json();
        alert(`❌ Error al agregar prospecto: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      logger.error('Error al agregar prospecto', { error });
      alert('❌ Error al agregar prospecto');
    } finally {
      setSubmittingProspect(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      NEW: 'default',
      CONTACTED: 'secondary',
      QUALIFIED: 'default',
      MEETING_SCHEDULED: 'secondary',
      PROPOSAL_SENT: 'default',
      NEGOTIATING: 'default',
      CONVERTED: 'default',
      LOST: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      NEW: <AlertCircle className="h-4 w-4" />,
      CONTACTED: <Phone className="h-4 w-4" />,
      QUALIFIED: <CheckCircle2 className="h-4 w-4" />,
      MEETING_SCHEDULED: <Calendar className="h-4 w-4" />,
      PROPOSAL_SENT: <Mail className="h-4 w-4" />,
      NEGOTIATING: <MessageSquare className="h-4 w-4" />,
      CONVERTED: <UserCheck className="h-4 w-4" />,
      LOST: <XCircle className="h-4 w-4" />,
    };
    return icons[status] || <AlertCircle className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500',
    };
    return colors[priority] || 'text-gray-500';
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout user={user}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando prospects...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout user={user}>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Potenciales Clientes</h1>
              <p className="text-gray-600 mt-1">
                Gestiona tu pipeline de ventas y convierte prospects en clientes
              </p>
            </div>
            <Button
              onClick={() => setShowAddProspectModal(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Agregar Prospect
            </Button>
          </div>
        </div>

        {/* Métricas */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total}</div>
                <p className="text-xs text-muted-foreground">En pipeline</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Promedio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(metrics.avgLeadScore)}</div>
                <p className="text-xs text-muted-foreground">De 100 puntos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alta Prioridad</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.highPriority}</div>
                <p className="text-xs text-muted-foreground">Requieren atención</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Follow-ups Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.needFollowUp}</div>
                <p className="text-xs text-muted-foreground">Requieren contacto</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nombre, email o teléfono..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="new">Nuevo</SelectItem>
                    <SelectItem value="contacted">Contactado</SelectItem>
                    <SelectItem value="qualified">Calificado</SelectItem>
                    <SelectItem value="meeting_scheduled">Reunión Agendada</SelectItem>
                    <SelectItem value="proposal_sent">Propuesta Enviada</SelectItem>
                    <SelectItem value="negotiating">Negociando</SelectItem>
                    <SelectItem value="converted">Convertido</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="owner_lead">Propietario</SelectItem>
                    <SelectItem value="tenant_lead">Inquilino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Prospects */}
        <Card>
          <CardHeader>
            <CardTitle>Prospects ({filteredProspects.length})</CardTitle>
            <CardDescription>
              Haz clic en un prospect para ver más detalles y gestionar actividades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProspects.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {prospects.length === 0
                    ? 'No tienes prospects aún'
                    : 'No se encontraron prospects con los filtros aplicados'}
                </p>
                {prospects.length === 0 && (
                  <Button onClick={() => setShowAddProspectModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar Primer Prospect
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProspects.map(prospect => (
                  <div
                    key={prospect.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/broker/prospects/${prospect.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {prospect.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{prospect.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {prospect.email}
                              <Phone className="h-3 w-3 ml-2" />
                              {prospect.phone}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge
                            variant={getStatusBadgeVariant(prospect.status)}
                            className="flex items-center gap-1"
                          >
                            {getStatusIcon(prospect.status)}
                            {prospect.status}
                          </Badge>

                          <Badge variant="outline">
                            {prospect.prospectType === 'OWNER_LEAD' ? (
                              <Building className="h-3 w-3 mr-1" />
                            ) : (
                              <Home className="h-3 w-3 mr-1" />
                            )}
                            {prospect.prospectType === 'OWNER_LEAD' ? 'Propietario' : 'Inquilino'}
                          </Badge>

                          <Badge variant="outline" className={getPriorityColor(prospect.priority)}>
                            {prospect.priority.charAt(0).toUpperCase() + prospect.priority.slice(1)}
                          </Badge>

                          <Badge variant="outline">
                            <Target className="h-3 w-3 mr-1" />
                            Score: {prospect.leadScore}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-semibold">{prospect.contactCount}</span> contactos
                          </div>
                          <div>
                            <span className="font-semibold">{prospect.propertiesShared}</span>{' '}
                            propiedades compartidas
                          </div>
                          <div>
                            <span className="font-semibold">{prospect.emailsSent}</span> emails
                            enviados
                          </div>
                          <div>
                            {prospect.nextFollowUpDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Follow-up:{' '}
                                {new Date(prospect.nextFollowUpDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {prospect.notes && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {prospect.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            router.push(`/broker/prospects/${prospect.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal para agregar prospect */}
        <Dialog open={showAddProspectModal} onOpenChange={setShowAddProspectModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Prospect</DialogTitle>
              <DialogDescription>
                Completa la información del potencial cliente para agregarlo a tu pipeline
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={newProspectForm.name}
                    onChange={e => setNewProspectForm({ ...newProspectForm, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newProspectForm.email}
                    onChange={e =>
                      setNewProspectForm({ ...newProspectForm, email: e.target.value })
                    }
                    placeholder="juan@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={newProspectForm.phone}
                    onChange={e =>
                      setNewProspectForm({ ...newProspectForm, phone: e.target.value })
                    }
                    placeholder="+56912345678"
                  />
                </div>
                <div>
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    value={newProspectForm.rut}
                    onChange={e => setNewProspectForm({ ...newProspectForm, rut: e.target.value })}
                    placeholder="12345678-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prospectType">Tipo de Prospect *</Label>
                  <Select
                    value={newProspectForm.prospectType}
                    onValueChange={(value: 'OWNER_LEAD' | 'TENANT_LEAD') =>
                      setNewProspectForm({ ...newProspectForm, prospectType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER_LEAD">Propietario</SelectItem>
                      <SelectItem value="TENANT_LEAD">Inquilino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={newProspectForm.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                      setNewProspectForm({ ...newProspectForm, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Fuente</Label>
                  <Select
                    value={newProspectForm.source}
                    onValueChange={value =>
                      setNewProspectForm({ ...newProspectForm, source: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">Plataforma</SelectItem>
                      <SelectItem value="referral">Referido</SelectItem>
                      <SelectItem value="advertising">Publicidad</SelectItem>
                      <SelectItem value="website">Sitio Web</SelectItem>
                      <SelectItem value="social">Redes Sociales</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sourceDetails">Detalles de la Fuente</Label>
                  <Input
                    id="sourceDetails"
                    value={newProspectForm.sourceDetails}
                    onChange={e =>
                      setNewProspectForm({ ...newProspectForm, sourceDetails: e.target.value })
                    }
                    placeholder="Ej: Facebook Ads, Referido por Juan"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={newProspectForm.notes}
                  onChange={e => setNewProspectForm({ ...newProspectForm, notes: e.target.value })}
                  placeholder="Información adicional sobre el prospect..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddProspectModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitNewProspect} disabled={submittingProspect}>
                {submittingProspect ? 'Agregando...' : 'Agregar Prospect'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
