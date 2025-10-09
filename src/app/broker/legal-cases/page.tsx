'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  MessageSquare,
  TrendingUp,
  Scale,
  Users,
  Building,
  Phone,
  Mail,
  FileCheck,
  Gavel,
  HeartHandshake,
  AlertCircle,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Star,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger';

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
  recentAuditLogs: any[];
  unreadNotificationsCount: number;
  // Enhanced fields for better UX
  riskLevel?: string;
  mediationStatus?: string;
  nextDeadline?: string;
  assignedLawyer?: string;
  courtDate?: string;
  settlementOffer?: number;
}

export default function BrokerLegalCasesPage() {
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [caseDetailsModalOpen, setCaseDetailsModalOpen] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactType, setContactType] = useState<'tenant' | 'owner' | 'lawyer'>('tenant');

  // Estados para herramientas de mediación
  const [mediationGuideModal, setMediationGuideModal] = useState(false);
  const [agreementTemplatesModal, setAgreementTemplatesModal] = useState(false);
  const [communicationScriptsModal, setCommunicationScriptsModal] = useState(false);
  const [supportContactsModal, setSupportContactsModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);

  // Estados para recursos
  const [legalDocumentsModal, setLegalDocumentsModal] = useState(false);
  const [professionalContactsModal, setProfessionalContactsModal] = useState(false);
  const [trainingResourcesModal, setTrainingResourcesModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  useEffect(() => {
    loadLegalCases();
  }, [statusFilter, priorityFilter]);

  const loadLegalCases = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/broker/legal-cases?status=${statusFilter}&priority=${priorityFilter}`
      );
      if (response.ok) {
        const data = await response.json();
        // Enhance mock data with additional fields for better UX
        const enhancedCases = (data.legalCases || []).map((case_: LegalCase) => ({
          ...case_,
          riskLevel: getRiskLevel(case_),
          mediationStatus: case_.status === 'PRE_JUDICIAL' ? 'AVAILABLE' : 'NOT_AVAILABLE',
          nextDeadline: getNextDeadline(case_),
          assignedLawyer: case_.status === 'JUDICIAL' ? 'Abogado Rent360' : undefined,
          courtDate: case_.status === 'JUDICIAL' ? getCourtDate(case_) : undefined,
          settlementOffer:
            case_.status === 'PRE_JUDICIAL' ? Math.floor(case_.totalAmount * 0.8) : undefined,
        }));
        setLegalCases(enhancedCases);
      } else {
        logger.error('Error loading legal cases:', { error: await response.text() });
      }
    } catch (error) {
      logger.error('Error loading legal cases:', { error });
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (legalCase: LegalCase): string => {
    if (legalCase.totalAmount > 2000000) {
      return 'CRITICAL';
    }
    if (legalCase.totalAmount > 1000000 || legalCase.priority === 'URGENT') {
      return 'HIGH';
    }
    if (legalCase.totalAmount > 500000 || legalCase.priority === 'HIGH') {
      return 'MEDIUM';
    }
    return 'LOW';
  };

  const getNextDeadline = (legalCase: LegalCase): string => {
    const created = new Date(legalCase.createdAt);
    const daysOpen = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));

    if (legalCase.status === 'PRE_JUDICIAL') {
      // 30 days from creation for pre-judicial phase
      const deadline = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
      return deadline.toISOString().split('T')[0] || '';
    } else if (legalCase.status === 'JUDICIAL') {
      // Court deadlines are more strict
      const deadline = new Date(created.getTime() + 60 * 24 * 60 * 60 * 1000);
      return deadline.toISOString().split('T')[0] || '';
    }
    return '';
  };

  const getCourtDate = (legalCase: LegalCase): string => {
    const created = new Date(legalCase.createdAt);
    // Mock court date 45 days from case creation
    const courtDate = new Date(created.getTime() + 45 * 24 * 60 * 60 * 1000);
    return courtDate.toISOString().split('T')[0] || '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRE_JUDICIAL':
        return <Badge className="bg-yellow-100 text-yellow-800">Pre-Judicial</Badge>;
      case 'JUDICIAL':
        return <Badge className="bg-orange-100 text-orange-800">Judicial</Badge>;
      case 'EXECUTION':
        return <Badge className="bg-red-100 text-red-800">Ejecución</Badge>;
      case 'CLOSED':
        return <Badge className="bg-green-100 text-green-800">Cerrado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return (
          <Badge variant="outline" className="border-green-300 text-green-700">
            Baja
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            Media
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="outline" className="border-orange-300 text-orange-700">
            Alta
          </Badge>
        );
      case 'URGENT':
        return (
          <Badge variant="outline" className="border-red-300 text-red-700">
            Urgente
          </Badge>
        );
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getCaseTypeLabel = (caseType: string) => {
    switch (caseType) {
      case 'NON_PAYMENT':
        return 'Incumplimiento de Pago';
      case 'CONTRACT_BREACH':
        return 'Incumplimiento Contractual';
      case 'PROPERTY_DAMAGE':
        return 'Daño a la Propiedad';
      case 'OTHER':
        return 'Otro';
      default:
        return caseType;
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'PRE_JUDICIAL':
        return 'Pre-Judicial';
      case 'EXTRAJUDICIAL_NOTICE':
        return 'Requerimiento Extrajudicial';
      case 'DEMAND_FILED':
        return 'Demanda Presentada';
      case 'HEARING':
        return 'Audiencia';
      case 'JUDGMENT':
        return 'Sentencia';
      case 'EXECUTION':
        return 'Ejecución';
      case 'CLOSED':
        return 'Cerrado';
      default:
        return phase;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewCaseDetails = (legalCase: LegalCase) => {
    setSelectedCase(legalCase);
    setCaseDetailsModalOpen(true);
  };

  const handleDownloadDocuments = (legalCase: LegalCase) => {
    // Simular descarga de documentos legales
    const documents = [
      `Demanda_Judicial_${legalCase.caseNumber}.pdf`,
      `Citacion_Inquilino_${legalCase.caseNumber}.pdf`,
      `Citacion_Propietario_${legalCase.caseNumber}.pdf`,
      `Evidencia_Presentada_${legalCase.caseNumber}.pdf`,
      `Resoluciones_${legalCase.caseNumber}.pdf`,
    ];

    // Simular descarga
    alert(
      `📁 Descargando expediente completo del caso ${legalCase.caseNumber}\n\nDocumentos incluidos:\n${documents.map(doc => `• ${doc}`).join('\n')}\n\nLa descarga comenzará en breve...`
    );

    // Simular progreso de descarga
    setTimeout(() => {
      alert(
        `✅ Expediente descargado exitosamente\nArchivo: Expediente_${legalCase.caseNumber}.zip`
      );
    }, 2000);
  };

  const handleOfferMediation = (legalCase: LegalCase) => {
    // Simular envío de propuesta de mediación a ambas partes
    const mediationProposal = {
      caseNumber: legalCase.caseNumber,
      property: legalCase.propertyTitle,
      contract: legalCase.contractNumber,
      disputeType: getCaseTypeLabel(legalCase.caseType),
      amount: legalCase.totalAmount,
      benefits: [
        'Resolución amistosa sin costos judiciales',
        'Mantención de relación comercial',
        'Proceso más rápido y eficiente',
        'Confidencialidad garantizada',
        'Acuerdos flexibles y personalizados',
      ],
    };

    alert(`🔄 INICIANDO MEDIACIÓN PROFESIONAL

Caso: ${mediationProposal.caseNumber}
Propiedad: ${mediationProposal.property}
Tipo de Disputa: ${mediationProposal.disputeType}

📧 Enviando propuesta de mediación a ambas partes...

Beneficios de la mediación:
${mediationProposal.benefits.map(benefit => `✓ ${benefit}`).join('\n')}

Próximos pasos:
1. Ambas partes recibirán la propuesta
2. Coordinación de reunión virtual/presencial
3. Facilitación del diálogo constructivo
4. Búsqueda de soluciones mutuamente beneficiosas

Como corredor intermediario, ofrezco mis servicios para mediar este conflicto y ayudar a ambas partes a llegar a un acuerdo satisfactorio.`);
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

  const handleOfferSettlement = (legalCase: LegalCase) => {
    setSelectedCase(legalCase);
    setSettlementAmount(legalCase.settlementOffer?.toString() || '');
    setSettlementNotes(
      `Propuesta de acuerdo extrajudicial para el caso ${legalCase.caseNumber}.\n\nMonto adeudado: ${formatCurrency(legalCase.totalAmount)}\nOferta de acuerdo: ${formatCurrency(legalCase.settlementOffer || 0)}\n\nBeneficios del acuerdo:\n• Evita costos judiciales adicionales\n• Resolución rápida\n• Posible descuento por pronto pago`
    );
    setSettlementDialogOpen(true);
  };

  const handleContactParty = (legalCase: LegalCase, party: 'tenant' | 'owner') => {
    const partyName = party === 'tenant' ? legalCase.tenantName : legalCase.ownerName;
    const partyEmail = party === 'tenant' ? legalCase.tenantEmail : legalCase.ownerEmail;

    if (!partyEmail) {
      alert(`No se encontró el email de ${party === 'tenant' ? 'el inquilino' : 'el propietario'}`);
      return;
    }

    const subject = `Mediación - Caso Legal ${legalCase.caseNumber}`;
    const body = `Estimado/a ${partyName},

Me contacto como corredor intermediario en el contrato ${legalCase.contractNumber} relacionado con la propiedad "${legalCase.propertyTitle}".

Respecto al caso legal ${legalCase.caseNumber} (${getCaseTypeLabel(legalCase.caseType)}), me gustaría ofrecer mis servicios de mediación para ayudar a resolver esta situación de manera amistosa.

¿Estaría disponible para una reunión o conversación telefónica?

Atentamente,
[Su Nombre]
Corredor Inmobiliario
Rent360
Teléfono: [Su Teléfono]
Email: [Su Email]`;

    // Abrir cliente de email
    window.open(
      `mailto:${partyEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
  };

  const submitSettlementOffer = async () => {
    if (!selectedCase || !settlementAmount || !settlementNotes.trim()) {
      return;
    }

    try {
      // TODO: Implement settlement offer API
      alert(
        `Propuesta de acuerdo enviada para el caso ${selectedCase.caseNumber}\n\nMonto ofrecido: ${formatCurrency(parseInt(settlementAmount))}\n\n${settlementNotes}`
      );

      setSettlementDialogOpen(false);
      setSelectedCase(null);
      setSettlementAmount('');
      setSettlementNotes('');
    } catch (error) {
      logger.error('Error sending settlement offer:', { error });
      alert('Error al enviar propuesta de acuerdo. Intente nuevamente.');
    }
  };

  const submitContactMessage = async () => {
    if (!selectedCase || !contactMessage.trim()) {
      return;
    }

    try {
      const contactInfo =
        contactType === 'tenant'
          ? { name: selectedCase.tenantName, email: selectedCase.tenantEmail }
          : { name: selectedCase.ownerName, email: selectedCase.ownerEmail };

      // TODO: Implement contact API
      alert(
        `Mensaje enviado a ${contactInfo.name}\n\nAsunto: Mediación - Caso ${selectedCase.caseNumber}\n\n${contactMessage}`
      );

      setContactDialogOpen(false);
      setSelectedCase(null);
      setContactMessage('');
    } catch (error) {
      logger.error('Error sending contact message:', { error });
      alert('Error al enviar mensaje. Intente nuevamente.');
    }
  };

  // Funciones para herramientas de mediación
  const openMediationGuide = () => {
    setMediationGuideModal(true);
  };

  const openAgreementTemplates = () => {
    setAgreementTemplatesModal(true);
  };

  const openCommunicationScripts = () => {
    setCommunicationScriptsModal(true);
  };

  const openSupportContacts = () => {
    setSupportContactsModal(true);
  };

  const selectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    // Aquí se podría abrir un editor de documentos o descargar la plantilla
    alert(`📄 Plantilla "${templateId}" seleccionada. Se abrirá el editor de documentos.`);
  };

  const selectScript = (scriptId: string) => {
    setSelectedScript(scriptId);
    // Copiar el script al portapapeles o mostrar el contenido completo
    const scriptContent = getScriptContent(scriptId);
    navigator.clipboard.writeText(scriptContent);
    alert(`📋 Script "${scriptId}" copiado al portapapeles.\n\nContenido:\n${scriptContent.substring(0, 100)}...`);
  };

  const getScriptContent = (scriptId: string): string => {
    const scripts: { [key: string]: string } = {
      'initial_contact': 'Estimado/a [Nombre],\n\nMe contacto como corredor intermediario en el contrato [Número de Contrato] relacionado con la propiedad [Dirección de Propiedad].\n\nRespecto al caso legal [Número de Caso], me gustaría ofrecer mis servicios de mediación para ayudar a resolver esta situación de manera amistosa.\n\n¿Estaría disponible para una reunión o conversación telefónica?\n\nAtentamente,\n[Su Nombre]',
      'follow_up': 'Estimado/a [Nombre],\n\nSiguiendo nuestro contacto anterior respecto al caso [Número de Caso], me gustaría actualizarlo sobre los avances en el proceso de mediación.\n\nActualmente nos encontramos en la fase de [Fase Actual] y hemos logrado [Avances Conseguido].\n\n¿Podríamos programar una reunión para discutir las opciones de resolución?\n\nAtentamente,\n[Su Nombre]',
      'settlement_proposal': 'Estimado/a [Nombre],\n\nDespués de analizar la situación del caso [Número de Caso], le presento la siguiente propuesta de acuerdo:\n\n- Monto acordado: [Monto]\n- Plazo de pago: [Plazo]\n- Condiciones adicionales: [Condiciones]\n\nEsta propuesta busca resolver el conflicto de manera eficiente para ambas partes.\n\n¿Estaría dispuesto a considerar esta opción?\n\nAtentamente,\n[Su Nombre]'
    };
    return scripts[scriptId] || 'Script no encontrado';
  };

  // Funciones para recursos
  const openLegalDocuments = () => {
    setLegalDocumentsModal(true);
  };

  const openProfessionalContacts = () => {
    setProfessionalContactsModal(true);
  };

  const openTrainingResources = () => {
    setTrainingResourcesModal(true);
  };

  const downloadDocument = (documentId: string) => {
    // Simular descarga de documento
    alert(`📄 Descargando documento: ${documentId}\n\nEl archivo se descargará automáticamente...`);
    setTimeout(() => {
      alert(`✅ Documento "${documentId}" descargado exitosamente.`);
    }, 1500);
  };

  const contactProfessional = (professionalId: string, type: string) => {
    const contactInfo = getProfessionalContact(professionalId, type);
    window.open(`mailto:${contactInfo.email}?subject=Consulta Legal - Caso ${selectedCase?.caseNumber || 'General'}&body=${encodeURIComponent(contactInfo.message)}`);
  };

  const getProfessionalContact = (professionalId: string, type: string) => {
    const professionals: { [key: string]: any } = {
      'lawyer_1': {
        email: 'abogado1@rent360.cl',
        message: 'Estimado Dr. Juan Pérez,\n\nMe contacto desde Rent360 para consultar sobre un caso legal.\n\n[Caso específico]\n\nAtentamente,\nCorredor Rent360'
      },
      'mediator_1': {
        email: 'mediador1@rent360.cl',
        message: 'Estimada Dra. Carmen Soto,\n\nSolicito sus servicios de mediación para un caso entre propietario e inquilino.\n\n[Caso específico]\n\nAtentamente,\nCorredor Rent360'
      }
    };
    return professionals[professionalId] || { email: 'contacto@rent360.cl', message: 'Consulta general' };
  };

  const getFilteredCases = () => {
    return legalCases.filter(legalCase => {
      const matchesSearch =
        !searchTerm ||
        legalCase.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        legalCase.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        legalCase.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        legalCase.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        legalCase.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Casos Legales" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando casos legales...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  const filteredCases = getFilteredCases();

  return (
    <UnifiedDashboardLayout
      title="Centro de Mediación Legal"
      subtitle="Herramientas profesionales para corredores intermediarios"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="cases" className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cases">Mis Casos</TabsTrigger>
            <TabsTrigger value="mediation">Herramientas de Mediación</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="resources">Recursos</TabsTrigger>
          </TabsList>

          <TabsContent value="cases">
            {/* Enhanced Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Casos</CardTitle>
                  <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{legalCases.length}</div>
                  <p className="text-xs text-muted-foreground">Intermediación activa</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(legalCases.reduce((sum, c) => sum + c.totalAmount, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">En disputa legal</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mediación Posible</CardTitle>
                  <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {legalCases.filter(c => c.mediationStatus === 'AVAILABLE').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Casos pre-judiciales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Riesgo Alto</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {
                      legalCases.filter(c => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL')
                        .length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Atención inmediata</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Próximas Audiencias</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {legalCases.filter(c => c.courtDate).length}
                  </div>
                  <p className="text-xs text-muted-foreground">En los próximos 60 días</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Oportunidad</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      legalCases.reduce((sum, c) => sum + (c.settlementOffer || 0), 0)
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Comisiones potenciales</p>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Estado:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="PRE_JUDICIAL">Pre-Judicial</SelectItem>
                    <SelectItem value="JUDICIAL">Judicial</SelectItem>
                    <SelectItem value="EXECUTION">Ejecución</SelectItem>
                    <SelectItem value="CLOSED">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Prioridad:</span>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="LOW">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium">Buscar:</span>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Caso, contrato, propiedad, inquilino..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <Button variant="outline" onClick={() => loadLegalCases()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>

            {/* Enhanced Cases List */}
            <div className="space-y-4">
              {filteredCases.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Scale className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm ? 'No se encontraron resultados' : 'No hay casos legales'}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm
                        ? 'Intenta con otros términos de búsqueda'
                        : 'No se encontraron casos legales en contratos donde eres intermediario.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredCases.map(legalCase => (
                  <Card
                    key={legalCase.id}
                    className={`hover:shadow-md transition-shadow ${
                      legalCase.riskLevel === 'CRITICAL'
                        ? 'border-red-300 bg-red-50'
                        : legalCase.riskLevel === 'HIGH'
                          ? 'border-orange-300 bg-orange-50'
                          : legalCase.nextDeadline
                            ? 'border-blue-300 bg-blue-50'
                            : ''
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Caso {legalCase.caseNumber}
                                </h3>
                                {getStatusBadge(legalCase.status)}
                                {getPriorityBadge(legalCase.priority)}
                                {getRiskBadge(legalCase.riskLevel || 'LOW')}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {getCaseTypeLabel(legalCase.caseType)} • Fase:{' '}
                                {getPhaseLabel(legalCase.currentPhase)}
                                {legalCase.assignedLawyer &&
                                  ` • Abogado: ${legalCase.assignedLawyer}`}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                Contrato: {legalCase.contractNumber}
                                {legalCase.nextDeadline && ` • Plazo: ${legalCase.nextDeadline}`}
                                {legalCase.courtDate && ` • Audiencia: ${legalCase.courtDate}`}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {legalCase.unreadNotificationsCount > 0 && (
                                <Badge className="bg-red-100 text-red-800">
                                  {legalCase.unreadNotificationsCount} notificaciones
                                </Badge>
                              )}
                              {legalCase.settlementOffer && (
                                <Badge className="bg-green-100 text-green-800">
                                  Oferta: {formatCurrency(legalCase.settlementOffer)}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="font-medium">Propiedad:</span>
                                <p className="truncate">{legalCase.propertyTitle}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="font-medium">Inquilino:</span>
                                <p className="truncate">{legalCase.tenantName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="font-medium">Propietario:</span>
                                <p className="truncate">{legalCase.ownerName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-red-400" />
                              <div>
                                <span className="font-medium">Deuda Total:</span>
                                <p className="font-semibold text-red-600">
                                  {formatCurrency(legalCase.totalAmount)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="font-medium">Inicio:</span>
                                <p>{formatDate(legalCase.firstDefaultDate)}</p>
                              </div>
                            </div>
                          </div>

                          {legalCase.notes && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">
                                Notas del caso:
                              </span>
                              <p className="text-sm text-gray-600 mt-1">{legalCase.notes}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Creado: {formatDate(legalCase.createdAt)}</span>
                            <span>Actualizado: {formatDate(legalCase.updatedAt)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:min-w-[280px]">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCaseDetails(legalCase)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Detalles
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocuments(legalCase)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Docs
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContactParty(legalCase, 'tenant')}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Inquilino
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContactParty(legalCase, 'owner')}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Propietario
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            {legalCase.status === 'PRE_JUDICIAL' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleOfferMediation(legalCase)}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  <HeartHandshake className="w-4 h-4 mr-2" />
                                  Mediar
                                </Button>
                                {legalCase.settlementOffer && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleOfferSettlement(legalCase)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                  >
                                    <FileCheck className="w-4 h-4 mr-2" />
                                    Acuerdo
                                  </Button>
                                )}
                              </>
                            )}
                            {legalCase.status === 'JUDICIAL' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleViewCaseDetails(legalCase)}
                                className="flex-1 bg-orange-600 hover:bg-orange-700"
                              >
                                <Gavel className="w-4 h-4 mr-2" />
                                Seguimiento
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="mediation">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Herramientas de Mediación</CardTitle>
                  <CardDescription>Recursos profesionales para resolver conflictos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline" onClick={openMediationGuide}>
                    <HeartHandshake className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Guía de Mediación</div>
                      <div className="text-sm text-muted-foreground">
                        Pasos para mediar efectivamente
                      </div>
                    </div>
                  </Button>

                  <Button className="w-full justify-start" variant="outline" onClick={openAgreementTemplates}>
                    <FileText className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Plantillas de Acuerdos</div>
                      <div className="text-sm text-muted-foreground">
                        Documentos legales predefinidos
                      </div>
                    </div>
                  </Button>

                  <Button className="w-full justify-start" variant="outline" onClick={openCommunicationScripts}>
                    <MessageSquare className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Scripts de Comunicación</div>
                      <div className="text-sm text-muted-foreground">
                        Mensajes efectivos para las partes
                      </div>
                    </div>
                  </Button>

                  <Button className="w-full justify-start" variant="outline" onClick={openSupportContacts}>
                    <Phone className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Contactos de Apoyo</div>
                      <div className="text-sm text-muted-foreground">
                        Abogados y mediadores externos
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mejores Prácticas</CardTitle>
                  <CardDescription>Consejos para una mediación exitosa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Comunicación Neutral</h4>
                      <p className="text-sm text-blue-800">
                        Mantén una posición neutral y facilita el diálogo constructivo entre ambas
                        partes.
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Enfoque en Soluciones</h4>
                      <p className="text-sm text-green-800">
                        Busca acuerdos que satisfagan las necesidades de ambas partes, no solo
                        imponer decisiones.
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">Documentación Completa</h4>
                      <p className="text-sm text-orange-800">
                        Registra todos los acuerdos y comunicaciones por escrito para evitar
                        malentendidos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Tipo de Caso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['NON_PAYMENT', 'CONTRACT_BREACH', 'PROPERTY_DAMAGE', 'OTHER'].map(type => {
                      const count = legalCases.filter(c => c.caseType === type).length;
                      const percentage =
                        legalCases.length > 0
                          ? ((count / legalCases.length) * 100).toFixed(1)
                          : '0';
                      return (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm">{getCaseTypeLabel(type)}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendencias de Riesgo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium">Riesgo Crítico</span>
                      <Badge variant="destructive">
                        {legalCases.filter(c => c.riskLevel === 'CRITICAL').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium">Riesgo Alto</span>
                      <Badge className="bg-orange-100 text-orange-800">
                        {legalCases.filter(c => c.riskLevel === 'HIGH').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium">Riesgo Medio</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {legalCases.filter(c => c.riskLevel === 'MEDIUM').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Riesgo Bajo</span>
                      <Badge className="bg-green-100 text-green-800">
                        {legalCases.filter(c => c.riskLevel === 'LOW').length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documentos Legales</CardTitle>
                  <CardDescription>Plantillas y formularios</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => downloadDocument('Acuerdo de Mediación')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Acuerdo de Mediación
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => downloadDocument('Propuesta de Pago')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Propuesta de Pago
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => downloadDocument('Convenio de Pago')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Convenio de Pago
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contactos Útiles</CardTitle>
                  <CardDescription>Profesionales del derecho</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm">Abogados Asociados</div>
                    <div className="text-xs text-muted-foreground">
                      Especialistas en derecho inmobiliario
                    </div>
                    <Button variant="link" className="p-0 h-auto text-xs" onClick={() => contactProfessional('lawyer_1', 'lawyer')}>
                      Contactar
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm">Mediadores Certificados</div>
                    <div className="text-xs text-muted-foreground">
                      Especialistas en resolución de conflictos
                    </div>
                    <Button variant="link" className="p-0 h-auto text-xs" onClick={() => contactProfessional('mediator_1', 'mediator')}>
                      Contactar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Capacitación</CardTitle>
                  <CardDescription>Recursos de aprendizaje</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Mediación Básica
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Scale className="w-4 h-4 mr-2" />
                    Derecho Inmobiliario
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Comunicación Efectiva
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Settlement Offer Dialog */}
        <Dialog open={settlementDialogOpen} onOpenChange={setSettlementDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Propuesta de Acuerdo Extrajudicial</DialogTitle>
              <DialogDescription>
                Envía una propuesta de acuerdo para resolver el caso {selectedCase?.caseNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Monto Propuesto</label>
                <Input
                  type="number"
                  placeholder="Ingresa el monto del acuerdo"
                  value={settlementAmount}
                  onChange={e => setSettlementAmount(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Términos del Acuerdo</label>
                <Textarea
                  placeholder="Describe los términos del acuerdo, condiciones de pago, plazos, etc."
                  value={settlementNotes}
                  onChange={e => setSettlementNotes(e.target.value)}
                  className="mt-1"
                  rows={6}
                />
              </div>

              {settlementAmount && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Resumen de la Propuesta</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>
                      <strong>Monto ofrecido:</strong> {formatCurrency(parseInt(settlementAmount))}
                    </p>
                    <p>
                      <strong>Ahorro potencial:</strong>{' '}
                      {formatCurrency(
                        (selectedCase?.totalAmount || 0) - parseInt(settlementAmount)
                      )}
                    </p>
                    <p>
                      <strong>Porcentaje del total:</strong>{' '}
                      {selectedCase?.totalAmount
                        ? ((parseInt(settlementAmount) / selectedCase.totalAmount) * 100).toFixed(1)
                        : '0'}
                      %
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSettlementDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={submitSettlementOffer}
                disabled={!settlementAmount || !settlementNotes.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Enviar Propuesta
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contact Dialog */}
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Contactar {contactType === 'tenant' ? 'Inquilino' : 'Propietario'}
              </DialogTitle>
              <DialogDescription>Envía un mensaje profesional de mediación</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea
                  placeholder="Escribe tu mensaje de mediación..."
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  className="mt-1"
                  rows={8}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Consejos para una comunicación efectiva:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Mantén un tono profesional y neutral</li>
                  <li>• Enfatiza los beneficios de resolver el conflicto amistosamente</li>
                  <li>• Ofrece tu ayuda como intermediario neutral</li>
                  <li>• Incluye información específica sobre el caso</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={submitContactMessage}
                disabled={!contactMessage.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar Mensaje
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Case Details Modal */}
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
                {/* Case Overview */}
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
                          {formatCurrency(selectedCase.totalAmount)}
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

                {/* Property and Parties Information */}
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

                {/* Case Description */}
                {selectedCase.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Descripción del Caso</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{selectedCase.notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleDownloadDocuments(selectedCase)}
                    variant="outline"
                    className="flex-1 min-w-[150px]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Documentos
                  </Button>
                  <Button
                    onClick={() => handleOfferMediation(selectedCase)}
                    className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700"
                  >
                    <HeartHandshake className="w-4 h-4 mr-2" />
                    Ofrecer Mediación
                  </Button>
                  {selectedCase.settlementOffer && (
                    <Button
                      onClick={() => handleOfferSettlement(selectedCase)}
                      className="flex-1 min-w-[150px] bg-blue-600 hover:bg-blue-700"
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      Proponer Acuerdo
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Mediation Guide Modal */}
        <Dialog open={mediationGuideModal} onOpenChange={setMediationGuideModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-600">🕊️ Guía Completa de Mediación</DialogTitle>
              <DialogDescription>
                Pasos profesionales para mediar efectivamente en conflictos inmobiliarios
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">📋 Paso 1: Preparación</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Revisar toda la documentación del caso</li>
                      <li>• Entender las posiciones de ambas partes</li>
                      <li>• Identificar intereses subyacentes</li>
                      <li>• Preparar agenda neutral</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">🎯 Paso 2: Inicio</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Establecer reglas de participación</li>
                      <li>• Explicar proceso de mediación</li>
                      <li>• Obtener compromiso de ambas partes</li>
                      <li>• Definir objetivos claros</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">💬 Paso 3: Exploración</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Permitir que cada parte exponga su versión</li>
                      <li>• Hacer preguntas clarificadoras</li>
                      <li>• Identificar emociones y preocupaciones</li>
                      <li>• Buscar intereses comunes</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">🔄 Paso 4: Negociación</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Facilitar propuestas creativas</li>
                      <li>• Ayudar a evaluar opciones</li>
                      <li>• Gestionar expectativas realistas</li>
                      <li>• Mantener enfoque en soluciones</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">✍️ Paso 5: Acuerdo</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Redactar términos claros y específicos</li>
                      <li>• Asegurar comprensión mutua</li>
                      <li>• Obtener compromiso formal</li>
                      <li>• Establecer plazos de cumplimiento</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">📚 Mejores Prácticas</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Mantener neutralidad absoluta</li>
                      <li>• Fomentar comunicación respetuosa</li>
                      <li>• Documentar todo el proceso</li>
                      <li>• Proteger confidencialidad</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Consideraciones Importantes</h4>
                <ul className="text-sm space-y-1">
                  <li>• La mediación es voluntaria y confidencial</li>
                  <li>• El mediador no tiene poder de decisión</li>
                  <li>• Ambas partes deben estar dispuestas a negociar</li>
                  <li>• Los acuerdos deben ser realistas y cumplibles</li>
                  <li>• Documentar todo por escrito</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setMediationGuideModal(false)}>
                  Cerrar
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Guía Completa
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Agreement Templates Modal */}
        <Dialog open={agreementTemplatesModal} onOpenChange={setAgreementTemplatesModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-600">📄 Plantillas de Acuerdos</DialogTitle>
              <DialogDescription>
                Documentos legales predefinidos para resolver conflictos de manera profesional
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectTemplate('acuerdo_mediation')}>
                  <CardHeader>
                    <CardTitle className="text-lg">Acuerdo de Mediación</CardTitle>
                    <CardDescription>Documento formal que establece términos de resolución</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">Incluye cláusulas estándar para:</p>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Términos de pago acordados</li>
                        <li>• Plazos de cumplimiento</li>
                        <li>• Consecuencias de incumplimiento</li>
                        <li>• Firma de ambas partes</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectTemplate('propuesta_pago')}>
                  <CardHeader>
                    <CardTitle className="text-lg">Propuesta de Pago</CardTitle>
                    <CardDescription>Plantilla para proponer arreglos de pago flexibles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">Contiene secciones para:</p>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Monto total adeudado</li>
                        <li>• Cronograma de pagos</li>
                        <li>• Intereses y recargos</li>
                        <li>• Garantías de cumplimiento</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectTemplate('convenio_pago')}>
                  <CardHeader>
                    <CardTitle className="text-lg">Convenio de Pago</CardTitle>
                    <CardDescription>Acuerdo detallado para pagos escalonados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">Especifica claramente:</p>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Fechas exactas de pago</li>
                        <li>• Montos por cuota</li>
                        <li>• Método de pago</li>
                        <li>• Penalidades por atraso</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectTemplate('acuerdo_confidencialidad')}>
                  <CardHeader>
                    <CardTitle className="text-lg">Acuerdo de Confidencialidad</CardTitle>
                    <CardDescription>Protección de información durante el proceso de mediación</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">Establece compromisos de:</p>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• No divulgación de información</li>
                        <li>• Protección de datos personales</li>
                        <li>• Confidencialidad del proceso</li>
                        <li>• Duración del acuerdo</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Consejos para usar las plantillas</h4>
                <ul className="text-sm space-y-1">
                  <li>• Personaliza siempre los documentos con datos específicos del caso</li>
                  <li>• Asegúrate de que ambas partes entiendan todos los términos</li>
                  <li>• Recomienda revisión por abogado antes de firmar</li>
                  <li>• Guarda copias digitales y físicas de todos los documentos</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setAgreementTemplatesModal(false)}>
                  Cerrar
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Todas las Plantillas
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Communication Scripts Modal */}
        <Dialog open={communicationScriptsModal} onOpenChange={setCommunicationScriptsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-purple-600">💬 Scripts de Comunicación Profesional</DialogTitle>
              <DialogDescription>
                Mensajes efectivos y probados para comunicarte con las partes involucradas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectScript('initial_contact')}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      📞 Contacto Inicial
                      <Badge variant="secondary">Más usado</Badge>
                    </CardTitle>
                    <CardDescription>Primer acercamiento con las partes del conflicto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      Estimado/a [Nombre],<br/><br/>
                      Me contacto como corredor intermediario... [Ver contenido completo]
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Longitud: 250 palabras</span>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Copiar al portapapeles
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectScript('follow_up')}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      🔄 Seguimiento
                      <Badge variant="outline">Efectivo</Badge>
                    </CardTitle>
                    <CardDescription>Mantener el diálogo activo durante el proceso</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      Estimado/a [Nombre],<br/><br/>
                      Siguiendo nuestro contacto anterior... [Ver contenido completo]
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Longitud: 180 palabras</span>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Copiar al portapapeles
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectScript('settlement_proposal')}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      💰 Propuesta de Acuerdo
                      <Badge className="bg-green-100 text-green-800">Crítico</Badge>
                    </CardTitle>
                    <CardDescription>Presentar soluciones concretas de manera profesional</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      Estimado/a [Nombre],<br/><br/>
                      Después de analizar la situación... [Ver contenido completo]
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Longitud: 320 palabras</span>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Copiar al portapapeles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">📝 Consejos para una comunicación efectiva</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-2">✅ Lo que funciona:</h5>
                    <ul className="space-y-1">
                      <li>• Lenguaje neutral y profesional</li>
                      <li>• Mostrar empatía genuina</li>
                      <li>• Ofrecer soluciones concretas</li>
                      <li>• Mantener tono positivo</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">❌ Lo que evitar:</h5>
                    <ul className="space-y-1">
                      <li>• Acusaciones directas</li>
                      <li>• Lenguaje emocional</li>
                      <li>• Promesas imposibles</li>
                      <li>• Urgencia artificial</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setCommunicationScriptsModal(false)}>
                  Cerrar
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Todos los Scripts
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Support Contacts Modal */}
        <Dialog open={supportContactsModal} onOpenChange={setSupportContactsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-orange-600">📞 Contactos de Apoyo Profesional</DialogTitle>
              <DialogDescription>
                Red de abogados y mediadores certificados para casos complejos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Abogados Especializados</CardTitle>
                    <CardDescription>Profesionales certificados en derecho inmobiliario</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Scale className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Dr. Juan Pérez Martínez</h4>
                          <p className="text-sm text-gray-600">Especialista en arrendamientos • 15 años experiencia</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm">4.9/5.0 (127 casos)</span>
                          </div>
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => window.open('mailto:juan.perez@abogados.cl?subject=Consulta Legal - Caso Rent360&body=Estimado Dr. Pérez,%0A%0ARequiere sus servicios profesionales para mediar en un caso de disputa entre propietario e inquilino.')}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Contactar
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Scale className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Dra. María González Rojas</h4>
                          <p className="text-sm text-gray-600">Derecho civil y comercial • Mediadora certificada</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm">4.8/5.0 (89 casos)</span>
                          </div>
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => window.open('mailto:maria.gonzalez@abogados.cl?subject=Consulta Legal - Caso Rent360&body=Estimada Dra. González,%0A%0ARequiere sus servicios profesionales para mediar en un caso de disputa entre propietario e inquilino.')}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Contactar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mediadores Certificados</CardTitle>
                    <CardDescription>Especialistas en resolución alternativa de conflictos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <HeartHandshake className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Lic. Carmen Soto Valencia</h4>
                          <p className="text-sm text-gray-600">Mediadora familiar y comercial • Certificada ADR</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm">4.9/5.0 (156 mediaciones)</span>
                          </div>
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => window.open('mailto:carmen.soto@mediadores.cl?subject=Solicitud de Mediación - Caso Rent360&body=Estimada Lic. Soto,%0A%0ARequiere sus servicios de mediación profesional para resolver un conflicto entre propietario e inquilino.')}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Contactar
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <HeartHandshake className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Lic. Roberto Morales Silva</h4>
                          <p className="text-sm text-gray-600">Mediador inmobiliario • Especialista en disputas</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm">4.7/5.0 (98 mediaciones)</span>
                          </div>
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => window.open('mailto:roberto.morales@mediadores.cl?subject=Solicitud de Mediación - Caso Rent360&body=Estimado Lic. Morales,%0A%0ARequiere sus servicios de mediación profesional para resolver un conflicto entre propietario e inquilino.')}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Contactar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ Importante</h4>
                <ul className="text-sm space-y-1">
                  <li>• Los profesionales mostrados están certificados y tienen experiencia específica en casos inmobiliarios</li>
                  <li>• Rent360 no asume responsabilidad por servicios prestados por terceros</li>
                  <li>• Recomendamos verificar credenciales y referencias antes de contratar</li>
                  <li>• Los costos de servicios profesionales corren por cuenta de las partes involucradas</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSupportContactsModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
