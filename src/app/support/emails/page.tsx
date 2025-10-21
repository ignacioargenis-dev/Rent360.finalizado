'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Send,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  Star,
  StarOff,
  Search,
  Filter,
  Plus,
  User,
  Calendar,
  Paperclip,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';

interface Email {
  id: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  content: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
  status: 'draft' | 'sent' | 'received' | 'archived' | 'deleted';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'support' | 'billing' | 'technical' | 'general' | 'marketing';
  receivedAt: string;
  sentAt?: string;
  ticketId?: string;
  clientId?: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface EmailStats {
  totalEmails: number;
  unreadEmails: number;
  sentEmails: number;
  draftEmails: number;
  importantEmails: number;
}

export default function SupportEmailsPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<EmailStats>({
    totalEmails: 0,
    unreadEmails: 0,
    sentEmails: 0,
    draftEmails: 0,
    importantEmails: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [composeEmail, setComposeEmail] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    content: '',
    priority: 'normal' as const,
    category: 'support' as const,
  });

  useEffect(() => {
    loadEmailsData();
  }, []);

  const loadEmailsData = async () => {
    try {
      setLoading(true);

      // Simular carga de datos de emails
      const mockEmails: Email[] = [
        {
          id: '1',
          from: 'maria.gonzalez@example.com',
          to: 'soporte@rent360.cl',
          subject: 'Consulta sobre facturación',
          content:
            'Hola, tengo una consulta sobre mi factura del mes pasado. ¿Podrían revisar el monto cobrado?',
          isRead: false,
          isStarred: true,
          isImportant: true,
          hasAttachments: true,
          attachments: [
            {
              id: 'att1',
              name: 'factura_enero_2024.pdf',
              size: 245760,
              type: 'application/pdf',
              url: '/attachments/factura_enero_2024.pdf',
            },
          ],
          status: 'received',
          priority: 'high',
          category: 'billing',
          receivedAt: '2024-01-15T10:30:00Z',
          ticketId: 'TKT-001',
          clientId: 'client-001',
        },
        {
          id: '2',
          from: 'soporte@rent360.cl',
          to: 'carlos.ramirez@example.com',
          subject: 'Re: Problema técnico resuelto',
          content:
            'Estimado Carlos, hemos resuelto el problema técnico reportado. Por favor, confirma que todo funciona correctamente.',
          isRead: true,
          isStarred: false,
          isImportant: false,
          hasAttachments: false,
          status: 'sent',
          priority: 'normal',
          category: 'technical',
          receivedAt: '2024-01-15T11:15:00Z',
          sentAt: '2024-01-15T11:15:00Z',
          ticketId: 'TKT-002',
          clientId: 'client-002',
        },
        {
          id: '3',
          from: 'ana.silva@example.com',
          to: 'soporte@rent360.cl',
          subject: 'Solicitud de información general',
          content:
            'Buenos días, me gustaría conocer más sobre los servicios de Rent360. ¿Podrían enviarme información detallada?',
          isRead: false,
          isStarred: false,
          isImportant: false,
          hasAttachments: false,
          status: 'received',
          priority: 'low',
          category: 'general',
          receivedAt: '2024-01-15T12:00:00Z',
          clientId: 'client-003',
        },
        {
          id: '4',
          from: 'soporte@rent360.cl',
          to: 'roberto.torres@example.com',
          subject: 'Borrador: Respuesta a consulta de soporte',
          content: 'Estimado Roberto, estamos trabajando en su consulta...',
          isRead: true,
          isStarred: false,
          isImportant: false,
          hasAttachments: false,
          status: 'draft',
          priority: 'normal',
          category: 'support',
          receivedAt: '2024-01-15T14:30:00Z',
          ticketId: 'TKT-004',
          clientId: 'client-004',
        },
      ];

      setEmails(mockEmails);

      // Calcular estadísticas
      const totalEmails = mockEmails.length;
      const unreadEmails = mockEmails.filter(e => !e.isRead).length;
      const sentEmails = mockEmails.filter(e => e.status === 'sent').length;
      const draftEmails = mockEmails.filter(e => e.status === 'draft').length;
      const importantEmails = mockEmails.filter(e => e.isImportant).length;

      setStats({
        totalEmails,
        unreadEmails,
        sentEmails,
        draftEmails,
        importantEmails,
      });

      logger.debug('Datos de emails cargados', {
        totalEmails,
        unreadEmails,
        sentEmails,
        draftEmails,
      });
    } catch (error) {
      logger.error('Error cargando datos de emails:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComposeEmail = () => {
    setShowCompose(true);
    logger.info('Composición de email iniciada');
  };

  const handleSendEmail = async () => {
    try {
      const newEmail: Email = {
        id: Date.now().toString(),
        from: 'soporte@rent360.cl',
        to: composeEmail.to,
        cc: composeEmail.cc,
        bcc: composeEmail.bcc,
        subject: composeEmail.subject,
        content: composeEmail.content,
        isRead: true,
        isStarred: false,
        isImportant: composeEmail.priority === 'high' || composeEmail.priority === 'urgent',
        hasAttachments: false,
        status: 'sent',
        priority: composeEmail.priority,
        category: composeEmail.category,
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
      };

      setEmails(prev => [newEmail, ...prev]);
      setShowCompose(false);
      setComposeEmail({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        content: '',
        priority: 'normal',
        category: 'support',
      });

      logger.info('Email enviado', {
        to: composeEmail.to,
        subject: composeEmail.subject,
        priority: composeEmail.priority,
      });
    } catch (error) {
      logger.error('Error enviando email:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleMarkAsRead = (emailId: string) => {
    setEmails(prev =>
      prev.map(email => (email.id === emailId ? { ...email, isRead: true } : email))
    );
    logger.info('Email marcado como leído', { emailId });
  };

  const handleToggleStar = (emailId: string) => {
    setEmails(prev =>
      prev.map(email => (email.id === emailId ? { ...email, isStarred: !email.isStarred } : email))
    );
    logger.info('Email marcado/desmarcado como favorito', { emailId });
  };

  const handleDeleteEmail = (emailId: string) => {
    setEmails(prev =>
      prev.map(email => (email.id === emailId ? { ...email, status: 'deleted' } : email))
    );
    logger.info('Email eliminado', { emailId });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Enviado', color: 'bg-green-100 text-green-800' },
      received: { label: 'Recibido', color: 'bg-blue-100 text-blue-800' },
      archived: { label: 'Archivado', color: 'bg-yellow-100 text-yellow-800' },
      deleted: { label: 'Eliminado', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.received;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-blue-100 text-blue-800' },
      normal: { label: 'Normal', color: 'bg-gray-100 text-gray-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch =
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || email.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || email.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <UnifiedDashboardLayout
        user={user}
        title="Gestión de Emails"
        subtitle="Bandeja de correos del sistema"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando emails...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Gestión de Emails"
      subtitle="Bandeja de correos del sistema"
    >
      <div className="h-full flex flex-col p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmails}</div>
              <p className="text-xs text-muted-foreground">En bandeja</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No Leídos</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadEmails}</div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enviados</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sentEmails}</div>
              <p className="text-xs text-muted-foreground">Hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Borradores</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draftEmails}</div>
              <p className="text-xs text-muted-foreground">Sin enviar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Importantes</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.importantEmails}</div>
              <p className="text-xs text-muted-foreground">Prioritarios</p>
            </CardContent>
          </Card>
        </div>

        {/* Compose Email Modal */}
        {showCompose && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Send className="w-5 h-5" />
                Componer Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="to">Para *</Label>
                  <Input
                    id="to"
                    value={composeEmail.to}
                    onChange={e => setComposeEmail({ ...composeEmail, to: e.target.value })}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="cc">CC</Label>
                  <Input
                    id="cc"
                    value={composeEmail.cc}
                    onChange={e => setComposeEmail({ ...composeEmail, cc: e.target.value })}
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Asunto *</Label>
                <Input
                  id="subject"
                  value={composeEmail.subject}
                  onChange={e => setComposeEmail({ ...composeEmail, subject: e.target.value })}
                  placeholder="Asunto del email"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={composeEmail.priority}
                    onValueChange={(value: any) =>
                      setComposeEmail({ ...composeEmail, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={composeEmail.category}
                    onValueChange={(value: any) =>
                      setComposeEmail({ ...composeEmail, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Soporte</SelectItem>
                      <SelectItem value="billing">Facturación</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Contenido *</Label>
                <Textarea
                  id="content"
                  value={composeEmail.content}
                  onChange={e => setComposeEmail({ ...composeEmail, content: e.target.value })}
                  placeholder="Escribe tu mensaje aquí..."
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSendEmail}
                  disabled={!composeEmail.to || !composeEmail.subject || !composeEmail.content}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
                <Button variant="outline" onClick={() => setShowCompose(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Actions */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por remitente, destinatario, asunto o contenido..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="received">Recibidos</SelectItem>
              <SelectItem value="sent">Enviados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="archived">Archivados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="support">Soporte</SelectItem>
              <SelectItem value="billing">Facturación</SelectItem>
              <SelectItem value="technical">Técnico</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleComposeEmail}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Email
          </Button>
        </div>

        {/* Emails List */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Bandeja de Entrada ({filteredEmails.length})</CardTitle>
              <CardDescription>Gestiona todos los emails del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEmails.map(email => (
                  <div
                    key={email.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                      !email.isRead ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleStar(email.id)}
                          className="text-gray-400 hover:text-yellow-500"
                        >
                          {email.isStarred ? (
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="w-5 h-5" />
                          )}
                        </button>
                        {!email.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        )}
                      </div>

                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{email.from}</h3>
                          {email.isImportant && <AlertCircle className="w-4 h-4 text-red-500" />}
                          {email.hasAttachments && <Paperclip className="w-4 h-4 text-gray-500" />}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{email.subject}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{email.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(email.receivedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {getStatusBadge(email.status)}
                        {getPriorityBadge(email.priority)}
                        {email.hasAttachments && email.attachments && (
                          <div className="text-xs text-gray-500 mt-1">
                            {email.attachments.map(att => (
                              <div key={att.id}>
                                {att.name} ({formatFileSize(att.size)})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {!email.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(email.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Marcar Leído
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteEmail(email.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredEmails.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-4" />
                    <p>No hay emails que coincidan con los filtros.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
