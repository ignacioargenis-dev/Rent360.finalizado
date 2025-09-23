'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Image as ImageIcon,
  File,
  User,
  Users,
  Settings,
  Archive,
  Trash2,
  Pin,
  Star,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Circle
} from 'lucide-react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { chatService, MessageType, ChatStatus, ChatConversation as ServiceChatConversation, ChatParticipant, ChatParticipantType, ChatMessage } from '@/lib/chat/chat-service';
import { logger } from '@/lib/logger';


export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<ServiceChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ServiceChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Obtener información del usuario
      const userResponse = await fetch('/api/auth/me');
      let userData = null;
      if (userResponse.ok) {
        const responseData = await userResponse.json();
        userData = responseData.user;
        setUser(userData);
      }

      // Obtener conversaciones del usuario si se obtuvo el usuario
      if (userData?.id) {
        const userConversations = await chatService.getUserConversations(userData.id);
        setConversations(userConversations);
      }

    } catch (error) {
      logger.error('Error cargando conversaciones:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const conversationMessages = await chatService.getConversationMessages(conversationId, user?.id);
      setMessages(conversationMessages);
    } catch (error) {
      logger.error('Error cargando mensajes:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      setSending(true);

      await chatService.sendMessage(
        selectedConversation.id,
        user.id,
        newMessage.trim(),
        MessageType.TEXT
      );

      setNewMessage('');

      // Recargar mensajes
      await loadMessages(selectedConversation.id);

      // Recargar conversaciones para actualizar lastMessage
      await loadData();

    } catch (error) {
      logger.error('Error enviando mensaje:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al enviar el mensaje. Por favor intenta nuevamente.');
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async (participantIds: string[], title: string) => {
    try {
      if (!user) return;

      const participants: ChatParticipant[] = [
        {
          userId: user.id,
          userType: (user.role as ChatParticipantType) || ChatParticipantType.TENANT,
          userName: user.name || user.email || `Usuario ${user.id.slice(-4)}`,
          joinedAt: new Date(),
          isOnline: true
        },
        ...participantIds.map(id => ({
          userId: id,
          userType: ChatParticipantType.TENANT, // Default to TENANT for new participants
          userName: `Usuario ${id.slice(-4)}`, // Mock name
          joinedAt: new Date(),
          isOnline: false
        }))
      ];

      const newConversation = await chatService.createConversation(title, participants);
      setConversations(prev => [newConversation, ...prev]);
      setShowNewChat(false);
      setSelectedConversation(newConversation);

    } catch (error) {
      logger.error('Error creando conversación:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al crear la conversación.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hoy';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }

    return messageDate.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });
  };

  const getMessageStatusIcon = (message: ChatMessage) => {
    if (!user?.id || message.senderId !== user.id) return null;

    if (message.isRead) {
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    }
    return <Check className="w-3 h-3 text-gray-400" />;
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.participants.some(p =>
      p.userName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Mensajes"
      subtitle="Gestiona tus conversaciones y mensajes"
    >
      <DashboardHeader
        user={user}
        title="💬 Mensajes"
        subtitle="Comunícate con proveedores y clientes"
      />

      <div className="container mx-auto px-4 py-6 max-w-7xl h-[calc(100vh-200px)]">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Sidebar de conversaciones */}
          <div className="col-span-4 bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
                <Button
                  size="sm"
                  onClick={() => setShowNewChat(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nuevo
                </Button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar conversaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="h-[calc(100%-120px)]">
              <div className="p-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">
                      {searchQuery ? 'No se encontraron conversaciones' : 'No tienes conversaciones aún'}
                    </p>
                    {!searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setShowNewChat(true)}
                      >
                        Iniciar conversación
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {conversation.title.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 truncate">
                              {conversation.title}
                            </h3>
                            {conversation.lastMessage && (
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage?.content || 'Sin mensajes'}
                            </p>
                            {user && user.id && (conversation.unreadCount[user.id] ?? 0) > 0 && (
                              <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                                {conversation.unreadCount[user.id] ?? 0}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{conversation.participants.length} participantes</span>
                        {conversation.jobId && (
                          <>
                            <span>•</span>
                            <span>Trabajo #{conversation.jobId.slice(-4)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Área de chat */}
          <div className="col-span-8 bg-white rounded-lg shadow-sm border flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header del chat */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {selectedConversation.title.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-3 h-3" />
                          <span>{selectedConversation.participants.length} participantes</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Circle className="w-2 h-2 bg-green-500 rounded-full" />
                            <span>{selectedConversation.participants.filter(p => p.isOnline).length} en línea</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mensajes */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isOwn = message.senderId === user?.id;
                      const showDateSeparator = index === 0 ||
                        (index > 0 && formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp || message.timestamp));

                      return (
                        <div key={message.id}>
                          {showDateSeparator && (
                            <div className="flex items-center justify-center my-4">
                              <Badge variant="secondary" className="text-xs">
                                {formatDate(message.timestamp)}
                              </Badge>
                            </div>
                          )}

                          <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              {!isOwn && (
                                <div className="text-xs font-medium text-gray-600 mb-1">
                                  {message.senderName}
                                </div>
                              )}
                              <p className="text-sm">{message.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                                isOwn ? 'text-blue-200' : 'text-gray-500'
                              }`}>
                                <span>{formatTime(message.timestamp)}</span>
                                {getMessageStatusIcon(message)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input de mensaje */}
                <div className="p-4 border-t">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="min-h-[44px] max-h-32 resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {sending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Selecciona una conversación
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Elige una conversación del panel lateral para ver los mensajes
                  </p>
                  <Button onClick={() => setShowNewChat(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Iniciar nueva conversación
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para nueva conversación */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nueva Conversación</CardTitle>
              <CardDescription>
                Inicia una nueva conversación con proveedores o clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título de la conversación
                  </label>
                  <Input placeholder="Ej: Consulta sobre mantenimiento" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participantes
                  </label>
                  <Input placeholder="Buscar usuarios..." />
                  <div className="mt-2 text-xs text-gray-500">
                    Funcionalidad en desarrollo - pronto podrás seleccionar participantes
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowNewChat(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      // Mock: crear conversación con datos de ejemplo
                      handleCreateConversation(['user-123'], 'Nueva conversación');
                    }}
                  >
                    Crear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </EnhancedDashboardLayout>
  );
}
