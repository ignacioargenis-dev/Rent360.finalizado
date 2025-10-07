'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
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
} from 'lucide-react';
import { User as UserType } from '@/types';

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
  notes?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  propertyId?: string;
  propertyTitle?: string;
  followUpDate?: string;
}

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prospectId = params.prospectId as string;

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

      // Mock data - in a real app, this would come from an API
      const mockProspects: Prospect[] = [
        {
          id: '1',
          name: 'María González',
          email: 'maria.gonzalez@email.com',
          phone: '+56912345678',
          interestedIn: ['departamento', 'casa'],
          budget: { min: 800000, max: 1200000 },
          preferredLocation: 'Providencia',
          status: 'qualified',
          source: 'website',
          createdAt: '2024-01-15T10:30:00Z',
          lastContact: '2024-01-20T14:15:00Z',
          notes: 'Interesada en propiedades de 2-3 dormitorios. Prefiere vista al parque.',
          ownerName: 'Carlos Rodríguez',
          ownerEmail: 'carlos.rodriguez@email.com',
          ownerPhone: '+56987654321',
          propertyId: '1',
          propertyTitle: 'Depto. 3D + 2B Providencia',
          followUpDate: '2024-01-25T10:00:00Z',
        },
        {
          id: '2',
          name: 'Pedro Sánchez',
          email: 'pedro.sanchez@email.com',
          phone: '+56955556666',
          interestedIn: ['departamento'],
          budget: { min: 600000, max: 900000 },
          preferredLocation: 'Las Condes',
          status: 'active',
          source: 'referral',
          createdAt: '2024-01-18T09:45:00Z',
          lastContact: '2024-01-22T11:30:00Z',
          notes: 'Busca primera vivienda. Tiene buen historial crediticio.',
          followUpDate: '2024-01-28T15:00:00Z',
        },
      ];

      const foundProspect = mockProspects.find(p => p.id === prospectId);
      if (foundProspect) {
        setProspect(foundProspect);
        setEditForm({
          status: foundProspect.status,
          notes: foundProspect.notes || '',
          followUpDate: foundProspect.followUpDate || '',
        });
      } else {
        setErrorMessage('Prospecto no encontrado');
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
      router.push('/broker/clients/new?from=prospect');
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

          {/* Property Interests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Intereses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {prospect.followUpDate && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Próximo Seguimiento</Label>
                  <p className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(prospect.followUpDate).toLocaleDateString('es-CL')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Property Information */}
        {prospect.propertyId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Propiedad de Interés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{prospect.propertyTitle}</h4>
                  <p className="text-sm text-gray-600">Propietario: {prospect.ownerName}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/broker/properties/${prospect.propertyId}`)}
                >
                  Ver Propiedad
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
