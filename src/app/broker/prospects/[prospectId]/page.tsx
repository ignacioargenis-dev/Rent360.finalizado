'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  Edit,
  Plus,
  MessageSquare,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Target,
  Home,
  Activity,
  Save,
  Trash2,
} from 'lucide-react';

interface Prospect {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rut?: string;
  status: string;
  priority: string;
  interestedIn: string[];
  budget?: {
    min: number;
    max: number;
  };
  preferredLocations: string[];
  notes?: string;
  nextFollowUpDate?: string;
  lostReason?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: string;
    address?: string;
    city?: string;
    commune?: string;
    region?: string;
    properties: Array<{
      id: string;
      title: string;
      address: string;
      price: number;
      type: string;
      status: string;
    }>;
  };
  activities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
    broker: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  sharedProperties: Array<{
    id: string;
    property: {
      id: string;
      title: string;
      address: string;
      price: number;
      type: string;
      images: string[];
      status: string;
    };
    sharedAt: string;
  }>;
  convertedClient?: {
    id: string;
    commissionRate: number;
    managedProperties: Array<{
      property: {
        id: string;
        title: string;
        address: string;
        price: number;
        status: string;
      };
    }>;
  };
}

export default function ProspectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prospectId = params?.prospectId as string;

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Estados para edición
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Prospect>>({});

  // Estados para actividades
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [activityType, setActivityType] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);

  // Estados para compartir propiedades
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [availableProperties, setAvailableProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [sharingProperty, setSharingProperty] = useState(false);

  useEffect(() => {
    if (prospectId) {
      loadProspect();
    }
  }, [prospectId]);

  const loadProspect = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/broker/prospects/${prospectId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setProspect(data.data); // La API retorna data.data, no data.prospect
        setEditData(data.data);
      } else if (response.status === 404) {
        // Prospecto no encontrado - mostrar mensaje de error
        setProspect(null);
      } else {
        toast.error(data.error || 'Error al cargar el prospecto');
        router.push('/broker/prospects');
      }
    } catch (error) {
      logger.error('Error loading prospect:', error);
      toast.error('Error al cargar el prospecto');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!prospect) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/broker/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Prospecto actualizado exitosamente');
        setProspect({ ...prospect, ...editData });
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Error al actualizar el prospecto');
      }
    } catch (error) {
      logger.error('Error updating prospect:', error);
      toast.error('Error al actualizar el prospecto');
    } finally {
      setSaving(false);
    }
  };

  const handleAddActivity = async () => {
    if (!activityType || !activityDescription.trim()) {
      toast.error('Tipo y descripción son requeridos');
      return;
    }

    try {
      setSavingActivity(true);
      const response = await fetch(`/api/broker/prospects/${prospectId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: activityType,
          description: activityDescription,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Actividad agregada exitosamente');
        setShowActivityDialog(false);
        setActivityType('');
        setActivityDescription('');
        loadProspect(); // Recargar para ver la nueva actividad
      } else {
        toast.error(data.error || 'Error al agregar actividad');
      }
    } catch (error) {
      logger.error('Error adding activity:', error);
      toast.error('Error al agregar actividad');
    } finally {
      setSavingActivity(false);
    }
  };

  const loadAvailableProperties = async () => {
    try {
      const response = await fetch('/api/properties/list?status=AVAILABLE&limit=50');
      const data = await response.json();

      if (data.success) {
        setAvailableProperties(data.properties || []);
      }
    } catch (error) {
      logger.error('Error loading properties:', error);
    }
  };

  const handleShareProperty = async () => {
    if (!selectedPropertyId) {
      toast.error('Selecciona una propiedad');
      return;
    }

    try {
      setSharingProperty(true);
      const response = await fetch(`/api/broker/prospects/${prospectId}/share-property`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          propertyId: selectedPropertyId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Propiedad compartida exitosamente');
        setShowShareDialog(false);
        setSelectedPropertyId('');
        loadProspect(); // Recargar para ver la propiedad compartida
      } else {
        toast.error(data.error || 'Error al compartir propiedad');
      }
    } catch (error) {
      logger.error('Error sharing property:', error);
      toast.error('Error al compartir propiedad');
    } finally {
      setSharingProperty(false);
    }
  };

  const handleConvertToClient = async () => {
    if (!prospect) {
      return;
    }

    try {
      const response = await fetch(`/api/broker/prospects/${prospectId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          commissionRate: 5, // Default commission
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Prospecto convertido a cliente exitosamente');
        loadProspect(); // Recargar para ver el estado actualizado
      } else {
        toast.error(data.error || 'Error al convertir prospecto');
      }
    } catch (error) {
      logger.error('Error converting prospect:', error);
      toast.error('Error al convertir prospecto');
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Detalle del Prospecto" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!prospect) {
    return (
      <UnifiedDashboardLayout title="Detalle del Prospecto" subtitle="Prospecto no encontrado">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Prospecto no encontrado</h3>
            <p className="text-gray-600 mb-4">
              El prospecto que buscas no existe o ha sido eliminado.
            </p>
            <Button onClick={() => router.push('/broker/prospects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Prospects
            </Button>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-gray-100 text-gray-800';
      case 'CONTACTED':
        return 'bg-blue-100 text-blue-800';
      case 'QUALIFIED':
        return 'bg-yellow-100 text-yellow-800';
      case 'MEETING_SCHEDULED':
        return 'bg-purple-100 text-purple-800';
      case 'PROPOSAL_SENT':
        return 'bg-indigo-100 text-indigo-800';
      case 'NEGOTIATING':
        return 'bg-orange-100 text-orange-800';
      case 'CONVERTED':
        return 'bg-green-100 text-green-800';
      case 'LOST':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <UnifiedDashboardLayout
      title={`Detalle del Prospecto`}
      subtitle={`${prospect.name} - ${prospect.user?.role === 'OWNER' ? 'Propietario' : 'Inquilino'}`}
    >
      <div className="space-y-6">
        {/* Header con acciones */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.push('/broker/prospects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Prospects
          </Button>

          <div className="flex gap-2">
            {!prospect.convertedClient && prospect.status !== 'CONVERTED' && (
              <Button onClick={handleConvertToClient} variant="default">
                <CheckCircle className="h-4 w-4 mr-2" />
                Convertir a Cliente
              </Button>
            )}

            <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancelar' : 'Editar'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Información General</TabsTrigger>
            <TabsTrigger value="activities">Actividades</TabsTrigger>
            <TabsTrigger value="properties">Propiedades Compartidas</TabsTrigger>
            <TabsTrigger value="client">Estado del Cliente</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Prospecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editData.name || ''}
                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{prospect.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editData.email || ''}
                        onChange={e => setEditData({ ...editData, email: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{prospect.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editData.phone || ''}
                        onChange={e => setEditData({ ...editData, phone: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{prospect.phone || 'No especificado'}</p>
                    )}
                  </div>

                  <div>
                    <Label>Estado</Label>
                    {isEditing ? (
                      <Select
                        value={editData.status || prospect.status}
                        onValueChange={value => setEditData({ ...editData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">Nuevo</SelectItem>
                          <SelectItem value="CONTACTED">Contactado</SelectItem>
                          <SelectItem value="QUALIFIED">Calificado</SelectItem>
                          <SelectItem value="MEETING_SCHEDULED">Reunión Programada</SelectItem>
                          <SelectItem value="PROPOSAL_SENT">Propuesta Enviada</SelectItem>
                          <SelectItem value="NEGOTIATING">Negociando</SelectItem>
                          <SelectItem value="CONVERTED">Convertido</SelectItem>
                          <SelectItem value="LOST">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusColor(prospect.status)}>{prospect.status}</Badge>
                    )}
                  </div>

                  <div>
                    <Label>Prioridad</Label>
                    {isEditing ? (
                      <Select
                        value={editData.priority || prospect.priority}
                        onValueChange={value => setEditData({ ...editData, priority: value })}
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
                    ) : (
                      <Badge className={getPriorityColor(prospect.priority)}>
                        {prospect.priority}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label>Tipo</Label>
                    <Badge variant="outline">
                      {prospect.user?.role === 'OWNER' ? 'Propietario' : 'Inquilino'}
                    </Badge>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      )}
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData(prospect);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Propiedades del usuario si existen */}
            {prospect.user?.properties && prospect.user.properties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Propiedades del Usuario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {prospect.user.properties.map(property => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{property.title}</h4>
                          <p className="text-sm text-gray-600">{property.address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{property.type}</Badge>
                            <Badge variant="secondary">{property.status}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">
                            ${property.price.toLocaleString('es-CL')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            {/* Agregar actividad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Actividades
                  </span>
                  <Button onClick={() => setShowActivityDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Actividad
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prospect.activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay actividades registradas
                    </h3>
                    <p className="text-gray-600">
                      Registra llamadas, reuniones y otras interacciones con este prospecto.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prospect.activities.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{activity.type}</Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(activity.createdAt).toLocaleDateString('es-CL')}
                            </span>
                          </div>
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Por: {activity.broker.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Propiedades Compartidas
                  </span>
                  <Button
                    onClick={() => {
                      loadAvailableProperties();
                      setShowShareDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Compartir Propiedad
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prospect.sharedProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay propiedades compartidas
                    </h3>
                    <p className="text-gray-600">
                      Comparte propiedades relevantes con este prospecto para aumentar su interés.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {prospect.sharedProperties.map(shared => (
                      <div
                        key={shared.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{shared.property.title}</h4>
                          <p className="text-sm text-gray-600">{shared.property.address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{shared.property.type}</Badge>
                            <Badge variant="secondary">{shared.property.status}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">
                            ${shared.property.price.toLocaleString('es-CL')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Compartida: {new Date(shared.sharedAt).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Estado del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prospect.convertedClient ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-600">Cliente Activo</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tasa de Comisión</Label>
                        <p className="text-lg font-semibold">
                          {prospect.convertedClient.commissionRate}%
                        </p>
                      </div>

                      <div>
                        <Label>Propiedades Gestionadas</Label>
                        <p className="text-lg font-semibold">
                          {prospect.convertedClient.managedProperties.length}
                        </p>
                      </div>
                    </div>

                    {prospect.convertedClient.managedProperties.length > 0 && (
                      <div>
                        <Label className="mb-2 block">Propiedades Gestionadas</Label>
                        <div className="space-y-2">
                          {prospect.convertedClient.managedProperties.map(managed => (
                            <div
                              key={managed.property.id}
                              className="flex items-center justify-between p-3 border rounded"
                            >
                              <div>
                                <h4 className="font-medium">{managed.property.title}</h4>
                                <p className="text-sm text-gray-600">{managed.property.address}</p>
                              </div>
                              <Badge variant="secondary">{managed.property.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aún no es cliente</h3>
                    <p className="text-gray-600 mb-4">
                      Cuando conviertas este prospecto a cliente, aquí podrás ver toda la
                      información de la relación comercial.
                    </p>
                    {prospect.status !== 'CONVERTED' && (
                      <Button onClick={handleConvertToClient}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Convertir a Cliente
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para agregar actividad */}
        <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Actividad</DialogTitle>
              <DialogDescription>
                Registra una nueva interacción o actividad con este prospecto.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="activity-type">Tipo de Actividad</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CALL">Llamada</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="MEETING">Reunión</SelectItem>
                    <SelectItem value="VISIT">Visita</SelectItem>
                    <SelectItem value="PROPOSAL">Propuesta</SelectItem>
                    <SelectItem value="NEGOTIATION">Negociación</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="activity-description">Descripción</Label>
                <Textarea
                  id="activity-description"
                  placeholder="Describe la actividad realizada..."
                  value={activityDescription}
                  onChange={e => setActivityDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActivityDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddActivity}
                disabled={savingActivity || !activityType || !activityDescription.trim()}
              >
                {savingActivity && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                Agregar Actividad
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para compartir propiedad */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compartir Propiedad</DialogTitle>
              <DialogDescription>
                Selecciona una propiedad para compartir con este prospecto.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Propiedad a Compartir</Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.map((property: any) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title} - {property.address} ($
                        {property.price.toLocaleString('es-CL')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleShareProperty}
                disabled={sharingProperty || !selectedPropertyId}
              >
                {sharingProperty && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                Compartir Propiedad
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
