'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  MapPin,
  User,
  FileText,
  Download,
  Eye,
  Clock,
  Home,
  Mail,
  Phone,
  AlertCircle,
  UserCheck,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger-minimal';

interface PendingVisit {
  id: string;
  propertyId: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    commune: string;
    price: number;
  };
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
  };
  scheduledAt: string;
  duration: number;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface TenantDocument {
  id: string;
  name: string;
  type: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export default function BrokerVisitsPage() {
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams?.get('propertyId');
  const tenantIdParam = searchParams?.get('tenantId');

  const [visits, setVisits] = useState<PendingVisit[]>([]);
  const [historyVisits, setHistoryVisits] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<PendingVisit | null>(null);
  const [tenantDocuments, setTenantDocuments] = useState<TenantDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);

  // Estados para auto-asignación
  const [showSelfAssignDialog, setShowSelfAssignDialog] = useState(false);
  const [selfAssignData, setSelfAssignData] = useState({
    scheduledAt: '',
    duration: 60,
    notes: '',
  });
  const [selfAssigning, setSelfAssigning] = useState(false);

  // Estados para rechazar
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    loadPendingVisits();
    loadHistoryVisits();
  }, [propertyIdParam, tenantIdParam]);

  const loadPendingVisits = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (propertyIdParam) {
        params.append('propertyId', propertyIdParam);
      }
      if (tenantIdParam) {
        params.append('tenantId', tenantIdParam);
      }

      const response = await fetch(`/api/owner/visits/pending?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar las solicitudes de visita');
      }

      const data = await response.json();
      setVisits(data.visits || []);
    } catch (err) {
      logger.error('Error cargando visitas pendientes:', err);
      setError('Error al cargar las solicitudes de visita');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryVisits = async () => {
    try {
      setLoadingHistory(true);
      const params = new URLSearchParams();
      if (propertyIdParam) {
        params.append('propertyId', propertyIdParam);
      }

      const response = await fetch(`/api/broker/visits/history?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setHistoryVisits(data.visits || []);
      }
    } catch (err) {
      logger.error('Error cargando historial de visitas:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadTenantDocuments = async (visit: PendingVisit) => {
    try {
      setLoadingDocuments(true);
      setSelectedVisit(visit);

      const response = await fetch(
        `/api/tenant/${visit.tenantId}/documents?propertyId=${visit.propertyId}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar los documentos del inquilino');
      }

      const data = await response.json();
      setTenantDocuments(data.documents || []);
      setShowDocumentsDialog(true);
    } catch (err) {
      logger.error('Error cargando documentos del inquilino:', err);
      alert('Error al cargar los documentos del inquilino');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleOpenSelfAssign = (visit: PendingVisit) => {
    setSelectedVisit(visit);
    const dateTimeParts = visit.scheduledAt.split('T');
    const datePart = dateTimeParts[0] || '';
    const timePart = dateTimeParts[1] ? dateTimeParts[1].substring(0, 5) : '00:00';
    setSelfAssignData({
      scheduledAt: datePart + 'T' + timePart,
      duration: visit.duration,
      notes: visit.notes || '',
    });
    setShowSelfAssignDialog(true);
  };

  const handleSelfAssign = async () => {
    if (!selectedVisit) {
      return;
    }

    try {
      setSelfAssigning(true);
      const scheduledAtISO = new Date(selfAssignData.scheduledAt).toISOString();

      const response = await fetch(`/api/visits/${selectedVisit.id}/self-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scheduledAt: scheduledAtISO,
          duration: selfAssignData.duration,
          notes: selfAssignData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al programar visita');
      }

      setSuccessMessage('Visita programada exitosamente. Realizarás la visita tú mismo.');
      setShowSelfAssignDialog(false);
      await loadPendingVisits();
      await loadHistoryVisits();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      logger.error('Error auto-asignando visita:', err);
      alert(err instanceof Error ? err.message : 'Error al programar visita');
    } finally {
      setSelfAssigning(false);
    }
  };

  const handleOpenReject = (visit: PendingVisit) => {
    setSelectedVisit(visit);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!selectedVisit) {
      return;
    }

    try {
      setRejecting(true);
      const response = await fetch(`/api/visits/${selectedVisit.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason: rejectReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al rechazar visita');
      }

      setSuccessMessage('Solicitud de visita rechazada exitosamente');
      setShowRejectDialog(false);
      await loadPendingVisits();
      await loadHistoryVisits();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      logger.error('Error rechazando visita:', err);
      alert(err instanceof Error ? err.message : 'Error al rechazar visita');
    } finally {
      setRejecting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + ' B';
    }
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      IDENTIFICATION: 'Identificación',
      INCOME_PROOF: 'Comprobante de Ingresos',
      CREDIT_REPORT: 'Informe Crediticio',
      REFERENCE: 'Referencia',
      OTHER_DOCUMENT: 'Otro Documento',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Solicitudes de Visita" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando solicitudes de visita...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Solicitudes de Visita Runner360"
      subtitle="Gestiona las solicitudes de visita pendientes para las propiedades que administras"
    >
      <div className="space-y-6">
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {visits.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay solicitudes de visita pendientes
                </h3>
                <p className="text-gray-600">
                  Cuando los inquilinos soliciten visitas de Runner360 para las propiedades que
                  administras, aparecerán aquí.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {visits.map(visit => (
              <Card key={visit.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-600" />
                        {visit.property.title}
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {visit.property.address}, {visit.property.commune}
                        </span>
                        <span className="text-green-600 font-semibold">
                          ${visit.property.price.toLocaleString()}/mes
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Pendiente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Información del Inquilino */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Información del Inquilino
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Nombre</p>
                          <p className="font-medium">{visit.tenant.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {visit.tenant.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Teléfono</p>
                          <p className="font-medium flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {visit.tenant.phone || 'No especificado'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Fecha de Solicitud</p>
                          <p className="font-medium">{formatDate(visit.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Detalles de la Visita */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Detalles de la Visita
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Fecha Programada</p>
                          <p className="font-medium text-gray-500 italic">
                            {visit.status === 'PENDING'
                              ? 'Pendiente de asignación'
                              : formatDate(visit.scheduledAt)}
                          </p>
                          {visit.status === 'PENDING' && (
                            <p className="text-xs text-gray-400 mt-1">
                              Se programará al gestionar la visita
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duración Estimada</p>
                          <p className="font-medium">{visit.duration} minutos</p>
                        </div>
                        {visit.notes && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600">Notas</p>
                            <p className="font-medium">{visit.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="border-t pt-4 flex flex-wrap gap-2">
                      <Button
                        onClick={() => loadTenantDocuments(visit)}
                        disabled={loadingDocuments}
                        variant="outline"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Ver Documentos
                      </Button>
                      <Button onClick={() => handleOpenSelfAssign(visit)} variant="default">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Gestionar Visita
                      </Button>
                      <Button onClick={() => handleOpenReject(visit)} variant="destructive">
                        <X className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Historial de Visitas */}
        {historyVisits.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Historial de Visitas</h2>
              <div className="h-1 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex-1 mx-4"></div>
            </div>
            <div className="grid gap-4">
              {historyVisits.map(visit => {
                const scheduledDate = new Date(visit.scheduledAt);
                const formattedDate = scheduledDate.toLocaleDateString('es-CL', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'COMPLETED':
                      return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
                    case 'CANCELLED':
                      return <Badge className="bg-gray-100 text-gray-800">Cancelada</Badge>;
                    case 'REJECTED':
                      return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
                    case 'NO_SHOW':
                      return <Badge className="bg-orange-100 text-orange-800">No asistió</Badge>;
                    case 'SCHEDULED':
                    case 'CONFIRMED':
                      return <Badge className="bg-blue-100 text-blue-800">Programada</Badge>;
                    default:
                      return <Badge>{status}</Badge>;
                  }
                };

                return (
                  <Card key={visit.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Home className="w-5 h-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-900">{visit.property.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                            <MapPin className="w-4 h-4" />
                            {visit.property.address}, {visit.property.commune}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600">Inquilino</p>
                              <p className="font-medium">{visit.tenant?.name || 'N/A'}</p>
                            </div>
                            {visit.runner && (
                              <div>
                                <p className="text-gray-600">Runner360</p>
                                <p className="font-medium">{visit.runner.name}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-gray-600">Fecha y Hora</p>
                              <p className="font-medium">{formattedDate}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Duración</p>
                              <p className="font-medium">{visit.duration} minutos</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">{getStatusBadge(visit.status)}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Dialog para ver documentos del inquilino */}
        <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos del Inquilino
              </DialogTitle>
              <DialogDescription>
                Documentos disponibles para evaluación de {selectedVisit?.tenant.name}
              </DialogDescription>
            </DialogHeader>

            {loadingDocuments ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando documentos...</p>
                </div>
              </div>
            ) : tenantDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay documentos disponibles
                </h3>
                <p className="text-gray-600">
                  Este inquilino aún no ha subido documentos para evaluación.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tenantDocuments.map(doc => (
                  <Card key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{doc.name}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <Badge variant="outline">{getDocumentTypeLabel(doc.type)}</Badge>
                              <span className="text-sm text-gray-600">
                                {formatFileSize(doc.fileSize)}
                              </span>
                              <span className="text-sm text-gray-600">
                                {formatDate(doc.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/documents/${doc.id}/access`, {
                                  credentials: 'include',
                                  method: 'GET',
                                });
                                if (!response.ok) {
                                  throw new Error('Error al acceder al documento');
                                }
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                window.open(url, '_blank');
                              } catch (error) {
                                alert(
                                  'Error al abrir el documento. Por favor, verifica tus permisos.'
                                );
                                logger.error('Error abriendo documento:', error);
                              }
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/documents/${doc.id}/access`, {
                                  credentials: 'include',
                                  method: 'GET',
                                });
                                if (!response.ok) {
                                  throw new Error('Error al descargar el documento');
                                }
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = doc.fileName;
                                link.click();
                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                alert(
                                  'Error al descargar el documento. Por favor, verifica tus permisos.'
                                );
                                logger.error('Error descargando documento:', error);
                              }
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para gestionar visita */}
        <Dialog open={showSelfAssignDialog} onOpenChange={setShowSelfAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gestionar Visita</DialogTitle>
              <DialogDescription>
                Programa la visita para la propiedad {selectedVisit?.property.title}. Puedes
                realizarla tú mismo o enviar a alguien de tu equipo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha y Hora</Label>
                  <Input
                    type="datetime-local"
                    value={selfAssignData.scheduledAt}
                    onChange={e =>
                      setSelfAssignData({ ...selfAssignData, scheduledAt: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Duración (minutos)</Label>
                  <Input
                    type="number"
                    value={selfAssignData.duration}
                    onChange={e =>
                      setSelfAssignData({
                        ...selfAssignData,
                        duration: parseInt(e.target.value) || 60,
                      })
                    }
                    min={15}
                    max={240}
                  />
                </div>
              </div>

              <div>
                <Label>Notas adicionales</Label>
                <Textarea
                  value={selfAssignData.notes}
                  onChange={e => setSelfAssignData({ ...selfAssignData, notes: e.target.value })}
                  rows={4}
                  placeholder="Indica si realizarás la visita tú mismo o si enviarás a alguien de tu equipo. Incluye cualquier información relevante..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Puedes especificar si realizarás la visita tú mismo o si enviarás a alguien de tu
                  equipo.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSelfAssignDialog(false)}
                  disabled={selfAssigning}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSelfAssign} disabled={selfAssigning}>
                  {selfAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Programando...
                    </>
                  ) : (
                    'Programar Visita'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para rechazar */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rechazar Solicitud de Visita</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas rechazar la solicitud de visita para la propiedad{' '}
                {selectedVisit?.property.title}?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Razón del rechazo (opcional)</Label>
                <Textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Explica brevemente por qué rechazas esta solicitud..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(false)}
                  disabled={rejecting}
                >
                  Cancelar
                </Button>
                <Button onClick={handleReject} disabled={rejecting} variant="destructive">
                  {rejecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rechazando...
                    </>
                  ) : (
                    'Rechazar Solicitud'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
