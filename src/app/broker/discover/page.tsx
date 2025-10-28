'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Search,
  Users,
  Mail,
  Phone,
  MapPin,
  Building,
  TrendingUp,
  Star,
  Send,
  Sparkles,
  Store,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';

export default function DiscoverClientsPage() {
  const [activeTab, setActiveTab] = useState('search');
  const [loading, setLoading] = useState(false);

  // Estado para búsqueda
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    userType: 'BOTH',
    city: '',
    commune: '',
    noBroker: true,
    hasProperties: false,
    search: '',
  });

  // Estado para recomendaciones
  const [recommendations, setRecommendations] = useState([]);
  const [generatingRecs, setGeneratingRecs] = useState(false);

  // Estado para marketplace
  const [marketplaceRequests, setMarketplaceRequests] = useState([]);
  const [marketplaceFilters, setMarketplaceFilters] = useState({
    userType: '',
    requestType: '',
    urgency: '',
  });

  // Estado para invitaciones
  const [invitations, setInvitations] = useState([]);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [invitationData, setInvitationData] = useState({
    invitationType: 'SERVICE_OFFER',
    subject: '',
    message: '',
    proposedRate: 5,
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (activeTab === 'recommendations') {
      loadRecommendations();
    } else if (activeTab === 'marketplace') {
      loadMarketplace();
    } else if (activeTab === 'invitations') {
      loadInvitations();
    }
  }, [activeTab]);

  // 🔍 BÚSQUEDA INTELIGENTE
  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchFilters as any);
      const res = await fetch(`/api/broker/discover/users?${params}`);
      const data = await res.json();

      if (data.success) {
        setSearchResults(data.data);
        toast.success(`Se encontraron ${data.data.length} usuarios`);
      } else {
        toast.error(data.error || 'Error al buscar');
      }
    } catch (error) {
      toast.error('Error al buscar usuarios');
    } finally {
      setLoading(false);
    }
  };

  // 🤖 RECOMENDACIONES
  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/broker/discover/recommendations');
      const data = await res.json();

      if (data.success) {
        setRecommendations(data.data);
      }
    } catch (error) {
      toast.error('Error al cargar recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setGeneratingRecs(true);
    try {
      const res = await fetch('/api/broker/discover/recommendations', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        loadRecommendations();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al generar recomendaciones');
    } finally {
      setGeneratingRecs(false);
    }
  };

  const updateRecommendation = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/broker/discover/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        loadRecommendations();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al actualizar recomendación');
    }
  };

  // 🏪 MARKETPLACE
  const loadMarketplace = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(marketplaceFilters as any);
      const res = await fetch(`/api/broker/discover/marketplace?${params}`);
      const data = await res.json();

      if (data.success) {
        setMarketplaceRequests(data.data);
      }
    } catch (error) {
      toast.error('Error al cargar marketplace');
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, message: string) => {
    try {
      const res = await fetch(`/api/broker/discover/marketplace/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          proposedRate: 5,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        loadMarketplace();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al responder solicitud');
    }
  };

  // 📨 INVITACIONES
  const loadInvitations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/broker/discover/invitations');
      const data = await res.json();

      if (data.success) {
        setInvitations(data.data);
      }
    } catch (error) {
      toast.error('Error al cargar invitaciones');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      const res = await fetch('/api/broker/discover/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...invitationData,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowInvitationDialog(false);
        loadInvitations();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al enviar invitación');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔍 Descubrir Clientes</h1>
        <p className="text-gray-600">
          Encuentra propietarios e inquilinos potenciales usando herramientas inteligentes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Búsqueda
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Recomendaciones
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Invitaciones
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: BÚSQUEDA INTELIGENTE */}
        <TabsContent value="search" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Filtros de Búsqueda</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Usuario</label>
                <Select
                  value={searchFilters.userType}
                  onValueChange={value => setSearchFilters({ ...searchFilters, userType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOTH">Ambos</SelectItem>
                    <SelectItem value="OWNER">Propietarios</SelectItem>
                    <SelectItem value="TENANT">Inquilinos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ciudad</label>
                <Input
                  placeholder="Ej: Santiago"
                  value={searchFilters.city}
                  onChange={e => setSearchFilters({ ...searchFilters, city: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Comuna</label>
                <Input
                  placeholder="Ej: Las Condes"
                  value={searchFilters.commune}
                  onChange={e => setSearchFilters({ ...searchFilters, commune: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchFilters.noBroker}
                  onChange={e => setSearchFilters({ ...searchFilters, noBroker: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Solo sin corredor</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchFilters.hasProperties}
                  onChange={e =>
                    setSearchFilters({ ...searchFilters, hasProperties: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Con propiedades</span>
              </label>
            </div>

            <Button onClick={handleSearch} disabled={loading} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </Card>

          {/* Resultados de búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((user: any) => (
              <Card key={user.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{user.name}</h4>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </div>
                  <Badge className="bg-blue-600">
                    <Star className="h-3 w-3 mr-1" />
                    {user.matchScore}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {user.phone}
                    </div>
                  )}
                  {user.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {user.city}, {user.commune}
                    </div>
                  )}
                  {user.stats && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {user.stats.properties} propiedades
                    </div>
                  )}
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowInvitationDialog(true);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Invitación
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: RECOMENDACIONES */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Recomendaciones Inteligentes</h3>
                <p className="text-sm text-gray-600">
                  Basadas en matching automático con tus preferencias
                </p>
              </div>
              <Button onClick={generateRecommendations} disabled={generatingRecs}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generatingRecs ? 'Generando...' : 'Generar Nuevas'}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec: any) => (
              <Card key={rec.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{rec.recommendedUser.name}</h4>
                      <Badge variant="outline">{rec.leadType}</Badge>
                    </div>
                  </div>
                  <Badge className="bg-purple-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {rec.matchScore}%
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium">Razones del match:</p>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(rec.reasons).map((reason: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateRecommendation(rec.id, 'view')}
                  >
                    Vista
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedUser(rec.recommendedUser);
                      setShowInvitationDialog(true);
                    }}
                  >
                    Contactar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateRecommendation(rec.id, 'dismiss')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: MARKETPLACE */}
        <TabsContent value="marketplace" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Solicitudes Abiertas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Select
                value={marketplaceFilters.requestType}
                onValueChange={value =>
                  setMarketplaceFilters({ ...marketplaceFilters, requestType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de solicitud" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="PROPERTY_MANAGEMENT">Gestión</SelectItem>
                  <SelectItem value="PROPERTY_SEARCH">Búsqueda</SelectItem>
                  <SelectItem value="TENANT_SEARCH">Inquilinos</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={marketplaceFilters.urgency}
                onValueChange={value =>
                  setMarketplaceFilters({ ...marketplaceFilters, urgency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Urgencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={loadMarketplace}>
                <Search className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            {marketplaceRequests.map((request: any) => (
              <Card key={request.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{request.title}</h4>
                      <Badge
                        variant={
                          request.urgency === 'URGENT'
                            ? 'destructive'
                            : request.urgency === 'HIGH'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {request.urgency}
                      </Badge>
                      {request.alreadyResponded && (
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ya respondiste
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {request.user.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {request.user.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-blue-600 ml-4">
                    <Star className="h-3 w-3 mr-1" />
                    {request.matchScore}
                  </Badge>
                </div>

                {!request.alreadyResponded && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      const message = prompt('Escribe tu propuesta (mínimo 50 caracteres):');
                      if (message && message.length >= 50) {
                        respondToRequest(request.id, message);
                      } else if (message) {
                        toast.error('El mensaje es muy corto');
                      }
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Responder Solicitud
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: INVITACIONES */}
        <TabsContent value="invitations" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Invitaciones Enviadas</h3>
            <p className="text-sm text-gray-600">
              Gestiona las invitaciones que has enviado a usuarios
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.map((inv: any) => (
              <Card key={inv.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{inv.user.name}</h4>
                    <p className="text-sm text-gray-600">{inv.subject}</p>
                  </div>
                  <Badge
                    variant={
                      inv.status === 'ACCEPTED'
                        ? 'default'
                        : inv.status === 'REJECTED'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {inv.status}
                  </Badge>
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <p>Tipo: {inv.invitationType}</p>
                  <p>Enviada: {new Date(inv.createdAt).toLocaleDateString()}</p>
                  {inv.viewedAt && <p>Vista: {new Date(inv.viewedAt).toLocaleDateString()}</p>}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para enviar invitación */}
      <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Invitación</DialogTitle>
            <DialogDescription>
              Envía una propuesta personalizada a {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Invitación</label>
              <Select
                value={invitationData.invitationType}
                onValueChange={value =>
                  setInvitationData({ ...invitationData, invitationType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERVICE_OFFER">Oferta de Servicios</SelectItem>
                  <SelectItem value="PROPERTY_MANAGEMENT">Gestión de Propiedades</SelectItem>
                  <SelectItem value="PROPERTY_VIEWING">Ver Propiedades</SelectItem>
                  <SelectItem value="CONSULTATION">Consultoría</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Asunto</label>
              <Input
                placeholder="Ej: Propuesta de gestión profesional"
                value={invitationData.subject}
                onChange={e => setInvitationData({ ...invitationData, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mensaje</label>
              <Textarea
                placeholder="Escribe un mensaje personalizado..."
                rows={6}
                value={invitationData.message}
                onChange={e => setInvitationData({ ...invitationData, message: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Comisión Propuesta (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={invitationData.proposedRate}
                onChange={e =>
                  setInvitationData({
                    ...invitationData,
                    proposedRate: parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={sendInvitation} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Enviar Invitación
              </Button>
              <Button variant="outline" onClick={() => setShowInvitationDialog(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
