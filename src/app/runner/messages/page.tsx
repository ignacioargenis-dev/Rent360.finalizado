'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Archive,
  MoreVertical,
} from 'lucide-react';

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
  clientId: string;
  clientName: string;
  clientRole: string;
  clientAvatar?: string;
  lastMessage: Message;
  unreadCount: number;
  status: 'active' | 'archived';
  lastActivity: string;
}

export default function RunnerMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real messages data from API
      const response = await fetch('/api/messages?limit=100', {
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

      // Transform API data to match our interface
      const transformedMessages: Message[] = data.messages.map((message: any) => ({
        id: message.id,
        content: message.content || 'Sin contenido',
        senderId: message.senderId || 'unknown',
        senderName: message.senderName || 'Usuario desconocido',
        senderRole: message.senderRole || 'USER',
        timestamp: message.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        isRead: message.isRead || false,
        type: 'text',
      }));

      // Group messages by conversation (simplified)
      const conversationMap = new Map<string, Conversation>();

      transformedMessages.forEach(message => {
        const convId = message.senderId;
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            id: convId,
            clientId: message.senderId,
            clientName: message.senderName,
            clientRole: message.senderRole,
            lastMessage: message,
            unreadCount: message.isRead ? 0 : 1,
            status: 'active',
            lastActivity: message.timestamp,
          });
        } else {
          const conv = conversationMap.get(convId)!;
          if (new Date(message.timestamp) > new Date(conv.lastActivity)) {
            conv.lastMessage = message;
            conv.lastActivity = message.timestamp;
          }
          if (!message.isRead) {
            conv.unreadCount++;
          }
        }
      });

      setConversations(Array.from(conversationMap.values()));
      setMessages(transformedMessages);
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) {
      return;
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newMessage,
          recipientId: selectedConversation.clientId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      setNewMessage('');
      loadPageData(); // Reload data
    } catch (error) {
      logger.error('Error sending message:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Update local state
      setMessages(prev => prev.map(msg => (msg.id === messageId ? { ...msg, isRead: true } : msg)));
    } catch (error) {
      logger.error('Error marking message as read:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const getSelectedConversation = () => {
    return selectedConversation;
  };

  const getConversationMessages = () => {
    if (!selectedConversation) {
      return [];
    }
    return messages.filter(msg => msg.senderId === selectedConversation.clientId);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      (filter === 'all' && conv.status === 'active') ||
      (filter === 'unread' && conv.unreadCount > 0) ||
      (filter === 'archived' && conv.status === 'archived');
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <UnifiedDashboardLayout
        title="Mensajes"
        subtitle="Gestión de mensajes y comunicaciones con clientes"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mensajes y comunicaciones...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout
        title="Mensajes"
        subtitle="Gestión de mensajes y comunicaciones con clientes"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadPageData} variant="outline">
              Reintentar
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Mensajes"
      subtitle="Gestión de mensajes y comunicaciones con clientes"
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
                <p className="text-gray-600">Gestiona las comunicaciones con tus clientes</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar conversaciones..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-gray-200 pr-6">
                <div className="space-y-2">
                  {filteredConversations.map(conversation => (
                    <Card
                      key={conversation.id}
                      className={`cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {conversation.clientName}
                              </h3>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {conversation.lastMessage.content}
                            </p>
                            <p className="text-xs text-gray-400">{conversation.lastActivity}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Conversation Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {selectedConversation.clientName}
                          </h3>
                          <p className="text-sm text-gray-500">{selectedConversation.clientRole}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {getConversationMessages().map(message => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === selectedConversation.clientId
                              ? 'justify-start'
                              : 'justify-end'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === selectedConversation.clientId
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.senderId === selectedConversation.clientId
                                  ? 'text-gray-500'
                                  : 'text-blue-100'
                              }`}
                            >
                              {message.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Escribe tu mensaje..."
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          className="flex-1 min-h-[40px] max-h-32"
                          onKeyPress={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <Card>
                      <CardContent className="p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Selecciona una conversación
                        </h3>
                        <p className="text-gray-500">
                          Elige una conversación de la lista para ver los mensajes y responder.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
