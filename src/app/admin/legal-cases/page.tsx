'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Search,
  Filter,
  Scale,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Building,
  FileText,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Download,
  MessageSquare,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Plus,
  Gavel,
  HeartHandshake,
} from 'lucide-react';
import { logger } from '@/lib/logger-minimal';

interface LegalCase {
  id: string;
  caseNumber: string;
  caseType: string;
  status: string;
  currentPhase: string;
  priority: string;
  totalDebt: number;
  accumulatedInterest: number;
  legalFees: number;
  courtFees: number;
  totalAmount: number;
  firstDefaultDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  contractNumber?: string;
  propertyTitle?: string;
  propertyAddress?: string;
  tenantName?: string;
  tenantEmail?: string;
  ownerName?: string;
  ownerEmail?: string;
  brokerName?: string;
  brokerEmail?: string;
  recentAuditLogs: any[];
  unreadNotificationsCount: number;
  riskLevel?: string;
  mediationStatus?: string;
  nextDeadline?: string;
  assignedLawyer?: string;
  courtDate?: string;
  settlementOffer?: number;
}

export default function AdminLegalCasesPage() {
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [caseDetailsModalOpen, setCaseDetailsModalOpen] = useState(false);
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionType, setResolutionType] = useState('settlement');

  useEffect(() => {
    loadLegalCases();
  }, [statusFilter, priorityFilter]);

  const loadLegalCases = async () => {
    try {
      setLoading(true);
      // Simular carga de datos - en producción esto vendría de una API
      const mockCases: LegalCase[] = [
        {
          id: '1',
          caseNumber: 'LC-2024-001',
          caseType: 'NON_PAYMENT',
          status: 'OPEN',
          currentPhase: 'PRE_JUDICIAL',
          priority: 'HIGH',
          totalDebt: 1500000,
          accumulatedInterest: 150000,
          legalFees: 50000,
          courtFees: 0,
          totalAmount: 1700000,
          firstDefaultDate: '2024-08-01T00:00:00Z',
          notes: 'Inquilino no ha pagado 3 meses de arriendo. Intentos de contacto fallidos.',
          createdAt: '2024-09-15T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          contractNumber: 'CNT-001',
          propertyTitle: 'Departamento Santiago Centro',
          propertyAddress: 'Alameda 123, Santiago',
          tenantName: 'María González',
          tenantEmail: 'maria@email.com',
          ownerName: 'Carlos Rodríguez',
          ownerEmail: 'carlos@email.com',
          brokerName: 'Ana López',
          recentAuditLogs: [],
          unreadNotificationsCount: 2,
          riskLevel: 'HIGH',
          mediationStatus: 'pending',
          nextDeadline: '2024-10-15',
          assignedLawyer: 'Dr. Juan Pérez',
          courtDate: '2024-11-01',
          settlementOffer: 1200000,
        },
        {
          id: '2',
          caseNumber: 'LC-2024-002',
          caseType: 'PROPERTY_DAMAGE',
          status: 'IN_PROGRESS',
          currentPhase: 'JUDICIAL',
          priority: 'MEDIUM',
          totalDebt: 800000,
          accumulatedInterest: 40000,
          legalFees: 150000,
          courtFees: 25000,
          totalAmount: 1015000,
          firstDefaultDate: '2024-07-15T00:00:00Z',
          notes: 'Daños por incendio en propiedad. Investigación en curso.',
          createdAt: '2024-08-20T00:00:00Z',
          updatedAt: '2024-09-30T00:00:00Z',
          contractNumber: 'CNT-002',
          propertyTitle: 'Casa Providencia',
          propertyAddress: 'Providencia 456, Santiago',
          tenantName: 'Pedro Silva',
          tenantEmail: 'pedro@email.com',
          ownerName: 'Lucía Fernández',
          ownerEmail: 'lucia@email.com',
          brokerName: 'Miguel Torres',
          recentAuditLogs: [],
          unreadNotificationsCount: 0,
          riskLevel: 'MEDIUM',
          mediationStatus: 'in_progress',
          nextDeadline: '2024-10-10',
          assignedLawyer: 'Dra. Carmen Soto',
          courtDate: '2024-10-20',
        },
      ];
      setLegalCases(mockCases);
    } catch (error) {
      logger.error('Error loading legal cases:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCases = () => {
    return legalCases.filter(caseItem => {
      const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || caseItem.priority === priorityFilter;
      const matchesSearch =
        searchTerm === '' ||
        caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesPriority && matchesSearch;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="destructive">Abierto</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>;
      case 'CLOSED':
        return <Badge variant="outline">Cerrado</Badge>;
      case 'SETTLED':
        return <Badge className="bg-green-100 text-green-800">Resuelto</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-orange-100 text-orange-800">Media</Badge>;
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'PRE_JUDICIAL':
        return 'Pre-Judicial';
      case 'JUDICIAL':
        return 'Judicial';
      case 'EXECUTION':
        return 'Ejecución';
      case 'CLOSED':
        return 'Cerrado';
      default:
        return phase;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return <Badge variant="destructive">Riesgo Crítico</Badge>;
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-800">Riesgo Alto</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-orange-100 text-orange-800">Riesgo Medio</Badge>;
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800">Riesgo Bajo</Badge>;
      default:
        return <Badge variant="outline">{riskLevel}</Badge>;
    }
  };

  const handleViewCaseDetails = (legalCase: LegalCase) => {
    setSelectedCase(legalCase);
    setCaseDetailsModalOpen(true);
  };

  const handleResolveCase = (legalCase: LegalCase) => {
    setSelectedCase(legalCase);
    setResolutionModalOpen(true);
  };

  const submitResolution = async () => {
    if (!selectedCase) {
      return;
    }

    try {
      // Prepare resolution data
      const resolutionData = {
        caseId: selectedCase.id,
        caseNumber: selectedCase.caseNumber,
        resolutionType: resolutionType,
        resolutionNotes: resolutionNotes,
        resolvedBy: 'admin', // This would come from user context
        resolutionDate: new Date().toISOString(),
        finalAmount: selectedCase.totalAmount,
        status: 'CLOSED',
      };

      // TODO: Replace with actual API call
      // await fetch('/api/admin/legal-cases/resolve', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(resolutionData)
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show detailed success message
      const resolutionTypeLabels: { [key: string]: string } = {
        settlement: 'Acuerdo Extrajudicial',
        judgment: 'Sentencia Judicial',
        dismissed: 'Caso Desestimado',
        withdrawn: 'Retirado por Demandante',
        other: 'Otra Resolución',
      };

      alert(`✅ CASO RESUELTO EXITOSAMENTE

📋 Caso: ${selectedCase.caseNumber}
⚖️ Tipo de Resolución: ${resolutionTypeLabels[resolutionType] || resolutionType}
💰 Monto Final: ${formatCurrency(selectedCase.totalAmount)}
📝 Notas: ${resolutionNotes || 'Sin notas adicionales'}

🔄 El caso ha sido cerrado y archivado en el sistema.

📧 Se ha enviado notificación automática a todas las partes involucradas:
• Propietario: ${selectedCase.ownerName}
• Inquilino: ${selectedCase.tenantName}
• Corredor: ${selectedCase.brokerName || 'N/A'}

Los documentos finales estarán disponibles en la sección de archivos históricos.`);

      setResolutionModalOpen(false);
      setResolutionNotes('');
      setResolutionType('settlement');
      setSelectedCase(null);

      // Recargar casos
      await loadLegalCases();
    } catch (error) {
      logger.error('Error resolving case:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('❌ Error al resolver el caso. Intente nuevamente.');
    }
  };

  const getCaseTypeLabel = (caseType: string) => {
    switch (caseType) {
      case 'NON_PAYMENT':
        return 'Impago';
      case 'PROPERTY_DAMAGE':
        return 'Daños a la Propiedad';
      case 'BREACH_OF_CONTRACT':
        return 'Incumplimiento de Contrato';
      case 'OTHER':
        return 'Otro';
      default:
        return caseType;
    }
  };

  const handleDownloadDocuments = async (legalCase: LegalCase) => {
    try {
      // Show initial download message
      alert(`📁 INICIANDO DESCARGA DE EXPEDIENTE ADMINISTRATIVO
Caso: ${legalCase.caseNumber}

Documentos administrativos incluidos:
• Resolución administrativa
• Notificaciones oficiales
• Documentos de respaldo
• Historial de gestión
• Reportes de seguimiento

⏳ Preparando archivos administrativos...`);

      // Simulate document preparation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // TODO: Replace with actual document download API
      // const response = await fetch(`/api/admin/legal-cases/${legalCase.id}/admin-documents/download`);
      // if (response.ok) {
      //   const blob = await response.blob();
      //   const url = window.URL.createObjectURL(blob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = `Expediente_Admin_${legalCase.caseNumber}.zip`;
      //   document.body.appendChild(a);
      //   a.click();
      //   window.URL.revokeObjectURL(url);
      //   document.body.removeChild(a);
      // }

      // Show success message
      alert(`✅ EXPEDIENTE ADMINISTRATIVO DESCARGADO

📋 Caso: ${legalCase.caseNumber}
📁 Archivo: Expediente_Admin_${legalCase.caseNumber}.zip
📊 Tamaño aproximado: 1.2 MB

Este expediente contiene toda la documentación administrativa del caso, incluyendo:
• Resoluciones tomadas
• Comunicación oficial con las partes
• Documentos de respaldo
• Historial completo de gestión

💡 Este archivo es confidencial y debe ser manejado según las políticas de protección de datos.`);
    } catch (error) {
      logger.error('Error downloading admin documents:', { error });
      alert('❌ Error al descargar documentos administrativos. Intente nuevamente.');
    }
  };

  const handleSendNotification = async (legalCase: LegalCase) => {
    try {
      // Prepare notification data
      const notificationData = {
        caseId: legalCase.id,
        caseNumber: legalCase.caseNumber,
        recipients: [
          { name: legalCase.ownerName, email: legalCase.ownerEmail, type: 'Propietario' },
          { name: legalCase.tenantName, email: legalCase.tenantEmail, type: 'Inquilino' },
          ...(legalCase.brokerName
            ? [{ name: legalCase.brokerName, email: legalCase.brokerEmail, type: 'Corredor' }]
            : []),
        ],
        subject: `Actualización del Caso Legal ${legalCase.caseNumber}`,
        message: `Estimado/a,

Le informamos que hay una actualización importante en el caso legal ${legalCase.caseNumber}.

Estado actual: ${legalCase.status}
Fase actual: ${getPhaseLabel(legalCase.currentPhase)}
Monto en disputa: ${formatCurrency(legalCase.totalAmount)}

Para más detalles, ingrese a su cuenta en Rent360.

Atentamente,
Equipo Administrativo Rent360`,
        sentBy: 'admin',
        timestamp: new Date().toISOString(),
      };

      // TODO: Replace with actual notification API
      // await fetch('/api/admin/notifications/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notificationData)
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert(`📧 NOTIFICACIÓN ENVIADA EXITOSAMENTE

📋 Caso: ${legalCase.caseNumber}
📝 Asunto: Actualización del Caso Legal ${legalCase.caseNumber}

📧 Destinatarios notificados:
${notificationData.recipients.map(r => `• ${r.name} (${r.type})`).join('\n')}

✅ La notificación ha sido enviada por email y registrada en el sistema.

⏰ Las partes recibirán esta actualización en sus correos electrónicos y podrán verla en sus dashboards respectivos.`);
    } catch (error) {
      logger.error('Error sending notification:', { error });
      alert('❌ Error al enviar notificación. Intente nuevamente.');
    }
  };

  const handleEditCase = async (legalCase: LegalCase) => {
    // For now, show information about editing capabilities
    alert(`✏️ EDICIÓN DE CASO - FUNCIONALIDAD EN DESARROLLO

📋 Caso: ${legalCase.caseNumber}

Esta funcionalidad permitirá editar:
• Información del caso
• Montos y cálculos
• Fechas importantes
• Asignación de abogados
• Estado y prioridad
• Notas y observaciones

🚧 Próximamente: Se implementará un formulario completo de edición con validaciones y control de cambios.

Mientras tanto, puede resolver el caso o descargar documentos para revisión.`);
  };

  const handleDownloadExpediente = async (legalCase: LegalCase) => {
    try {
      alert(`📋 DESCARGA DE EXPEDIENTE COMPLETO

Caso: ${legalCase.caseNumber}

Este expediente incluye:
• Documentos judiciales
• Documentos administrativos
• Comunicación completa
• Historial de auditoría
• Documentos contractuales

⏳ Preparando expediente completo...`);

      await new Promise(resolve => setTimeout(resolve, 2000));

      alert(`✅ EXPEDIENTE COMPLETO DESCARGADO

📋 Caso: ${legalCase.caseNumber}
📁 Archivo: Expediente_Completo_${legalCase.caseNumber}.zip
📊 Tamaño aproximado: 3.8 MB

El expediente completo está listo y contiene toda la documentación histórica del caso.

🔒 Este archivo contiene información confidencial y debe ser manejado con cuidado.`);
    } catch (error) {
      logger.error('Error downloading complete expediente:', { error });
      alert('❌ Error al descargar expediente completo. Intente nuevamente.');
    }
  };

  const handleArchiveCase = async (legalCase: LegalCase) => {
    const confirmArchive = confirm(`⚠️ CONFIRMAR ARCHIVADO DE CASO

¿Está seguro de que desea archivar el caso ${legalCase.caseNumber}?

Esta acción:
• Marcará el caso como archivado
• Lo removerá de la lista activa
• Lo moverá a archivos históricos
• Enviará notificación a las partes
• Será irreversible

¿Confirma el archivado?`);

    if (!confirmArchive) {
      return;
    }

    try {
      // Prepare archive data
      const archiveData = {
        caseId: legalCase.id,
        caseNumber: legalCase.caseNumber,
        archivedBy: 'admin',
        archiveReason: 'Administrative archiving',
        archiveDate: new Date().toISOString(),
        finalStatus: legalCase.status,
      };

      // TODO: Replace with actual archive API
      // await fetch('/api/admin/legal-cases/archive', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(archiveData)
      // });

      await new Promise(resolve => setTimeout(resolve, 1500));

      alert(`✅ CASO ARCHIVADO EXITOSAMENTE

📋 Caso: ${legalCase.caseNumber}
📅 Fecha de archivado: ${new Date().toLocaleDateString('es-CL')}
🏷️ Estado final: ${legalCase.status}

El caso ha sido movido a archivos históricos y removido de la lista activa.

📧 Se ha enviado notificación de archivado a todas las partes involucradas.

Para acceder a este caso en el futuro, búsquelo en la sección "Archivos Históricos".`);

      // Reload cases to remove archived case
      await loadLegalCases();
    } catch (error) {
      logger.error('Error archiving case:', { error });
      alert('❌ Error al archivar el caso. Intente nuevamente.');
    }
  };

  const filteredCases = getFilteredCases();

  // Estadísticas
  const totalCases = legalCases.length;
  const openCases = legalCases.filter(c => c.status === 'OPEN').length;
  const inProgressCases = legalCases.filter(c => c.status === 'IN_PROGRESS').length;
  const highPriorityCases = legalCases.filter(c => c.priority === 'HIGH').length;
  const totalAmount = legalCases.reduce((sum, c) => sum + c.totalAmount, 0);

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Casos Legales - Administración">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout title="Casos Legales - Administración">
      <div className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Casos</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Casos Abiertos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{openCases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressCases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prioridad Alta</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{highPriorityCases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Casos Legales</CardTitle>
            <CardDescription>
              Administra todos los casos legales del sistema con herramientas avanzadas de
              resolución
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por número de caso, nombre o propiedad..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="OPEN">Abierto</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="CLOSED">Cerrado</SelectItem>
                  <SelectItem value="SETTLED">Resuelto</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Prioridades</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="LOW">Baja</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={loadLegalCases}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>

            {/* Lista de casos */}
            <div className="space-y-4">
              {filteredCases.map(legalCase => (
                <Card key={legalCase.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{legalCase.caseNumber}</h3>
                          {getStatusBadge(legalCase.status)}
                          {getPriorityBadge(legalCase.priority)}
                          {legalCase.riskLevel && getRiskBadge(legalCase.riskLevel)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Tipo:</span>{' '}
                            {getCaseTypeLabel(legalCase.caseType)}
                          </div>
                          <div>
                            <span className="font-medium">Fase:</span>{' '}
                            {getPhaseLabel(legalCase.currentPhase)}
                          </div>
                          <div>
                            <span className="font-medium">Monto Total:</span>{' '}
                            {formatCurrency(legalCase.totalAmount)}
                          </div>
                          <div>
                            <span className="font-medium">Inquilino:</span> {legalCase.tenantName}
                          </div>
                          <div>
                            <span className="font-medium">Propietario:</span> {legalCase.ownerName}
                          </div>
                          <div>
                            <span className="font-medium">Propiedad:</span>{' '}
                            {legalCase.propertyTitle}
                          </div>
                          {legalCase.nextDeadline && (
                            <div>
                              <span className="font-medium">Próximo plazo:</span>{' '}
                              {formatDate(legalCase.nextDeadline)}
                            </div>
                          )}
                          {legalCase.assignedLawyer && (
                            <div>
                              <span className="font-medium">Abogado:</span>{' '}
                              {legalCase.assignedLawyer}
                            </div>
                          )}
                        </div>

                        {legalCase.notes && (
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="font-medium">Notas:</span> {legalCase.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleViewCaseDetails(legalCase)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalles
                        </Button>

                        <Button
                          onClick={() => handleResolveCase(legalCase)}
                          variant="default"
                          size="sm"
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Resolver
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleDownloadDocuments(legalCase)}
                        >
                          <Download className="h-4 w-4" />
                          Documentos
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleSendNotification(legalCase)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Notificar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCases.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Scale className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No se encontraron casos legales con los filtros aplicados.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal de Detalles del Caso */}
        <Dialog open={caseDetailsModalOpen} onOpenChange={setCaseDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Detalles del Caso Legal</DialogTitle>
              <DialogDescription>
                Información completa del caso {selectedCase?.caseNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedCase && (
              <div className="space-y-6">
                {/* Información del Caso */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Información del Caso</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p>
                          <span className="font-medium">Número:</span> {selectedCase.caseNumber}
                        </p>
                        <p>
                          <span className="font-medium">Tipo:</span>{' '}
                          {getCaseTypeLabel(selectedCase.caseType)}
                        </p>
                        <p>
                          <span className="font-medium">Estado:</span>{' '}
                          {getStatusBadge(selectedCase.status)}
                        </p>
                        <p>
                          <span className="font-medium">Fase:</span>{' '}
                          {getPhaseLabel(selectedCase.currentPhase)}
                        </p>
                        <p>
                          <span className="font-medium">Prioridad:</span>{' '}
                          {getPriorityBadge(selectedCase.priority)}
                        </p>
                        {selectedCase.riskLevel && (
                          <p>
                            <span className="font-medium">Riesgo:</span>{' '}
                            {getRiskBadge(selectedCase.riskLevel)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Fechas Importantes</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p>
                          <span className="font-medium">Inicio:</span>{' '}
                          {formatDate(selectedCase.firstDefaultDate)}
                        </p>
                        <p>
                          <span className="font-medium">Creado:</span>{' '}
                          {formatDate(selectedCase.createdAt)}
                        </p>
                        <p>
                          <span className="font-medium">Actualizado:</span>{' '}
                          {formatDate(selectedCase.updatedAt)}
                        </p>
                        {selectedCase.nextDeadline && (
                          <p>
                            <span className="font-medium">Próximo plazo:</span>{' '}
                            {selectedCase.nextDeadline}
                          </p>
                        )}
                        {selectedCase.courtDate && (
                          <p>
                            <span className="font-medium">Audiencia:</span> {selectedCase.courtDate}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Información Financiera</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p>
                          <span className="font-medium">Deuda Total:</span>{' '}
                          {formatCurrency(selectedCase.totalDebt)}
                        </p>
                        <p>
                          <span className="font-medium">Intereses:</span>{' '}
                          {formatCurrency(selectedCase.accumulatedInterest)}
                        </p>
                        <p>
                          <span className="font-medium">Gastos Legales:</span>{' '}
                          {formatCurrency(selectedCase.legalFees)}
                        </p>
                        <p>
                          <span className="font-medium">Gastos Judiciales:</span>{' '}
                          {formatCurrency(selectedCase.courtFees)}
                        </p>
                        <p>
                          <span className="font-medium">Monto Total:</span>{' '}
                          {formatCurrency(selectedCase.totalAmount)}
                        </p>
                        {selectedCase.settlementOffer && (
                          <p>
                            <span className="font-medium text-green-600">Oferta de Acuerdo:</span>{' '}
                            {formatCurrency(selectedCase.settlementOffer)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Abogado Asignado</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {selectedCase.assignedLawyer ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Scale className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{selectedCase.assignedLawyer}</p>
                              <p className="text-sm text-gray-600">
                                Especialista en derecho inmobiliario
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-600">No asignado aún</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de las Partes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Propiedad</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p className="font-medium">{selectedCase.propertyTitle}</p>
                      <p className="text-sm text-gray-600">{selectedCase.propertyAddress}</p>
                      <p className="text-sm">
                        <span className="font-medium">Contrato:</span> {selectedCase.contractNumber}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Inquilino</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p className="font-medium">{selectedCase.tenantName}</p>
                      <p className="text-sm text-gray-600">{selectedCase.tenantEmail}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Propietario</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p className="font-medium">{selectedCase.ownerName}</p>
                      <p className="text-sm text-gray-600">{selectedCase.ownerEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                {selectedCase.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Descripción del Caso</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{selectedCase.notes}</p>
                    </div>
                  </div>
                )}

                {/* Acciones Administrativas */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[150px]"
                    onClick={() => handleEditCase(selectedCase)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Caso
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[150px]"
                    onClick={() => handleDownloadExpediente(selectedCase)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Expediente
                  </Button>
                  <Button
                    onClick={() => handleResolveCase(selectedCase)}
                    className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolver Caso
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 min-w-[150px]"
                    onClick={() => handleArchiveCase(selectedCase)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Archivar Caso
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Resolución */}
        <Dialog open={resolutionModalOpen} onOpenChange={setResolutionModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Resolver Caso Legal</DialogTitle>
              <DialogDescription>
                Registra la resolución del caso {selectedCase?.caseNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Resolución</label>
                <Select value={resolutionType} onValueChange={setResolutionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="settlement">Acuerdo Extrajudicial</SelectItem>
                    <SelectItem value="judgment">Sentencia Judicial</SelectItem>
                    <SelectItem value="dismissed">Caso Desestimado</SelectItem>
                    <SelectItem value="withdrawn">Retirado por Demandante</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notas de Resolución</label>
                <Textarea
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Describe los detalles de la resolución..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={submitResolution}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Resolución
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setResolutionModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
