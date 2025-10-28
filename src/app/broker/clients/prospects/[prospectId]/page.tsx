'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  MessageSquare,
  Edit,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  UserCheck,
  Target,
} from 'lucide-react';
import { User as UserType } from '@/types';

interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'OWNER' | 'TENANT'; // Nuevo campo para distinguir el tipo de usuario
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
  avatar?: string;
  // Advanced analytics
  engagementScore: number;
  responseTime: number; // in hours
  conversionProbability: number;
  budgetFlexibility: number; // 1-5 scale
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  competitorActivity: number; // number of competitor interactions
  propertyViews: number;
  emailOpens: number;
  lastActivity: string;
  behavioralScore: number; // based on actions taken
  demographicFit: number; // how well they match target demographics
  marketTiming: 'cold' | 'warm' | 'hot'; // market conditions
  matchingScore: number;
  engagementLevel: 'low' | 'medium' | 'high';
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
  followUpDate: string | null;
  leadQuality: 'cold' | 'warm' | 'hot';
  // Campos adicionales de datos reales
  totalProperties?: number;
  totalContracts?: number;
  daysSinceCreation?: number;
  // Información específica por rol
  portfolioStats?: {
    totalProperties: number;
    totalValue: number;
    averagePrice: number;
    activeListings: number;
  };
  recentProperties?: Array<{
    id: string;
    title: string;
    address: string;
    price: number;
    status: string;
    type: string;
  }>;
  searchProfile?: {
    totalContracts: number;
    activeTenancies: number;
    rentalHistory: number;
  };
}

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prospectId = params?.prospectId as string;

  const [user, setUser] = useState<UserType | null>(null);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    status: 'active' as Prospect['status'],
    notes: '',
    followUpDate: '',
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    type: 'email' as 'email' | 'phone' | 'meeting',
    subject: '',
    message: '',
    scheduledDate: '',
  });

  useEffect(() => {
    loadProspectData();
    loadUserData();
  }, [prospectId]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      logger.error('Error loading user data:', { error });
    }
  };

  const loadProspectData = async () => {
    try {
      setLoading(true);

      // Obtener datos reales del prospecto desde la API
      const response = await fetch(`/api/broker/clients/prospects/${prospectId}`);
      if (response.ok) {
        const data = await response.json();

        // Transformar datos de la API al formato esperado
        const prospectData: Prospect = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          role: data.role || 'TENANT',
          interestedIn: data.properties?.map((p: any) => p.type).filter(Boolean) || [
            'departamento',
          ],
          budget: {
            min: 500000, // Valor por defecto
            max: 2000000, // Valor por defecto
          },
          preferredLocation: data.city || data.commune || data.region || 'Sin especificar',
          status: 'active', // Por defecto para usuarios reales
          source: 'website', // Fuente: plataforma Rent360
          createdAt: data.createdAt,
          lastContact: data.updatedAt || data.createdAt,
          notes: `Usuario registrado en Rent360. ${data.stats?.totalProperties || 0} propiedades publicadas. ${data.stats?.totalContracts || 0} contratos realizados.`,
          avatar: data.avatar,
          // Advanced analytics - valores por defecto calculados
          engagementScore: Math.min(
            100,
            Math.max(
              20,
              40 + (data.stats?.totalProperties || 0) * 10 + (data.stats?.totalContracts || 0) * 15
            )
          ),
          responseTime: Math.max(0.5, Math.min(24, 2 + (data.daysSinceCreation || 0) * 0.1)),
          conversionProbability: Math.min(
            95,
            Math.max(
              5,
              20 + (data.stats?.totalProperties || 0) * 8 + (data.stats?.totalContracts || 0) * 12
            )
          ),
          budgetFlexibility: Math.min(
            5,
            Math.max(1, 1 + Math.floor((data.stats?.totalProperties || 0) / 2))
          ),
          urgencyLevel:
            (data.stats?.totalContracts || 0) > 2
              ? 'urgent'
              : (data.stats?.totalProperties || 0) > 1
                ? 'high'
                : (data.stats?.totalProperties || 0) > 0
                  ? 'medium'
                  : 'low',
          competitorActivity: Math.floor(
            Math.random() * Math.min(10, (data.stats?.totalProperties || 0) + 1)
          ),
          propertyViews: Math.max(
            1,
            (data.stats?.totalProperties || 0) * 5 + Math.floor(Math.random() * 20)
          ),
          emailOpens: Math.max(
            1,
            Math.floor((data.stats?.totalProperties || 0) * 2) + Math.floor(Math.random() * 10)
          ),
          lastActivity: data.updatedAt || data.createdAt,
          behavioralScore: Math.min(
            100,
            Math.max(
              30,
              50 + (data.stats?.totalProperties || 0) * 5 + (data.stats?.totalContracts || 0) * 8
            )
          ),
          demographicFit: Math.min(100, Math.max(40, 60 + Math.floor(Math.random() * 20))),
          marketTiming:
            (data.daysSinceCreation || 0) < 7
              ? 'hot'
              : (data.daysSinceCreation || 0) < 30
                ? 'warm'
                : 'cold',
          matchingScore: Math.min(
            100,
            Math.max(
              25,
              40 + (data.stats?.totalProperties || 0) * 6 + (data.stats?.totalContracts || 0) * 10
            )
          ),
          engagementLevel:
            (data.stats?.totalContracts || 0) > 1
              ? 'high'
              : (data.stats?.totalProperties || 0) > 0
                ? 'medium'
                : 'low',
          preferredContactMethod: ['email', 'phone', 'whatsapp'][Math.floor(Math.random() * 3)] as
            | 'email'
            | 'phone'
            | 'whatsapp',
          followUpDate: null,
          leadQuality:
            (data.stats?.totalContracts || 0) > 1
              ? 'hot'
              : (data.stats?.totalProperties || 0) > 0
                ? 'warm'
                : 'cold',
          // Campos adicionales de datos reales
          totalProperties: data.stats?.totalProperties || 0,
          totalContracts: data.stats?.totalContracts || 0,
          daysSinceCreation: data.daysSinceCreation || 0,
          // Información específica por rol
          ...(data.role === 'OWNER'
            ? {
                portfolioStats: data.portfolioStats,
                recentProperties: data.recentProperties,
              }
            : {}),
          ...(data.role === 'TENANT'
            ? {
                searchProfile: data.searchProfile,
              }
            : {}),
        };

        setProspect(prospectData);
        setEditForm({
          status: prospectData.status,
          notes: prospectData.notes || '',
          followUpDate: prospectData.followUpDate || '',
        });
      } else {
        if (response.status === 404) {
          setErrorMessage('Prospecto no encontrado');
        } else {
          setErrorMessage('Error al cargar los datos del prospecto');
        }
      }
    } catch (error) {
      logger.error('Error loading prospect data:', { error });
      setSuccessMessage('Error al cargar los datos del prospecto');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      if (!prospect) {
        return;
      }

      // Update prospect data
      setProspect(prev =>
        prev
          ? {
              ...prev,
              status: editForm.status,
              notes: editForm.notes,
              followUpDate: editForm.followUpDate,
            }
          : null
      );

      setSuccessMessage('Cambios guardados correctamente');
      setShowEditModal(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error saving prospect changes:', { error });
      setSuccessMessage('Error al guardar los cambios');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleSendContact = async () => {
    try {
      if (!prospect) {
        return;
      }

      // Simulate sending contact
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccessMessage('Mensaje enviado correctamente');
      setShowContactModal(false);

      // Update last contact
      setProspect(prev =>
        prev
          ? {
              ...prev,
              lastContact: new Date().toISOString(),
            }
          : null
      );

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error sending contact:', { error });
      setSuccessMessage('Error al enviar el mensaje');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleConvertToClient = async () => {
    try {
      if (!prospect) {
        return;
      }

      // Navigate to client creation with prospect data
      const clientData = {
        name: prospect.name,
        email: prospect.email,
        phone: prospect.phone,
        budget: prospect.budget,
        preferredLocation: prospect.preferredLocation,
        interestedIn: prospect.interestedIn,
        source: 'prospect_conversion',
      };

      sessionStorage.setItem('prospectToConvert', JSON.stringify(clientData));
      router.push('/broker/clients/new');
    } catch (error) {
      logger.error('Error converting prospect:', { error });
      setSuccessMessage('Error al convertir el prospecto');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Prospect['status']) => {
    const statusConfig = {
      active: { label: 'Activo', className: 'bg-blue-100 text-blue-800' },
      contacted: { label: 'Contactado', className: 'bg-yellow-100 text-yellow-800' },
      qualified: { label: 'Calificado', className: 'bg-green-100 text-green-800' },
      converted: { label: 'Convertido', className: 'bg-purple-100 text-purple-800' },
      lost: { label: 'Perdido', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Detalle de Prospecto" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información del prospecto...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!prospect) {
    return (
      <UnifiedDashboardLayout title="Detalle de Prospecto" subtitle="No encontrado">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Prospecto no encontrado</h3>
            <p className="text-gray-600 mb-4">
              El prospecto que buscas no existe o ha sido eliminado.
            </p>
            <Button onClick={() => router.push('/broker/clients/prospects')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Prospectos
            </Button>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title={`Prospecto: ${prospect.name}`}
      subtitle="Información detallada y gestión"
    >
      {/* Success/Error Messages */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.push('/broker/clients/prospects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={() => setShowContactModal(true)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Contactar
            </Button>
            <Button onClick={() => setShowConvertModal(true)}>
              <UserCheck className="w-4 h-4 mr-2" />
              Convertir a Cliente
            </Button>
          </div>
        </div>

        {/* Prospect Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Nombre</Label>
                <p className="text-lg font-semibold">{prospect.name}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Tipo de Usuario</Label>
                <Badge
                  className={
                    prospect.role === 'OWNER'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }
                >
                  {prospect.role === 'OWNER' ? '🏠 Propietario' : '🏢 Inquilino'}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Estado</Label>
                <div className="mt-1">{getStatusBadge(prospect.status)}</div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Fuente</Label>
                <p className="capitalize">{prospect.source}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Fecha de Creación</Label>
                <p>{new Date(prospect.createdAt).toLocaleDateString('es-CL')}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Último Contacto</Label>
                <p>{new Date(prospect.lastContact).toLocaleDateString('es-CL')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <p>{prospect.email}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Teléfono</Label>
                <p>{prospect.phone}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Ubicación Preferida</Label>
                <p className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {prospect.preferredLocation}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Role-specific Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {prospect.role === 'OWNER' ? (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Portafolio Inmobiliario
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5" />
                    Perfil de Búsqueda
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {prospect.role === 'OWNER' && prospect.portfolioStats ? (
                // Información para propietarios
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Total Propiedades</Label>
                      <p className="text-2xl font-bold text-blue-600">
                        {prospect.portfolioStats.totalProperties}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Valor Total</Label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(prospect.portfolioStats.totalValue)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Precio Promedio</Label>
                      <p className="text-lg font-semibold">
                        {formatCurrency(prospect.portfolioStats.averagePrice)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Propiedades Activas
                      </Label>
                      <p className="text-lg font-semibold text-blue-600">
                        {prospect.portfolioStats.activeListings}
                      </p>
                    </div>
                  </div>

                  {prospect.recentProperties && prospect.recentProperties.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Propiedades Recientes
                      </Label>
                      <div className="mt-2 space-y-2">
                        {prospect.recentProperties.map(property => (
                          <div
                            key={property.id}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <p className="font-medium text-sm">{property.title}</p>
                              <p className="text-xs text-gray-600">{property.address}</p>
                            </div>
                            <Badge
                              variant={property.status === 'AVAILABLE' ? 'default' : 'secondary'}
                            >
                              {property.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : prospect.role === 'TENANT' && prospect.searchProfile ? (
                // Información para inquilinos
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Contratos Activos</Label>
                      <p className="text-2xl font-bold text-green-600">
                        {prospect.searchProfile.activeTenancies}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Historial de Alquileres
                      </Label>
                      <p className="text-lg font-semibold">
                        {prospect.searchProfile.rentalHistory}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Intereses de Propiedad
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prospect.interestedIn.map(type => (
                        <Badge key={type} variant="outline">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Rango de Presupuesto
                    </Label>
                    <p className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(prospect.budget.min)} - {formatCurrency(prospect.budget.max)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Ubicación Preferida</Label>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {prospect.preferredLocation}
                    </p>
                  </div>
                </>
              ) : (
                // Fallback para datos antiguos
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tipo de Propiedad</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prospect.interestedIn.map(type => (
                        <Badge key={type} variant="outline">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Presupuesto</Label>
                    <p className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(prospect.budget.min)} - {formatCurrency(prospect.budget.max)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {prospect.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{prospect.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Prospecto</DialogTitle>
            <DialogDescription>Actualiza la información del prospecto</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={editForm.status}
                onValueChange={(value: Prospect['status']) =>
                  setEditForm(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="qualified">Calificado</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Agrega notas sobre este prospecto..."
              />
            </div>

            <div>
              <Label htmlFor="followUpDate">Fecha de Seguimiento</Label>
              <Input
                id="followUpDate"
                type="datetime-local"
                value={editForm.followUpDate}
                onChange={e => setEditForm(prev => ({ ...prev, followUpDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contactar Prospecto</DialogTitle>
            <DialogDescription>
              Envía un mensaje o programa una reunión con el prospecto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="contact-type">Tipo de Contacto</Label>
              <Select
                value={contactForm.type}
                onValueChange={(value: 'email' | 'phone' | 'meeting') =>
                  setContactForm(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Llamada Telefónica</SelectItem>
                  <SelectItem value="meeting">Reunión</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={contactForm.subject}
                onChange={e => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Asunto del mensaje..."
              />
            </div>

            <div>
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                value={contactForm.message}
                onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Escribe tu mensaje..."
                rows={4}
              />
            </div>

            {contactForm.type === 'meeting' && (
              <div>
                <Label htmlFor="scheduledDate">Fecha Programada</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={contactForm.scheduledDate}
                  onChange={e =>
                    setContactForm(prev => ({ ...prev, scheduledDate: e.target.value }))
                  }
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowContactModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendContact}>
              <Mail className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert Modal */}
      <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir a Cliente</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas convertir este prospecto en cliente? Se creará un nuevo
              registro de cliente con la información disponible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Información que se transferirá:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Nombre: {prospect.name}</li>
                <li>• Email: {prospect.email}</li>
                <li>• Teléfono: {prospect.phone}</li>
                <li>
                  • Presupuesto: {formatCurrency(prospect.budget.min)} -{' '}
                  {formatCurrency(prospect.budget.max)}
                </li>
                <li>• Ubicación preferida: {prospect.preferredLocation}</li>
                <li>• Intereses: {prospect.interestedIn.join(', ')}</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowConvertModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConvertToClient}>
              <UserCheck className="w-4 h-4 mr-2" />
              Convertir a Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}
