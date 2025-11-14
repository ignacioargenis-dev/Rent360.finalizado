'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Users,
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

interface Runner {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  city: string;
  commune: string;
  stats: {
    totalVisits: number;
    averageRating: number;
    totalRatings: number;
  };
}

export default function OwnerVisitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams?.get('propertyId');
  const tenantIdParam = searchParams?.get('tenantId');

  const [visits, setVisits] = useState<PendingVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<PendingVisit | null>(null);
  const [tenantDocuments, setTenantDocuments] = useState<TenantDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);

  // Estados para asignar runner
  const [showAssignRunnerDialog, setShowAssignRunnerDialog] = useState(false);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loadingRunners, setLoadingRunners] = useState(false);
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);
  const [assignData, setAssignData] = useState({
    scheduledAt: '',
    duration: 60,
    estimatedEarnings: 0,
    notes: '',
    paymentMethod: '',
  });
  const [assigningRunner, setAssigningRunner] = useState(false);

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

  const loadRunners = async (search: string = '') => {
    try {
      setLoadingRunners(true);
      const response = await fetch(`/api/owner/runners?search=${search}&limit=50`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar runners');
      }

      const data = await response.json();
      setRunners(data.runners || []);
    } catch (err) {
      logger.error('Error cargando runners:', err);
      alert('Error al cargar runners disponibles');
    } finally {
      setLoadingRunners(false);
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

  const handleOpenAssignRunner = async (visit: PendingVisit) => {
    setSelectedVisit(visit);
    const dateTimeParts = visit.scheduledAt.split('T');
    const datePart = dateTimeParts[0] || '';
    const timePart = dateTimeParts[1] ? dateTimeParts[1].substring(0, 5) : '00:00';
    setAssignData({
      scheduledAt: datePart + 'T' + timePart,
      duration: visit.duration,
      estimatedEarnings: 20000,
      notes: visit.notes || '',
      paymentMethod: '',
    });
    setShowAssignRunnerDialog(true);
    await loadRunners();
  };

  const handleAssignRunner = async () => {
    if (!selectedVisit || !selectedRunner) {
      alert('Por favor selecciona un runner');
      return;
    }

    try {
      setAssigningRunner(true);
      const scheduledAtISO = new Date(assignData.scheduledAt).toISOString();

      const response = await fetch(`/api/visits/${selectedVisit.id}/assign-runner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          runnerId: selectedRunner.id,
          scheduledAt: scheduledAtISO,
          duration: assignData.duration,
          estimatedEarnings: assignData.estimatedEarnings,
          notes: assignData.notes,
          paymentMethod: assignData.paymentMethod || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al asignar runner');
      }

      setSuccessMessage('Runner asignado exitosamente');
      setShowAssignRunnerDialog(false);
      await loadPendingVisits();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      logger.error('Error asignando runner:', err);
      alert(err instanceof Error ? err.message : 'Error al asignar runner');
    } finally {
      setAssigningRunner(false);
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
      subtitle="Gestiona las solicitudes de visita pendientes para tus propiedades"
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
                  Cuando los inquilinos soliciten visitas de Runner360 para tus propiedades,
                  aparecerán aquí.
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
                              Se programará al asignar runner
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
                      <Button onClick={() => handleOpenAssignRunner(visit)} variant="default">
                        <Users className="w-4 h-4 mr-2" />
                        Asignar Runner360
                      </Button>
                      <Button onClick={() => handleOpenSelfAssign(visit)} variant="default">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Hacer Visita Yo
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
                            onClick={() => window.open(`/api/documents/${doc.id}/access`, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = `/api/documents/${doc.id}/access`;
                              link.download = doc.fileName;
                              link.click();
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

        {/* Dialog para asignar runner */}
        <Dialog open={showAssignRunnerDialog} onOpenChange={setShowAssignRunnerDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Asignar Runner360</DialogTitle>
              <DialogDescription>
                Selecciona un runner para realizar la visita a la propiedad{' '}
                {selectedVisit?.property.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Runner</Label>
                <Select
                  value={selectedRunner?.id || ''}
                  onValueChange={value => {
                    const runner = runners.find(r => r.id === value);
                    setSelectedRunner(runner || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un runner" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingRunners ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        <p className="text-sm text-gray-600 mt-2">Cargando runners...</p>
                      </div>
                    ) : runners.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-600">
                        No hay runners disponibles
                      </div>
                    ) : (
                      runners.map(runner => (
                        <SelectItem key={runner.id} value={runner.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{runner.name}</span>
                            <span className="text-xs text-gray-500 ml-4">
                              ⭐ {runner.stats.averageRating.toFixed(1)} (
                              {runner.stats.totalRatings})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha y Hora</Label>
                  <Input
                    type="datetime-local"
                    value={assignData.scheduledAt}
                    onChange={e => setAssignData({ ...assignData, scheduledAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Duración (minutos)</Label>
                  <Input
                    type="number"
                    value={assignData.duration}
                    onChange={e =>
                      setAssignData({ ...assignData, duration: parseInt(e.target.value) || 60 })
                    }
                    min={15}
                    max={240}
                  />
                </div>
              </div>

              <div>
                <Label>Ganancia Estimada (CLP)</Label>
                <Input
                  type="number"
                  value={assignData.estimatedEarnings}
                  onChange={e =>
                    setAssignData({
                      ...assignData,
                      estimatedEarnings: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                />
              </div>

              <div>
                <Label>Notas adicionales</Label>
                <Textarea
                  value={assignData.notes}
                  onChange={e => setAssignData({ ...assignData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAssignRunnerDialog(false)}
                  disabled={assigningRunner}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAssignRunner} disabled={assigningRunner || !selectedRunner}>
                  {assigningRunner ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Asignando...
                    </>
                  ) : (
                    'Asignar Runner'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para auto-asignación */}
        <Dialog open={showSelfAssignDialog} onOpenChange={setShowSelfAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hacer Visita Yo Mismo</DialogTitle>
              <DialogDescription>
                Programar la visita para realizarla tú mismo a la propiedad{' '}
                {selectedVisit?.property.title}
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
                  rows={3}
                />
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
