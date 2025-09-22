'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, 
  Send, 
  Search, 
  Filter, 
  User as UserIcon, 
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Paperclip,
  Image,
  Video,
  Phone as PhoneIcon,
  MoreVertical,
  Star, 
  Building, 
  Eye,
  Trash2,
  Archive,
  Reply,
  Forward,
  FileText, 
  Info
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

interface Message {
  id: string;
  threadId: string;
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  senderRole: 'client' | 'owner' | 'tenant' | 'admin' | 'broker';
  recipientName: string;
  recipientEmail: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'inquiry' | 'contract' | 'maintenance' | 'general' | 'complaint';
  propertyTitle?: string;
  propertyId?: string;
  attachments: { name: string; size: number; type: string }[];
  createdAt: string;
  readAt?: string;
  repliedAt?: string;
  tags: string[];
}

interface MessageStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
  urgent: number;
  replied: number;
  archived: number;
}

interface Conversation {
  id: string;
  participants: { name: string; email: string; role: string }[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  propertyTitle?: string;
  status: 'active' | 'archived';
}

export default function BrokerMessages() {

  const [user, setUser] = useState<User | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [stats, setStats] = useState<MessageStats>({
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0,
    urgent: 0,
    replied: 0,
    archived: 0,
  });

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('all');

  const [searchTerm, setSearchTerm] = useState('');

  const [view, setView] = useState<'messages' | 'conversations'>('messages');

  useEffect(() => {
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

    const loadMessages = async () => {
      try {
        // Mock messages data
        const mockMessages: Message[] = [
          {
            id: '1',
            threadId: 'thread1',
            subject: 'Consulta sobre departamento en Providencia',
            content: 'Hola, estoy interesado en el departamento en Providencia. ¿Podría agendar una visita para esta semana?',
            senderName: 'Juan Pérez',
            senderEmail: 'juan.perez@email.com',
            senderPhone: '+56 9 1234 5678',
            senderRole: 'client',
            recipientName: 'Carlos Rodríguez',
            recipientEmail: 'carlos.rodriguez@email.com',
            status: 'unread',
            priority: 'medium',
            type: 'inquiry',
            propertyTitle: 'Departamento Amoblado Centro',
            propertyId: 'prop1',
            attachments: [],
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            tags: ['visita', 'departamento'],
          },
          {
            id: '2',
            threadId: 'thread2',
            subject: 'Problema con el aire acondicionado',
            content: 'Buenos días, el aire acondicionado de la oficina no funciona correctamente. ¿Cuándo podrían enviar a un técnico?',
            senderName: 'María García',
            senderEmail: 'maria.garcia@empresa.cl',
            senderRole: 'tenant',
            recipientName: 'Carlos Rodríguez',
            recipientEmail: 'carlos.rodriguez@email.com',
            status: 'read',
            priority: 'high',
            type: 'maintenance',
            propertyTitle: 'Oficina Vitacura',
            propertyId: 'prop3',
            attachments: [
              { name: 'foto_problema.jpg', size: 2048000, type: 'image/jpeg' },
            ],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            readAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            tags: ['mantenimiento', 'urgente'],
          },
          {
            id: '3',
            threadId: 'thread3',
            subject: 'Confirmación contrato casa Las Condes',
            content: 'Estoy listo para firmar el contrato. ¿Qué documentos necesito presentar?',
            senderName: 'Pedro Silva',
            senderEmail: 'pedro.silva@email.com',
            senderRole: 'client',
            recipientName: 'Carlos Rodríguez',
            recipientEmail: 'carlos.rodriguez@email.com',
            status: 'replied',
            priority: 'medium',
            type: 'contract',
            propertyTitle: 'Casa Las Condes',
            propertyId: 'prop2',
            attachments: [],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            readAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
            repliedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
            tags: ['contrato', 'documentos'],
          },
          {
            id: '4',
            threadId: 'thread4',
            subject: 'Queja por ruido excesivo',
            content: 'Los vecinos del departamento de arriba hacen mucho ruido durante la noche. Necesito que se tome alguna acción al respecto.',
            senderName: 'Ana Martínez',
            senderEmail: 'ana.martinez@email.com',
            senderRole: 'tenant',
            recipientName: 'Carlos Rodríguez',
            recipientEmail: 'carlos.rodriguez@email.com',
            status: 'unread',
            priority: 'urgent',
            type: 'complaint',
            propertyTitle: 'Departamento Playa',
            propertyId: 'prop5',
            attachments: [],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            tags: ['queja', 'ruido', 'urgente'],
          },
          {
            id: '5',
            threadId: 'thread5',
            subject: 'Información sobre local comercial',
            content: 'Me gustaría recibir más información sobre el local comercial en Apoquindo. ¿Cuáles son las condiciones de arrendamiento?',
            senderName: 'Roberto López',
            senderEmail: 'roberto.lopez@negocio.cl',
            senderRole: 'client',
            recipientName: 'Carlos Rodríguez',
            recipientEmail: 'carlos.rodriguez@email.com',
            status: 'read',
            priority: 'low',
            type: 'inquiry',
            propertyTitle: 'Local Comercial',
            propertyId: 'prop4',
            attachments: [],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            readAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
            tags: ['comercial', 'información'],
          },
          {
            id: '6',
            threadId: 'thread6',
            subject: 'Solicitud de aumento de cuota',
            content: 'Debido a la inflación y mejoras realizadas en la propiedad, solicitamos un aumento del 10% en la cuota de arriendo.',
            senderName: 'Laura Fernández',
            senderEmail: 'laura.fernandez@email.com',
            senderRole: 'owner',
            recipientName: 'Carlos Rodríguez',
            recipientEmail: 'carlos.rodriguez@email.com',
            status: 'unread',
            priority: 'medium',
            type: 'general',
            propertyTitle: 'Casa Familiar La Reina',
            propertyId: 'prop6',
            attachments: [
              { name: 'presupuesto_mejoras.pdf', size: 1024000, type: 'application/pdf' },
              { name: 'informe_mercado.pdf', size: 512000, type: 'application/pdf' },
            ],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            tags: ['aumento', 'propietario'],
          },
        ];

        // Mock conversations
        const mockConversations: Conversation[] = [
          {
            id: 'conv1',
            participants: [
              { name: 'Juan Pérez', email: 'juan.perez@email.com', role: 'client' },
              { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@email.com', role: 'broker' },
            ],
            lastMessage: 'Perfecto, nos vemos mañana a las 10:00',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            unreadCount: 0,
            propertyTitle: 'Departamento Amoblado Centro',
            status: 'active',
          },
          {
            id: 'conv2',
            participants: [
              { name: 'María García', email: 'maria.garcia@empresa.cl', role: 'tenant' },
              { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@email.com', role: 'broker' },
            ],
            lastMessage: 'El técnico llegará mañana en la tarde',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            unreadCount: 2,
            propertyTitle: 'Oficina Vitacura',
            status: 'active',
          },
          {
            id: 'conv3',
            participants: [
              { name: 'Pedro Silva', email: 'pedro.silva@email.com', role: 'client' },
              { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@email.com', role: 'broker' },
            ],
            lastMessage: 'Gracias por la información',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
            unreadCount: 0,
            propertyTitle: 'Casa Las Condes',
            status: 'active',
          },
        ];

        setMessages(mockMessages);
        setConversations(mockConversations);

        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const messageStats = mockMessages.reduce((acc, message) => {
          acc.total++;
          
          if (message.status === 'unread') {
            acc.unread++;
          }
          
          const messageDate = new Date(message.createdAt);
          if (messageDate >= today) {
            acc.today++;
          }
          if (messageDate >= today && messageDate <= weekFromNow) {
            acc.thisWeek++;
          }
          
          if (message.priority === 'urgent') {
            acc.urgent++;
          }
          
          if (message.status === 'replied') {
            acc.replied++;
          }
          
          if (message.status === 'archived') {
            acc.archived++;
          }
          
          return acc;
        }, {
          total: 0,
          unread: 0,
          today: 0,
          thisWeek: 0,
          urgent: 0,
          replied: 0,
          archived: 0,
        } as MessageStats);

        setStats(messageStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading messages:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadMessages();
  }, []);

  const markAsRead = async (messageId: string) => {
    setMessages(prev => prev.map(message => 
      message.id === messageId 
        ? { ...message, status: 'read' as const, readAt: new Date().toISOString() }
        : message,
    ));
  };

  const markAllAsRead = async () => {
    setMessages(prev => prev.map(message => 
      message.status === 'unread' 
        ? { ...message, status: 'read' as const, readAt: new Date().toISOString() }
        : message,
    ));
  };

  const replyToMessage = async (messageId: string) => {
    setMessages(prev => prev.map(message => 
      message.id === messageId 
        ? { ...message, status: 'replied' as const, repliedAt: new Date().toISOString() }
        : message,
    ));
  };

  const archiveMessage = async (messageId: string) => {
    setMessages(prev => prev.map(message => 
      message.id === messageId 
        ? { ...message, status: 'archived' as const }
        : message,
    ));
  };

  const deleteMessage = async (messageId: string) => {
    setMessages(prev => prev.filter(message => message.id !== messageId));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client':
        return <UserIcon className="w-4 h-4" />;
      case 'owner':
        return <Building className="w-4 h-4" />;
      case 'tenant':
        return <UserIcon className="w-4 h-4" />;
      case 'admin':
        return <Star className="w-4 h-4" />;
      case 'broker':
        return <UserIcon className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'read':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'replied':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'archived':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge className="bg-blue-100 text-blue-800">No leído</Badge>;
      case 'read':
        return <Badge className="bg-gray-100 text-gray-800">Leído</Badge>;
      case 'replied':
        return <Badge className="bg-green-100 text-green-800">Respondido</Badge>;
      case 'archived':
        return <Badge className="bg-yellow-100 text-yellow-800">Archivado</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inquiry':
        return <MessageSquare className="w-4 h-4" />;
      case 'contract':
        return <FileText className="w-4 h-4" />;
      case 'maintenance':
        return <AlertTriangle className="w-4 h-4" />;
      case 'complaint':
        return <AlertTriangle className="w-4 h-4" />;
      case 'general':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
return '0 B';
}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredMessages = messages.filter(message => {
    const matchesFilter = filter === 'all' || message.status === filter || message.priority === filter || message.type === filter;
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (message.propertyTitle && message.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Mensajes"
      subtitle="Gestiona todas tus comunicaciones"
      notificationCount={stats.unread}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centro de Mensajes</h1>
            <p className="text-gray-600">Gestiona todas tus comunicaciones</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm">
              <Send className="w-4 h-4 mr-2" />
              Nuevo Mensaje
            </Button>
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar todos como leídos
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600">Total Mensajes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
                <p className="text-xs text-gray-600">No leídos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                <p className="text-xs text-gray-600">Urgentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
                <p className="text-xs text-gray-600">Respondidos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={view === 'messages' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('messages')}
          >
            Mensajes
          </Button>
          <Button
            variant={view === 'conversations' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('conversations')}
          >
            Conversaciones
          </Button>
        </div>

        {view === 'messages' && (
          <>
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar mensajes..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Todas</option>
                  <option value="unread">No leídos</option>
                  <option value="read">Leídos</option>
                  <option value="replied">Respondidos</option>
                  <option value="urgent">Urgentes</option>
                  <option value="inquiry">Consultas</option>
                  <option value="contract">Contratos</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="complaint">Quejas</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>

            {/* Messages List */}
            <div className="space-y-4">
              {filteredMessages.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No se encontraron mensajes</p>
                      <p className="text-sm text-gray-400">Intenta ajustar tus filtros de búsqueda</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredMessages.map((message) => (
                  <Card 
                    key={message.id} 
                    className={`border-l-4 ${getStatusColor(message.status)} ${
                      message.status === 'unread' ? 'shadow-md' : ''
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${getStatusColor(message.status)}`}>
                            {getTypeIcon(message.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{message.subject}</h3>
                              {getStatusBadge(message.status)}
                              <Badge className={getPriorityColor(message.priority)}>
                                {message.priority === 'urgent' ? 'Urgente' : 
                                 message.priority === 'high' ? 'Alta' : 
                                 message.priority === 'medium' ? 'Media' : 'Baja'}
                              </Badge>
                              {message.propertyTitle && (
                                <Badge variant="outline" className="text-xs">
                                  <Building className="w-3 h-3 mr-1" />
                                  {message.propertyTitle}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-2">
                                {getRoleIcon(message.senderRole)}
                                <span>{message.senderName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {message.senderRole === 'client' ? 'Cliente' :
                                   message.senderRole === 'owner' ? 'Propietario' :
                                   message.senderRole === 'tenant' ? 'Inquilino' :
                                   message.senderRole === 'admin' ? 'Admin' : 'Corredor'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatRelativeTime(message.createdAt)}</span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {message.content}
                            </p>
                            
                            {message.attachments.length > 0 && (
                              <div className="flex items-center gap-2 mb-3">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {message.attachments.length} archivo(s) adjunto(s)
                                </span>
                              </div>
                            )}
                            
                            {message.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {message.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {message.senderPhone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {message.senderPhone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {message.senderEmail}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {message.status === 'unread' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markAsRead(message.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {message.status !== 'replied' && (
                            <Button 
                              size="sm" 
                              onClick={() => replyToMessage(message.id)}
                            >
                              <Reply className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => archiveMessage(message.id)}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteMessage(message.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {view === 'conversations' && (
          <div className="space-y-4">
            {conversations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay conversaciones activas</p>
                    <p className="text-sm text-gray-400">Inicia una nueva conversación</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              conversations.map((conversation) => (
                <Card key={conversation.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {conversation.participants.find(p => p.role !== 'broker')?.name}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-blue-100 text-blue-800">
                                {conversation.unreadCount} nuevo(s)
                              </Badge>
                            )}
                            {conversation.propertyTitle && (
                              <Badge variant="outline" className="text-xs">
                                <Building className="w-3 h-3 mr-1" />
                                {conversation.propertyTitle}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {conversation.lastMessage}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatRelativeTime(conversation.lastMessageTime)}</span>
                            <span>
                              {conversation.participants.length} participantes
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm">
                          <Reply className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </EnhancedDashboardLayout>
  );
}
