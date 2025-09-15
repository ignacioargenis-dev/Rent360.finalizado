'use client';

import { logger } from '@/lib/logger-edge';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, 
  Search, 
  Send,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  User as UserIcon, Building, Calendar,
  Filter,
  Plus,
  Reply,
  Paperclip,
  Image,
  FileText } from 'lucide-react';
import { User } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

interface Message {
  id: string;
  clientId: string;
  clientName: string;
  clientType: 'buyer' | 'tenant' | 'owner';
  subject: string;
  content: string;
  type: 'inquiry' | 'appointment' | 'follow_up' | 'general';
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  lastReply?: string;
  hasAttachments: boolean;
  relatedProperty?: string;
}

interface MessageStats {
  totalMessages: number;
  unreadMessages: number;
  urgentMessages: number;
  repliedToday: number;
  averageResponseTime: string;
}

export default function RunnerMessages() {

  const [user, setUser] = useState<User | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [stats, setStats] = useState<MessageStats>({
    totalMessages: 0,
    unreadMessages: 0,
    urgentMessages: 0,
    repliedToday: 0,
    averageResponseTime: '2 horas',
  });

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [typeFilter, setTypeFilter] = useState('all');

  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const [replyContent, setReplyContent] = useState('');

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

    loadUserData();
  }, []);

  useEffect(() => {
    const loadMessagesData = async () => {
      try {
        // Simulate API call - in real implementation, this would fetch from /api/runner/messages
        const mockMessages: Message[] = [
          {
            id: '1',
            clientId: '1',
            clientName: 'Laura Silva',
            clientType: 'tenant',
            subject: 'Consulta sobre departamento en Las Condes',
            content: 'Hola, estoy interesada en el departamento que visitamos ayer. Me gustaría saber si hay flexibilidad en el precio y si el arriendo incluye estacionamiento.',
            type: 'inquiry',
            status: 'unread',
            priority: 'high',
            createdAt: '2024-03-16T10:30:00',
            hasAttachments: false,
            relatedProperty: 'Departamento Amoblado Las Condes',
          },
          {
            id: '2',
            clientId: '2',
            clientName: 'Roberto Méndez',
            clientType: 'buyer',
            subject: 'Confirmación visita casa en Ñuñoa',
            content: 'Buenas tardes, confirmo que asistiré a la visita de la casa en Ñuñoa mañana a las 15:00 hrs. ¿Necesito llevar algo en particular?',
            type: 'appointment',
            status: 'read',
            priority: 'medium',
            createdAt: '2024-03-15T16:45:00',
            lastReply: '2024-03-15T17:20:00',
            hasAttachments: true,
            relatedProperty: 'Casa Familiar Ñuñoa',
          },
          {
            id: '3',
            clientId: '3',
            clientName: 'Carmen Soto',
            clientType: 'owner',
            subject: 'Solicitud de nuevas fotografías',
            content: 'Hola, me gustaría que tomaran nuevas fotos de mi propiedad. Las actuales no muestran bien la iluminación natural de las mañanas.',
            type: 'follow_up',
            status: 'replied',
            priority: 'low',
            createdAt: '2024-03-14T09:15:00',
            lastReply: '2024-03-14T11:30:00',
            hasAttachments: false,
            relatedProperty: 'Oficina Centro Santiago',
          },
        ];

        setMessages(mockMessages);

        // Calculate stats
        const unreadMessages = mockMessages.filter(m => m.status === 'unread').length;
        const urgentMessages = mockMessages.filter(m => m.priority === 'high').length;
        const today = new Date().toDateString();
        const repliedToday = mockMessages.filter(m => 
          m.lastReply && new Date(m.lastReply).toDateString() === today,
        ).length;

        setStats({
          totalMessages: mockMessages.length,
          unreadMessages,
          urgentMessages,
          repliedToday,
          averageResponseTime: '2 horas',
        });
      } catch (error) {
        logger.error('Error loading messages data:', { error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    };

    loadMessagesData();
  }, []);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'inquiry':
        return <Badge className="bg-blue-100 text-blue-800">Consulta</Badge>;
      case 'appointment':
        return <Badge className="bg-green-100 text-green-800">Cita</Badge>;
      case 'follow_up':
        return <Badge className="bg-yellow-100 text-yellow-800">Seguimiento</Badge>;
      case 'general':
        return <Badge className="bg-gray-100 text-gray-800">General</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge className="bg-red-100 text-red-800">No leído</Badge>;
      case 'read':
        return <Badge className="bg-yellow-100 text-yellow-800">Leído</Badge>;
      case 'replied':
        return <Badge className="bg-green-100 text-green-800">Respondido</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archivado</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getClientTypeBadge = (type: string) => {
    switch (type) {
      case 'buyer':
        return <Badge className="bg-blue-100 text-blue-800">Comprador</Badge>;
      case 'tenant':
        return <Badge className="bg-green-100 text-green-800">Inquilino</Badge>;
      case 'owner':
        return <Badge className="bg-purple-100 text-purple-800">Propietario</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
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
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || message.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSendMessage = async () => {
    if (!selectedMessage || !replyContent.trim()) {
return;
}

    try {
      // Simulate sending message
      const updatedMessages = messages.map(msg => 
        msg.id === selectedMessage.id 
          ? { ...msg, status: 'replied' as const, lastReply: new Date().toISOString() }
          : msg,
      );
      setMessages(updatedMessages);
      
      setReplyContent('');
      setSelectedMessage(null);
      
      // Show success message
      alert('Mensaje enviado correctamente');
    } catch (error) {
      logger.error('Error sending message:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  if (loading) {
    return (
      <EnhancedDashboardLayout
        user={user}
        title="Mensajes"
        subtitle="Gestión de mensajes con clientes"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mensajes...</p>
          </div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Mensajes"
      subtitle="Gestión de mensajes con clientes"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Mensajes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">No Leídos</p>
                  <p className="text-2xl font-bold text-red-600">{stats.unreadMessages}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgentes</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.urgentMessages}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Respondidos Hoy</p>
                  <p className="text-2xl font-bold text-green-600">{stats.repliedToday}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo Respuesta</p>
                  <p className="text-lg font-bold text-purple-600">{stats.averageResponseTime}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Messages List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Bandeja de Entrada</span>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Mensaje
                </Button>
              </CardTitle>
              <CardDescription>
                Mensajes recibidos de clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar mensajes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="inquiry">Consulta</SelectItem>
                      <SelectItem value="appointment">Cita</SelectItem>
                      <SelectItem value="follow_up">Seguimiento</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="unread">No leídos</SelectItem>
                      <SelectItem value="read">Leídos</SelectItem>
                      <SelectItem value="replied">Respondidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedMessage?.id === message.id ? 'border-blue-500 bg-blue-50' : ''
                      } ${message.status === 'unread' ? 'border-l-4 border-l-red-500' : ''}`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{message.clientName}</span>
                            {getClientTypeBadge(message.clientType)}
                            {getPriorityBadge(message.priority)}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">{message.subject}</div>
                          <div className="text-xs text-gray-500">
                            {formatDateTime(message.createdAt)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(message.status)}
                          {getTypeBadge(message.type)}
                          {message.hasAttachments && (
                            <Paperclip className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-2">
                        {message.content}
                      </div>
                      {message.relatedProperty && (
                        <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {message.relatedProperty}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {filteredMessages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron mensajes con los filtros seleccionados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Detail */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedMessage ? 'Detalles del Mensaje' : 'Selecciona un Mensaje'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMessage ? (
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{selectedMessage.clientName}</span>
                        {getClientTypeBadge(selectedMessage.clientType)}
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(selectedMessage.priority)}
                        {getStatusBadge(selectedMessage.status)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{selectedMessage.subject}</div>
                    <div className="text-xs text-gray-500 mb-2">
                      {formatDateTime(selectedMessage.createdAt)}
                    </div>
                    {selectedMessage.relatedProperty && (
                      <div className="text-sm text-blue-600 flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {selectedMessage.relatedProperty}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Mensaje:</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      {selectedMessage.content}
                    </div>
                  </div>

                  {selectedMessage.lastReply && (
                    <div>
                      <h4 className="font-medium mb-2">Última respuesta:</h4>
                      <div className="bg-blue-50 p-3 rounded-lg text-sm">
                        {formatDateTime(selectedMessage.lastReply)}
                      </div>
                    </div>
                  )}

                  {selectedMessage.hasAttachments && (
                    <div>
                      <h4 className="font-medium mb-2">Archivos adjuntos:</h4>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Documento.pdf
                        </Button>
                        <Button size="sm" variant="outline">
                          <Image className="w-4 h-4 mr-2" />
                          Foto.jpg
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Responder:</h4>
                    <Textarea
                      placeholder="Escribe tu respuesta..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button onClick={handleSendMessage} disabled={!replyContent.trim()}>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Respuesta
                      </Button>
                      <Button variant="outline">
                        <Paperclip className="w-4 h-4 mr-2" />
                        Adjuntar Archivo
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      Llamar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Agendar Cita
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecciona un mensaje para ver los detalles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </EnhancedDashboardLayout>
  );
}
