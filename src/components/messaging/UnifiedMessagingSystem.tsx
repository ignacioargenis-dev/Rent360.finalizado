'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  MessageCircle,
  Send,
  Phone,
  Mail,
  Search,
  Paperclip,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Flag,
  Upload,
  X,
  Users,
  User,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderSimple';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  participantAvatar?: string;
  lastMessage: {
    content: string;
    timestamp: string;
    senderName: string;
  };
  unreadCount: number;
  status: 'active' | 'archived';
  propertyAddress?: string;
  propertyTitle?: string;
}

interface UnifiedMessagingSystemProps {
  title?: string;
  subtitle?: string;
  showNewChatButton?: boolean;
  showCallButton?: boolean;
  showEmailButton?: boolean;
  showResolveButton?: boolean;
  onResolve?: (conversationId: string) => void;
  onCall?: (conversationId: string) => void;
  onEmail?: (conversationId: string) => void;
}

export default function UnifiedMessagingSystem({
  title = 'Mensajes',
  subtitle = 'Comunícate con inquilinos, proveedores y el equipo',
  showNewChatButton = true,
  showCallButton = true,
  showEmailButton = true,
  showResolveButton = false,
  onResolve,
  onCall,
  onEmail,
}: UnifiedMessagingSystemProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados principales
  const [loading, setLoading] = useState(true); // Solo para carga inicial
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Bandera para diferenciar carga inicial
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Estados para funcionalidades adicionales
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Estados para nuevo chat
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [recipientType, setRecipientType] = useState<
    'broker' | 'owner' | 'tenant' | 'provider' | 'maintenance' | 'runner' | 'support' | ''
  >('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [availableRecipients, setAvailableRecipients] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [newChatSubject, setNewChatSubject] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const [searchingRecipients, setSearchingRecipients] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para polling inteligente basado en actividad
  const [lastMessageTime, setLastMessageTime] = useState<number>(Date.now());
  const [isConversationActive, setIsConversationActive] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({
    totalConversations: 0,
    unreadMessages: 0,
    activeToday: 0,
    avgResponseTime: '2.5h',
  });

  useEffect(() => {
    // Carga inicial (con spinner)
    loadPageData(false);

    // Check if we need to create a new conversation
    const isNewConversation = searchParams?.get('new') === 'true';
    if (isNewConversation) {
      handleNewConversation();
    }
  }, [searchParams]);

  // Polling inteligente: Solo actualiza cuando hay actividad reciente
  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    // Determinar si la conversación está activa (mensajes recientes en los últimos 2 minutos)
    const timeSinceLastMessage = Date.now() - lastMessageTime;
    const isActive = timeSinceLastMessage < 120000; // 2 minutos
    setIsConversationActive(isActive);

    // Intervalo de polling basado en actividad:
    // - Si hay actividad reciente: cada 3 segundos (conversación fluida)
    // - Si no hay actividad: cada 30 segundos (mantener sincronizado pero sin saturar)
    const pollInterval = isActive ? 3000 : 30000;

    const intervalId = setInterval(() => {
      // Refresh silencioso (sin spinner, sin interrumpir la experiencia)
      loadPageData(true);
      if (selectedConversation) {
        loadConversationMessages(selectedConversation.participantId);
      }
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [selectedConversation, lastMessageTime]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadPageData = async (silent = false) => {
    try {
      // Solo mostrar loading en carga inicial, no en refreshes silenciosos
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      // Cargar conversaciones
      const conversationsResponse = await fetch('/api/messages/conversations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!conversationsResponse.ok) {
        throw new Error(
          `Error ${conversationsResponse.status}: ${conversationsResponse.statusText}`
        );
      }

      const conversationsData = await conversationsResponse.json();

      if (conversationsData.success && conversationsData.data) {
        // Transformar datos de la API al formato esperado
        const transformedConversations: Conversation[] = conversationsData.data.map(
          (conv: any) => ({
            id: conv.participant.id,
            participantId: conv.participant.id,
            participantName: conv.participant.name || 'Usuario desconocido',
            participantRole: conv.participant.role || 'USER',
            participantAvatar: conv.participant.avatar,
            lastMessage: {
              content: conv.lastMessage?.content || 'Sin contenido',
              timestamp: conv.lastMessage?.timestamp || new Date().toISOString(),
              senderName: conv.participant.name || 'Usuario desconocido',
            },
            unreadCount: conv.unreadCount || 0,
            status: 'active',
            propertyAddress: conv.property?.address || 'Dirección no disponible',
            propertyTitle: conv.property?.title || 'Propiedad',
          })
        );

        setConversations(transformedConversations);

        // Calcular estadísticas
        const totalUnread = transformedConversations.reduce(
          (sum, conv) => sum + conv.unreadCount,
          0
        );
        const activeToday = transformedConversations.filter(conv => {
          const lastActivity = new Date(conv.lastMessage.timestamp);
          const today = new Date();
          return lastActivity.toDateString() === today.toDateString();
        }).length;

        setStats({
          totalConversations: transformedConversations.length,
          unreadMessages: totalUnread,
          activeToday,
          avgResponseTime: '2.5h',
        });

        // Seleccionar la primera conversación si hay alguna
        if (transformedConversations.length > 0 && !selectedConversation) {
          setSelectedConversation(transformedConversations[0] || null);
        }
      } else {
        setConversations([]);
      }
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Solo mostrar error si no es un refresh silencioso
      if (!silent) {
        setError('Error al cargar los datos');
      }
    } finally {
      // Solo actualizar loading si no es un refresh silencioso
      if (!silent) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  };

  const handleNewConversation = () => {
    try {
      // Get recipient data from sessionStorage
      const recipientDataStr = sessionStorage.getItem('newMessageRecipient');
      if (!recipientDataStr) {
        logger.warn('No recipient data found in sessionStorage');
        return;
      }

      const recipientData = JSON.parse(recipientDataStr);

      // Create a new conversation object
      const newConversation: Conversation = {
        id: `new_${Date.now()}`,
        participantId: recipientData.id,
        participantName: recipientData.name,
        participantRole: recipientData.type,
        lastMessage: {
          content: `Nueva conversación sobre: ${recipientData.propertyTitle || 'servicio'}`,
          timestamp: new Date().toISOString(),
          senderName: user?.name || 'Usuario',
        },
        unreadCount: 0,
        status: 'active',
        propertyAddress: recipientData.propertyAddress,
        propertyTitle: recipientData.propertyTitle,
      };

      // Add to conversations list
      setConversations(prev => [newConversation, ...prev]);

      // Select the new conversation
      setSelectedConversation(newConversation);

      // Clear sessionStorage
      sessionStorage.removeItem('newMessageRecipient');

      // Update URL to remove the new parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('new');
      window.history.replaceState({}, '', newUrl.toString());
    } catch (error) {
      logger.error('Error handling new conversation:', { error });
    }
  };

  // Función para buscar destinatarios disponibles
  const searchRecipients = async (searchTerm: string, type: string) => {
    if (!searchTerm.trim() || !type) {
      return;
    }

    try {
      setSearchingRecipients(true);
      const response = await fetch(
        `/api/users/search?query=${encodeURIComponent(searchTerm)}&role=${type}&limit=20`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableRecipients(data.users || []);
        } else {
          setAvailableRecipients([]);
        }
      } else {
        setAvailableRecipients([]);
      }
    } catch (error) {
      logger.error('Error searching recipients:', error);
      setAvailableRecipients([]);
    } finally {
      setSearchingRecipients(false);
    }
  };

  // Función para crear un nuevo chat
  const createNewChat = async () => {
    if (!selectedRecipient || !newChatMessage.trim()) {
      return;
    }

    try {
      setCreatingChat(true);

      // Crear el mensaje inicial
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: selectedRecipient.id,
          content: newChatMessage,
          subject: newChatSubject || `Nueva conversación con ${selectedRecipient.name}`,
          type: 'direct',
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Crear la conversación local
        const newConversation: Conversation = {
          id: `chat_${selectedRecipient.id}_${Date.now()}`,
          participantId: selectedRecipient.id,
          participantName: selectedRecipient.name,
          participantRole: selectedRecipient.role,
          participantAvatar: selectedRecipient.avatar,
          lastMessage: {
            content: newChatMessage,
            timestamp: new Date().toISOString(),
            senderName: user?.name || 'Tú',
          },
          unreadCount: 0,
          status: 'active',
        };

        // Agregar a la lista de conversaciones
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation);

        // Cerrar el modal y resetear estados
        setShowNewChatDialog(false);
        setSelectedRecipient(null);
        setNewChatSubject('');
        setNewChatMessage('');
        setRecipientType('');
        setRecipientSearch('');
        setAvailableRecipients([]);

        // Mostrar mensaje de éxito
        logger.info('Nuevo chat creado exitosamente');
      } else {
        const error = await response.json();
        logger.error('Error creando chat:', error);
      }
    } catch (error) {
      logger.error('Error creando nuevo chat:', error);
    } finally {
      setCreatingChat(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?receiverId=${conversationId}&limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.messages) {
        const transformedMessages: Message[] = data.messages.map((message: any) => ({
          id: message.id,
          content: message.content || 'Sin contenido',
          senderId: message.senderId || 'unknown',
          senderName: message.sender?.name || 'Usuario desconocido',
          senderRole: message.sender?.role || 'USER',
          timestamp: message.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          isRead: message.isRead || false,
          type: 'text',
        }));

        // Si hay mensajes nuevos, actualizar el timestamp de última actividad
        if (transformedMessages.length > messages.length) {
          setLastMessageTime(Date.now());
        }

        setMessages(transformedMessages);
      }
    } catch (error) {
      logger.error('Error loading conversation messages:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) {
      return;
    }

    try {
      setSendingMessage(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newMessage,
          receiverId: selectedConversation.participantId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      setNewMessage('');

      // Marcar actividad reciente para activar polling rápido
      setLastMessageTime(Date.now());

      // ✅ INMEDIATO: Recargar mensajes de la conversación actual (silencioso)
      if (selectedConversation) {
        await loadConversationMessages(selectedConversation.participantId);
      }

      // ✅ INMEDIATO: Recargar lista de conversaciones (silencioso - no interrumpe la experiencia)
      await loadPageData(true);
    } catch (error) {
      logger.error('Error sending message:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Función para manejar el reporte de usuario
  const handleReportUser = async () => {
    if (!selectedConversation || !reportReason || !reportDescription.trim()) {
      return;
    }

    if (reportDescription.length < 10) {
      alert('La descripción debe tener al menos 10 caracteres');
      return;
    }

    try {
      setSubmittingReport(true);
      const response = await fetch('/api/messages/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reportedUserId: selectedConversation.participantId,
          reason: reportReason,
          description: reportDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Error enviando reporte');
      }

      alert('Reporte enviado exitosamente. Nuestro equipo lo revisará pronto.');
      setShowReportDialog(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      logger.error('Error reporting user:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error enviando el reporte. Por favor intenta de nuevo.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Función para manejar la selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tamaño del archivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Tamaño máximo: 10MB');
        return;
      }

      setSelectedFile(file);
      // TODO: Implementar upload de archivo
      alert(`Archivo seleccionado: ${file.name}\n(Funcionalidad de upload en desarrollo)`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadConversationMessages(conversation.participantId);

    // Marcar mensajes como leídos
    await markMessagesAsRead(conversation.participantId);
  };

  const markMessagesAsRead = async (senderId: string) => {
    try {
      const response = await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ senderId }),
      });

      if (response.ok) {
        // Recargar conversaciones para actualizar contador
        await loadPageData(true);
      }
    } catch (error) {
      logger.error('Error marking messages as read:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'tenant':
      case 'inquilino':
        return 'bg-green-100 text-green-800';
      case 'owner':
      case 'propietario':
        return 'bg-blue-100 text-blue-800';
      case 'provider':
      case 'proveedor':
        return 'bg-purple-100 text-purple-800';
      case 'broker':
      case 'corredor':
        return 'bg-orange-100 text-orange-800';
      case 'admin':
      case 'administrador':
        return 'bg-red-100 text-red-800';
      case 'support':
      case 'soporte':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'tenant':
        return 'Inquilino';
      case 'owner':
        return 'Propietario';
      case 'provider':
        return 'Proveedor';
      case 'broker':
        return 'Corredor';
      case 'admin':
        return 'Administrador';
      case 'support':
        return 'Soporte';
      default:
        return role;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Ahora';
    }
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes}m`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Hace ${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays}d`;
  };

  const filteredConversations = conversations.filter(
    conv =>
      conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.propertyAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando mensajes...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>
        {showNewChatButton && (
          <Button onClick={() => setShowNewChatDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Chat
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversaciones</p>
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">No Leídos</p>
                <p className="text-2xl font-bold">{stats.unreadMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Activos Hoy</p>
                <p className="text-2xl font-bold">{stats.activeToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tiempo Respuesta</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel - Conversations */}
        <Card className="w-1/3 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar conversa..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.participantAvatar} />
                      <AvatarFallback>
                        {conversation.participantName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {conversation.participantName}
                        </p>
                        <Badge
                          className={`text-xs ${getRoleBadgeColor(conversation.participantRole)}`}
                        >
                          {getRoleDisplayName(conversation.participantRole)}
                        </Badge>
                      </div>

                      <p className="text-xs text-gray-500 mb-1">
                        {formatTimeAgo(conversation.lastMessage.timestamp)}
                      </p>

                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage.content}
                      </p>

                      {conversation.propertyAddress && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.propertyAddress}
                          </p>
                        </div>
                      )}
                    </div>

                    {conversation.unreadCount > 0 && (
                      <div className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Chat */}
        <Card className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.participantAvatar} />
                      <AvatarFallback>
                        {selectedConversation.participantName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium">{selectedConversation.participantName}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs ${getRoleBadgeColor(selectedConversation.participantRole)}`}
                        >
                          {getRoleDisplayName(selectedConversation.participantRole)}
                        </Badge>
                        {selectedConversation.propertyAddress && (
                          <div className="flex items-center gap-1">
                            <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-500">
                              {selectedConversation.propertyAddress}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {showCallButton && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCall?.(selectedConversation.id)}
                        title="Llamar"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    {showEmailButton && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEmail?.(selectedConversation.id)}
                        title="Enviar email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReportDialog(true)}
                      title="Reportar usuario"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                    {showResolveButton && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onResolve?.(selectedConversation.id)}
                      >
                        Resuelta
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages - Con scroll mejorado (mensajes antiguos arriba) */}
              <CardContent className="flex-1 overflow-y-auto p-4 max-h-[500px]">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay mensajes en esta conversación</p>
                      <p className="text-sm">Envía el primer mensaje</p>
                    </div>
                  ) : (
                    messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{message.senderName}</span>
                            <span className="text-xs opacity-75">
                              {formatTimeAgo(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    title="Adjuntar archivo"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Escribe tu mensaje..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {sendingMessage ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-600">
                  Elige una conversación del panel izquierdo para comenzar a chatear.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Diálogo de Reporte de Usuario */}
      {showReportDialog && selectedConversation && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setShowReportDialog(false)}
        >
          <Card className="w-full max-w-md bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Reportar Usuario
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReportDialog(false)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-sm text-gray-700">
                    Estás reportando a:{' '}
                    <strong className="text-gray-900">
                      {selectedConversation.participantName}
                    </strong>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Motivo del reporte *
                  </label>
                  <select
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Selecciona un motivo</option>
                    <option value="spam">Spam</option>
                    <option value="harassment">Acoso</option>
                    <option value="inappropriate_content">Contenido inapropiado</option>
                    <option value="scam">Estafa</option>
                    <option value="fake_profile">Perfil falso</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Descripción (mínimo 10 caracteres) *
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={e => setReportDescription(e.target.value)}
                    placeholder="Describe el problema con el mayor detalle posible..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[120px] bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reportDescription.length}/1000 caracteres
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowReportDialog(false)}
                    className="flex-1 border-gray-300 hover:bg-gray-50"
                    disabled={submittingReport}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleReportUser}
                    disabled={!reportReason || reportDescription.length < 10 || submittingReport}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReport ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Flag className="h-4 w-4 mr-2" />
                        Enviar Reporte
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para Nuevo Chat */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Iniciar Nueva Conversación
            </DialogTitle>
            <DialogDescription>
              Selecciona el tipo de usuario y busca a la persona con la que quieres conversar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selección del tipo de destinatario */}
            <div>
              <Label htmlFor="recipient-type">Tipo de Usuario</Label>
              <select
                id="recipient-type"
                value={recipientType}
                onChange={e => {
                  setRecipientType(e.target.value as any);
                  setRecipientSearch('');
                  setAvailableRecipients([]);
                  setSelectedRecipient(null);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecciona el tipo</option>
                <option value="broker">Corredor</option>
                <option value="owner">Propietario</option>
                <option value="tenant">Inquilino</option>
                <option value="provider">Proveedor</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="runner">Runner</option>
                <option value="support">Soporte</option>
              </select>
            </div>

            {/* Búsqueda de destinatarios */}
            {recipientType && (
              <div>
                <Label htmlFor="recipient-search">Buscar Usuario</Label>
                <Input
                  id="recipient-search"
                  type="text"
                  placeholder="Ingresa nombre, email o ID..."
                  value={recipientSearch}
                  onChange={e => {
                    setRecipientSearch(e.target.value);
                    if (e.target.value.length >= 2) {
                      searchRecipients(e.target.value, recipientType);
                    } else {
                      setAvailableRecipients([]);
                    }
                  }}
                  className="mt-1"
                />
              </div>
            )}

            {/* Lista de destinatarios disponibles */}
            {availableRecipients.length > 0 && (
              <div>
                <Label>Usuarios Encontrados</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md mt-1">
                  {availableRecipients.map(recipient => (
                    <div
                      key={recipient.id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                        selectedRecipient?.id === recipient.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedRecipient(recipient)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={recipient.avatar} />
                          <AvatarFallback>
                            {recipient.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{recipient.name}</p>
                          <p className="text-xs text-gray-600">{recipient.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {recipient.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estado de búsqueda */}
            {searchingRecipients && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Buscando usuarios...
              </div>
            )}

            {/* Mensaje inicial */}
            {selectedRecipient && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    Conversación con: <strong>{selectedRecipient.name}</strong>
                  </p>
                </div>

                <div>
                  <Label htmlFor="chat-subject">Asunto (opcional)</Label>
                  <Input
                    id="chat-subject"
                    placeholder="Asunto de la conversación"
                    value={newChatSubject}
                    onChange={e => setNewChatSubject(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="chat-message">Mensaje Inicial *</Label>
                  <Textarea
                    id="chat-message"
                    placeholder="Escribe tu mensaje inicial..."
                    value={newChatMessage}
                    onChange={e => setNewChatMessage(e.target.value)}
                    rows={3}
                    className="mt-1 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewChatDialog(false);
                setSelectedRecipient(null);
                setNewChatSubject('');
                setNewChatMessage('');
                setRecipientType('');
                setRecipientSearch('');
                setAvailableRecipients([]);
              }}
              disabled={creatingChat}
            >
              Cancelar
            </Button>
            <Button
              onClick={createNewChat}
              disabled={!selectedRecipient || !newChatMessage.trim() || creatingChat}
            >
              {creatingChat ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Iniciar Conversación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
