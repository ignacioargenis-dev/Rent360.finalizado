'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Users,
  FileText,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Mail,
  Send,
  Search,
  Filter,
  Eye,
  Reply,
  Archive,
  Star,
  Wrench,
  DollarSign,
  Home,
  Plus,
  RefreshCw,
  Building,
} from 'lucide-react';
import { User } from '@/types';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  type: 'maintenance' | 'payment' | 'general' | 'urgent';
  propertyId?: string;
  propertyTitle?: string;
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Check if coming from a "new message" link
    const isNewMessage = searchParams.get('new') === 'true';

    if (isNewMessage) {
      const recipientData = sessionStorage.getItem('newMessageRecipient');
      if (recipientData) {
        try {
          const recipient = JSON.parse(recipientData);

          // Create new message with the recipient
          const newMessage: Message = {
            id: `msg_${Date.now()}`,
            sender: {
              id: recipient.id,
              name: recipient.name,
              email: recipient.email || `${recipient.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
              role: recipient.type === 'tenant' ? 'tenant' : recipient.role || 'unknown',
            },
            recipient: {
              id: 'owner_1',
              name: 'Propietario',
              email: 'owner@example.com',
              role: 'owner'
            },
            subject: `Consulta sobre ${recipient.propertyTitle || recipient.serviceType || 'servicio'}`,
            content: `Hola ${recipient.name}, me gustaría contactarte sobre ${recipient.propertyTitle ? `la propiedad "${recipient.propertyTitle}"` : recipient.serviceType ? `un servicio de ${recipient.serviceType}` : 'tu servicio'}.`,
            timestamp: new Date().toISOString(),
            type: recipient.serviceType ? 'maintenance' : 'general',
            read: false,
            priority: 'medium',
            propertyId: recipient.propertyId,
            propertyTitle: recipient.propertyTitle,
          } as Message;

          // Add the new message to the list
          setMessages(prev => [newMessage, ...prev]);

          // Clear the sessionStorage
          sessionStorage.removeItem('newMessageRecipient');

          // Update URL to remove the 'new' parameter
          const url = new URL(window.location.href);
          url.searchParams.delete('new');
          window.history.replaceState({}, '', url.toString());

        } catch (error) {
          console.error('Error parsing recipient data:', error);
        }
      }
    }

    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load user data
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }

        // Load messages data directly (inline function)
        try {
          // Mock messages data
          const mockMessages: Message[] = [
            {
              id: '1',
              sender: {
                id: 'tenant1',
                name: 'María González',
                email: 'maria.gonzalez@email.com',
                role: 'tenant',
              },
              recipient: {
                id: user?.id || 'owner1',
                name: user?.name || 'Propietario',
                email: user?.email || 'owner@email.com',
                role: 'owner',
              },
              subject: 'Problema con la llave del baño',
              content:
                'Hola, tengo un problema con la llave del baño en el departamento 5B. El agua no para de gotear y necesito que venga alguien a repararlo lo antes posible.',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              read: false,
              priority: 'high',
              type: 'maintenance',
              propertyId: 'prop1',
              propertyTitle: 'Departamento en Providencia',
            },
            {
              id: '2',
              sender: {
                id: 'tenant2',
                name: 'Carlos Rodríguez',
                email: 'carlos.rodriguez@email.com',
                role: 'tenant',
              },
              recipient: {
                id: user?.id || 'owner1',
                name: user?.name || 'Propietario',
                email: user?.email || 'owner@email.com',
                role: 'owner',
              },
              subject: 'Pago del arriendo enero 2024',
              content:
                'Le confirmo que ya realicé el pago del arriendo correspondiente al mes de enero. El comprobante deberá llegarle por email.',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              read: true,
              priority: 'medium',
              type: 'payment',
              propertyId: 'prop2',
              propertyTitle: 'Casa Familiar en Las Condes',
            },
            {
              id: '3',
              sender: {
                id: 'maintenance1',
                name: 'Servicio de Mantenimiento XYZ',
                email: 'contacto@mantxyz.cl',
                role: 'maintenance',
              },
              recipient: {
                id: user?.id || 'owner1',
                name: user?.name || 'Propietario',
                email: user?.email || 'owner@email.com',
                role: 'owner',
              },
              subject: 'Cotización para reparación eléctrica',
              content:
                'Adjunto cotización para la reparación completa del sistema eléctrico en su propiedad de Las Condes. El trabajo incluye revisión completa, reemplazo de conductores dañados y certificación.',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              read: false,
              priority: 'medium',
              type: 'general',
              propertyId: 'prop2',
              propertyTitle: 'Casa Familiar en Las Condes',
            },
            {
              id: '4',
              sender: {
                id: 'tenant3',
                name: 'Ana López',
                email: 'ana.lopez@email.com',
                role: 'tenant',
              },
              recipient: {
                id: user?.id || 'owner1',
                name: user?.name || 'Propietario',
                email: user?.email || 'owner@email.com',
                role: 'owner',
              },
              subject: 'Consulta sobre renovación de contrato',
              content:
                'Hola, me gustaría saber si es posible renovar mi contrato de arriendo por un año más. Estoy muy contenta con el departamento.',
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              read: true,
              priority: 'low',
              type: 'general',
              propertyId: 'prop3',
              propertyTitle: 'Estudio Moderno Centro',
            },
          ];

          setMessages(mockMessages);
        } catch (error) {
          logger.error('Error loading messages:', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } catch (error) {
        setError('Error al cargar los datos');
        logger.error('Error loading data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []); // Empty dependency array for initialization

  useEffect(() => {
    let filtered = messages;

    if (searchTerm) {
      filtered = filtered.filter(
        message =>
          message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(message => message.type === typeFilter);
    }

    if (readFilter !== 'all') {
      filtered = filtered.filter(message => (readFilter === 'read' ? message.read : !message.read));
    }

    setFilteredMessages(filtered);
  }, [messages, searchTerm, typeFilter, readFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user data
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      // Load messages data
      await loadMessages();
    } catch (error) {
      setError('Error al cargar los datos');
      logger.error('Error loading data:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = useCallback(async () => {
    try {
      // Mock messages data
      const mockMessages: Message[] = [
        {
          id: '1',
          sender: {
            id: 'tenant1',
            name: 'María González',
            email: 'maria.gonzalez@email.com',
            role: 'tenant',
          },
          recipient: {
            id: user?.id || 'owner1',
            name: user?.name || 'Propietario',
            email: user?.email || 'owner@email.com',
            role: 'owner',
          },
          subject: 'Problema con la llave del baño',
          content:
            'Hola, tengo un problema con la llave del baño en el departamento 5B. El agua no para de gotear y necesito que venga alguien a repararlo lo antes posible.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'high',
          type: 'maintenance',
          propertyId: 'prop1',
          propertyTitle: 'Departamento en Providencia',
        },
        {
          id: '2',
          sender: {
            id: 'tenant2',
            name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@email.com',
            role: 'tenant',
          },
          recipient: {
            id: user?.id || 'owner1',
            name: user?.name || 'Propietario',
            email: user?.email || 'owner@email.com',
            role: 'owner',
          },
          subject: 'Pago del arriendo enero 2024',
          content:
            'Le confirmo que ya realicé el pago del arriendo correspondiente al mes de enero. El comprobante debería llegarle por email.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'medium',
          type: 'payment',
          propertyId: 'prop2',
          propertyTitle: 'Casa Familiar en Las Condes',
        },
        {
          id: '3',
          sender: {
            id: 'maintenance1',
            name: 'Servicio de Mantenimiento XYZ',
            email: 'contacto@mantxyz.cl',
            role: 'maintenance',
          },
          recipient: {
            id: user?.id || 'owner1',
            name: user?.name || 'Propietario',
            email: user?.email || 'owner@email.com',
            role: 'owner',
          },
          subject: 'Cotización para reparación eléctrica',
          content:
            'Adjunto cotización para la reparación completa del sistema eléctrico en su propiedad de Las Condes. El trabajo incluye revisión completa, reemplazo de conductores dañados y certificación.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'medium',
          type: 'general',
          propertyId: 'prop2',
          propertyTitle: 'Casa Familiar en Las Condes',
        },
        {
          id: '4',
          sender: {
            id: 'tenant3',
            name: 'Ana López',
            email: 'ana.lopez@email.com',
            role: 'tenant',
          },
          recipient: {
            id: user?.id || 'owner1',
            name: user?.name || 'Propietario',
            email: user?.email || 'owner@email.com',
            role: 'owner',
          },
          subject: 'Consulta sobre renovación de contrato',
          content:
            'Hola, me gustaría saber si es posible renovar mi contrato de arriendo por un año más. Estoy muy contenta con el departamento.',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'low',
          type: 'general',
          propertyId: 'prop3',
          propertyTitle: 'Estudio Moderno Centro',
        },
      ];

      setMessages(mockMessages);
    } catch (error) {
      logger.error('Error loading messages:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [user]);

  const handleMarkAsRead = async (messageId: string) => {
    setMessages(prev => prev.map(msg => (msg.id === messageId ? { ...msg, read: true } : msg)));
  };

  const handleMarkAsUnread = async (messageId: string) => {
    setMessages(prev => prev.map(msg => (msg.id === messageId ? { ...msg, read: false } : msg)));
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyContent.trim()) {
      return;
    }

    // Simulate sending reply
    setSuccessMessage('Respuesta enviada exitosamente');
    setReplyContent('');
    setIsReplyDialogOpen(false);
    setSelectedMessage(null);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'payment':
        return <DollarSign className="w-4 h-4" />;
      case 'general':
        return <MessageSquare className="w-4 h-4" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'text-blue-600 bg-blue-50';
      case 'payment':
        return 'text-green-600 bg-green-50';
      case 'general':
        return 'text-gray-600 bg-gray-50';
      case 'urgent':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
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

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  // Simulate reload
                  setTimeout(() => {
                    setLoading(false);
                  }, 1000);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Mensajes"
      subtitle="Gestiona tus comunicaciones con inquilinos y proveedores"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messages.length}</div>
              <p className="text-xs text-muted-foreground">
                {messages.filter(m => !m.read).length} sin leer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mantenimiento</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {messages.filter(m => m.type === 'maintenance').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {messages.filter(m => m.type === 'maintenance' && !m.read).length} pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {messages.filter(m => m.type === 'payment').length}
              </div>
              <p className="text-xs text-muted-foreground">Confirmaciones de pago</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {
                  messages.filter(m => {
                    const messageDate = new Date(m.timestamp);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return messageDate > weekAgo;
                  }).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Mensajes recientes</p>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros y búsqueda */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por remitente, asunto o contenido..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo de mensaje" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="payment">Pagos</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="read">Leídos</SelectItem>
                  <SelectItem value="unread">Sin leer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de mensajes */}
        <div className="space-y-4">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm || typeFilter !== 'all' || readFilter !== 'all'
                      ? 'No se encontraron mensajes'
                      : 'No tienes mensajes'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || typeFilter !== 'all' || readFilter !== 'all'
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'Los mensajes de tus inquilinos y proveedores aparecerán aquí'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map(message => (
              <Card
                key={message.id}
                className={`hover:shadow-md transition-shadow ${!message.read ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar del remitente */}
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {message.sender.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>

                      {/* Contenido del mensaje */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`font-semibold ${!message.read ? 'text-gray-900' : 'text-gray-700'}`}
                          >
                            {message.subject}
                          </h3>
                          {!message.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">
                            De: {message.sender.name} ({message.sender.role})
                          </span>
                          {message.propertyTitle && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <Home className="w-3 h-3" />
                                {message.propertyTitle}
                              </span>
                            </>
                          )}
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(message.timestamp)}
                          </span>
                        </div>

                        <p
                          className={`text-sm ${!message.read ? 'text-gray-900' : 'text-gray-600'} line-clamp-2 mb-3`}
                        >
                          {message.content}
                        </p>

                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(message.type)}>
                            <span className="flex items-center gap-1">
                              {getTypeIcon(message.type)}
                              {message.type === 'maintenance'
                                ? 'Mantenimiento'
                                : message.type === 'payment'
                                  ? 'Pago'
                                  : message.type === 'general'
                                    ? 'General'
                                    : message.type === 'urgent'
                                      ? 'Urgente'
                                      : message.type}
                            </span>
                          </Badge>

                          <Badge className={getPriorityColor(message.priority)}>
                            Prioridad{' '}
                            {message.priority === 'high'
                              ? 'Alta'
                              : message.priority === 'medium'
                                ? 'Media'
                                : 'Baja'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMessage(message);
                          setIsReplyDialogOpen(true);
                        }}
                      >
                        <Reply className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          message.read
                            ? handleMarkAsUnread(message.id)
                            : handleMarkAsRead(message.id)
                        }
                      >
                        {message.read ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>

                      <Button variant="ghost" size="sm">
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog para responder */}
        <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Responder a {selectedMessage?.sender.name}</DialogTitle>
              <DialogDescription>Re: {selectedMessage?.subject}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tu respuesta</label>
                <Textarea
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  rows={6}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleReply} disabled={!replyContent.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Enviar Respuesta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
