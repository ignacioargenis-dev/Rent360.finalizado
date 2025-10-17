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
  Phone,
  Mail,
  Users,
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
  propertyTitle?: string;
  propertyAddress?: string;
  tenantName?: string;
  tenantEmail?: string;
  brokerName?: string;
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

export default function LegalCasesPage() {
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [caseDetailsModalOpen, setCaseDetailsModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactType, setContactType] = useState<'lawyer' | 'broker' | 'support'>('lawyer');
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [selectedTrainingModule, setSelectedTrainingModule] = useState<string>('');

  useEffect(() => {
    loadLegalCases();
  }, [statusFilter, priorityFilter]);

  const loadLegalCases = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/owner/legal-cases?status=${statusFilter}&priority=${priorityFilter}`
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

  const handleDownloadDocuments = async (legalCase: LegalCase) => {
    try {
      // Real download of legal case expediente
      const response = await fetch(`/api/legal/cases/${legalCase.id}/expediente`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Expediente_${legalCase.caseNumber}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        logger.error('Error downloading expediente:', { error: await response.text() });
        alert('Error al descargar el expediente. Intente nuevamente.');
      }
    } catch (error) {
      logger.error('Error downloading expediente:', { error });
      alert('Error al descargar el expediente. Intente nuevamente.');
    }
  };

  const handleSendMessage = (legalCase: LegalCase) => {
    setSelectedCase(legalCase);
    const defaultMessage = `Estimado equipo legal,

Me contacto respecto al caso ${legalCase.caseNumber} (${getCaseTypeLabel(legalCase.caseType)}).

Propiedad: ${legalCase.propertyTitle}
Inquilino: ${legalCase.tenantName}
Monto en disputa: ${formatCurrency(legalCase.totalAmount)}

Por favor, actualíceme sobre el estado del proceso.

Atentamente,
Propietario`;

    setContactMessage(defaultMessage);
    setContactModalOpen(true);
  };

  const handleSendContactMessage = async () => {
    if (!selectedCase || !contactMessage.trim()) {
      return;
    }

    try {
      // Real API call to send message to legal team
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId:
            contactType === 'lawyer'
              ? 'legal-team'
              : contactType === 'broker'
                ? selectedCase.brokerName
                : 'support-team',
          title: `Actualización del caso ${selectedCase.caseNumber}`,
          message: contactMessage,
          type: 'LEGAL_UPDATE',
          data: {
            caseId: selectedCase.id,
            caseNumber: selectedCase.caseNumber,
            contactType: contactType,
          },
        }),
      });

      if (response.ok) {
        alert(
          `Mensaje enviado exitosamente\n\nAsunto: Actualización del caso ${selectedCase.caseNumber}\n\n${contactMessage}`
        );
        setContactModalOpen(false);
        setSelectedCase(null);
        setContactMessage('');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      logger.error('Error sending contact message:', { error });
      alert('Error al enviar mensaje. Intente nuevamente.');
    }
  };

  // New function to download legal document templates
  const handleDownloadTemplate = async (templateType: string) => {
    try {
      const templates = {
        'payment-agreement': {
          filename: 'Acuerdo_de_Pago.pdf',
          content: generatePaymentAgreementTemplate(),
        },
        'termination-letter': {
          filename: 'Carta_de_Terminacion.pdf',
          content: generateTerminationLetterTemplate(),
        },
        'judicial-requirement': {
          filename: 'Requerimiento_Judicial.pdf',
          content: generateJudicialRequirementTemplate(),
        },
      };

      const template = templates[templateType as keyof typeof templates];
      if (!template) {
        alert('Plantilla no encontrada');
        return;
      }

      // Create and download the document
      const blob = new Blob([template.content], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = template.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error('Error downloading template:', { error });
      alert('Error al descargar la plantilla. Intente nuevamente.');
    }
  };

  // Template generators
  const generatePaymentAgreementTemplate = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Acuerdo de Pago</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; }
        .signature-section { margin-top: 50px; }
        .signature-line { border-bottom: 1px solid #000; width: 200px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ACUERDO DE PAGO</h1>
        <p>Contrato de Arrendamiento</p>
    </div>
    
    <div class="content">
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</p>
        
        <p>Por medio del presente documento, las partes acuerdan lo siguiente:</p>
        
        <h3>1. PARTES</h3>
        <p><strong>Propietario:</strong> [Nombre del Propietario]<br>
        <strong>RUT:</strong> [RUT del Propietario]<br>
        <strong>Domicilio:</strong> [Dirección del Propietario]</p>
        
        <p><strong>Inquilino:</strong> [Nombre del Inquilino]<br>
        <strong>RUT:</strong> [RUT del Inquilino]<br>
        <strong>Domicilio:</strong> [Dirección del Inquilino]</p>
        
        <h3>2. OBJETO</h3>
        <p>El presente acuerdo tiene por objeto establecer las condiciones de pago de las obligaciones pendientes del arrendamiento de la propiedad ubicada en [Dirección de la Propiedad].</p>
        
        <h3>3. OBLIGACIONES PENDIENTES</h3>
        <p>El inquilino reconoce adeudar la suma de $[Monto] por concepto de:</p>
        <ul>
            <li>Arriendos vencidos: $[Monto Arriendos]</li>
            <li>Gastos comunes: $[Monto Gastos Comunes]</li>
            <li>Otros conceptos: $[Otros Gastos]</li>
        </ul>
        
        <h3>4. FORMA DE PAGO</h3>
        <p>El inquilino se compromete a pagar la deuda en [Número] cuotas de $[Monto Cuota] cada una, con vencimiento los días [Día] de cada mes, comenzando el [Fecha Primer Pago].</p>
        
        <h3>5. PENALIDADES</h3>
        <p>En caso de incumplimiento de alguna cuota, se aplicará un interés del [Porcentaje]% mensual sobre el saldo insoluto.</p>
        
        <h3>6. ACEPTACIÓN</h3>
        <p>Las partes declaran estar de acuerdo con las condiciones establecidas en el presente documento.</p>
    </div>
    
    <div class="signature-section">
        <p><strong>Propietario:</strong></p>
        <div class="signature-line"></div>
        <p>Firma y RUT</p>
        
        <p><strong>Inquilino:</strong></p>
        <div class="signature-line"></div>
        <p>Firma y RUT</p>
        
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</p>
    </div>
</body>
</html>`;
  };

  const generateTerminationLetterTemplate = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Carta de Terminación</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; }
        .footer { margin-top: 50px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CARTA DE TERMINACIÓN DE CONTRATO</h1>
        <p>Arrendamiento de Inmueble</p>
    </div>
    
    <div class="content">
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</p>
        
        <p><strong>Señor(a):</strong> [Nombre del Inquilino]<br>
        <strong>RUT:</strong> [RUT del Inquilino]<br>
        <strong>Domicilio:</strong> [Dirección del Inquilino]</p>
        
        <p><strong>Asunto:</strong> Terminación de Contrato de Arrendamiento</p>
        
        <p>Estimado(a) señor(a):</p>
        
        <p>Por medio de la presente, me dirijo a usted para comunicarle la terminación del contrato de arrendamiento de la propiedad ubicada en [Dirección de la Propiedad], suscrito el [Fecha del Contrato].</p>
        
        <h3>FUNDAMENTOS DE LA TERMINACIÓN:</h3>
        <p>La terminación se fundamenta en las siguientes causales establecidas en el artículo [Artículo] del Código Civil:</p>
        <ul>
            <li>[ ] Incumplimiento en el pago de arriendos</li>
            <li>[ ] Destrucción o deterioro grave de la cosa arrendada</li>
            <li>[ ] Uso de la cosa para fines distintos a los convenidos</li>
            <li>[ ] Subarriendo sin autorización</li>
            <li>[ ] Otras causales: [Especificar]</li>
        </ul>
        
        <h3>PLAZO DE DESOCUPACIÓN:</h3>
        <p>Conforme a la legislación vigente, usted tiene un plazo de [Número] días para desocupar la propiedad, contados desde la notificación de la presente carta.</p>
        
        <h3>DEVOLUCIÓN DE DEPÓSITO:</h3>
        <p>Una vez desocupada la propiedad en las condiciones establecidas en el contrato, procederé a la devolución del depósito de garantía, previo descuento de los gastos que correspondan.</p>
        
        <p>Sin otro particular, le saluda atentamente,</p>
    </div>
    
    <div class="footer">
        <p><strong>[Nombre del Propietario]</strong><br>
        <strong>RUT:</strong> [RUT del Propietario]<br>
        <strong>Domicilio:</strong> [Dirección del Propietario]<br>
        <strong>Teléfono:</strong> [Teléfono]<br>
        <strong>Email:</strong> [Email]</p>
    </div>
</body>
</html>`;
  };

  const generateJudicialRequirementTemplate = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Requerimiento Judicial</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; }
        .footer { margin-top: 50px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>REQUERIMIENTO JUDICIAL</h1>
        <p>Pago de Obligaciones Contractuales</p>
    </div>
    
    <div class="content">
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</p>
        
        <p><strong>Señor(a):</strong> [Nombre del Demandado]<br>
        <strong>RUT:</strong> [RUT del Demandado]<br>
        <strong>Domicilio:</strong> [Dirección del Demandado]</p>
        
        <p><strong>Asunto:</strong> Requerimiento de Pago - Contrato de Arrendamiento</p>
        
        <p>Estimado(a) señor(a):</p>
        
        <p>Por medio de la presente, y en mi calidad de propietario de la propiedad ubicada en [Dirección de la Propiedad], me dirijo a usted para requerirle el pago de las obligaciones pendientes derivadas del contrato de arrendamiento suscrito el [Fecha del Contrato].</p>
        
        <h3>OBLIGACIONES PENDIENTES:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px;">Concepto</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Período</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Monto</th>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Arriendo</td>
                <td style="border: 1px solid #ddd; padding: 8px;">[Período]</td>
                <td style="border: 1px solid #ddd; padding: 8px;">$[Monto]</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Gastos Comunes</td>
                <td style="border: 1px solid #ddd; padding: 8px;">[Período]</td>
                <td style="border: 1px solid #ddd; padding: 8px;">$[Monto]</td>
            </tr>
            <tr style="background-color: #f9f9f9; font-weight: bold;">
                <td style="border: 1px solid #ddd; padding: 8px;" colspan="2">TOTAL ADEUDADO</td>
                <td style="border: 1px solid #ddd; padding: 8px;">$[Total]</td>
            </tr>
        </table>
        
        <h3>PLAZO DE PAGO:</h3>
        <p>Le otorgo un plazo de [Número] días hábiles, contados desde la notificación de la presente, para cancelar la totalidad de las obligaciones adeudadas.</p>
        
        <h3>CONSECUENCIAS DEL INCUMPLIMIENTO:</h3>
        <p>Vencido el plazo otorgado sin que se haya efectuado el pago, procederé a iniciar las acciones legales correspondientes, las que incluirán:</p>
        <ul>
            <li>Demanda por cobro de pesos</li>
            <li>Requerimiento de pago con intereses y reajustes</li>
            <li>Gastos de cobranza y honorarios de abogado</li>
        </ul>
        
        <p>Sin otro particular, le saluda atentamente,</p>
    </div>
    
    <div class="footer">
        <p><strong>[Nombre del Propietario]</strong><br>
        <strong>RUT:</strong> [RUT del Propietario]<br>
        <strong>Domicilio:</strong> [Dirección del Propietario]<br>
        <strong>Teléfono:</strong> [Teléfono]<br>
        <strong>Email:</strong> [Email]</p>
        
        <p><strong>Abogado Patrocinante:</strong><br>
        <strong>Nombre:</strong> [Nombre del Abogado]<br>
        <strong>RUT:</strong> [RUT del Abogado]<br>
        <strong>Colegio de Abogados:</strong> [Número de Matrícula]</p>
    </div>
</body>
</html>`;
  };

  // Function to open training modules
  const handleOpenTrainingModule = (moduleType: string) => {
    setSelectedTrainingModule(moduleType);
    setTrainingModalOpen(true);
  };

  const getFilteredCases = () => {
    return legalCases.filter(legalCase => {
      const matchesSearch =
        !searchTerm ||
        legalCase.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        legalCase.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        legalCase.tenantName?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  };

  const filteredCases = getFilteredCases();

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Casos Legales" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando casos legales...</p>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Centro Legal Propietario"
      subtitle="Herramientas profesionales para gestionar tus casos legales"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="cases" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cases">Mis Casos</TabsTrigger>
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
                  <p className="text-xs text-muted-foreground">En gestión</p>
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
                  <CardTitle className="text-sm font-medium">Pre-Judiciales</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {legalCases.filter(c => c.status === 'PRE_JUDICIAL').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Prevención activa</p>
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
                  <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {legalCases.reduce((sum, c) => sum + c.unreadNotificationsCount, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Actualizaciones pendientes</p>
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
                    placeholder="Caso, propiedad, inquilino..."
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
                        : 'No se encontraron casos legales en tus propiedades.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredCases.map(legalCase => (
                  <Card key={legalCase.id} className="hover:shadow-md transition-shadow">
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
                                {legalCase.nextDeadline && `Plazo: ${legalCase.nextDeadline}`}
                                {legalCase.courtDate && ` • Audiencia: ${legalCase.courtDate}`}
                              </p>
                            </div>
                            {legalCase.unreadNotificationsCount > 0 && (
                              <Badge className="bg-red-100 text-red-800">
                                {legalCase.unreadNotificationsCount} nuevas
                              </Badge>
                            )}
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
                            {legalCase.settlementOffer && (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                                <div>
                                  <span className="font-medium text-green-600">Oferta:</span>
                                  <p className="font-semibold text-green-600">
                                    {formatCurrency(legalCase.settlementOffer)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {legalCase.notes && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-gray-700">Notas:</span>
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
                              onClick={() => handleSendMessage(legalCase)}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Contactar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendMessage(legalCase)}
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Llamar
                            </Button>
                          </div>

                          {legalCase.status === 'PRE_JUDICIAL' && legalCase.settlementOffer && (
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                alert(
                                  `Evaluando oferta de acuerdo por ${formatCurrency(legalCase.settlementOffer || 0)}`
                                )
                              }
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Considerar Acuerdo
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
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

              <Card>
                <CardHeader>
                  <CardTitle>Evolución Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-8 bg-gray-50 rounded-lg">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Gráfico de evolución próximamente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Costos Promedio por Caso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Costo Legal Promedio</span>
                        <span className="text-lg font-bold text-blue-600">
                          {legalCases.length > 0
                            ? formatCurrency(
                                legalCases.reduce((sum, c) => sum + c.legalFees, 0) /
                                  legalCases.length
                              )
                            : formatCurrency(0)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Tiempo Promedio</span>
                        <span className="text-lg font-bold text-green-600">
                          {legalCases.length > 0
                            ? Math.round(
                                legalCases.reduce((sum, c) => {
                                  const created = new Date(c.createdAt);
                                  const now = new Date();
                                  return (
                                    sum +
                                    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
                                  );
                                }, 0) / legalCases.length
                              )
                            : 0}{' '}
                          días
                        </span>
                      </div>
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
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDownloadTemplate('payment-agreement')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Acuerdo de Pago
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDownloadTemplate('termination-letter')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Carta de Terminación
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDownloadTemplate('judicial-requirement')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Requerimiento Judicial
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
                      Especialistas en arrendamientos
                    </div>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs"
                      onClick={() => window.open('mailto:abogados@rent360.cl')}
                    >
                      Contactar
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm">Mediadores Certificados</div>
                    <div className="text-xs text-muted-foreground">
                      Resolución alternativa de conflictos
                    </div>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs"
                      onClick={() => window.open('mailto:mediadores@rent360.cl')}
                    >
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
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleOpenTrainingModule('property-rights')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Derechos del Propietario
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleOpenTrainingModule('legal-process')}
                  >
                    <Scale className="w-4 h-4 mr-2" />
                    Proceso Legal en Chile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleOpenTrainingModule('communication')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Comunicación Efectiva
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

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
                    <h4 className="font-semibold text-gray-900 mb-2">Corredor</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p className="font-medium">{selectedCase.brokerName}</p>
                      <p className="text-sm text-gray-600">Intermediario del contrato</p>
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
                    onClick={() => handleSendMessage(selectedCase)}
                    className="flex-1 min-w-[150px] bg-blue-600 hover:bg-blue-700"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contactar Equipo Legal
                  </Button>
                  {selectedCase.settlementOffer && (
                    <Button
                      onClick={() =>
                        alert(
                          `Evaluando oferta de acuerdo por ${formatCurrency(selectedCase.settlementOffer || 0)}`
                        )
                      }
                      className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Considerar Acuerdo
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Contact Modal */}
        <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Contactar Equipo Legal</DialogTitle>
              <DialogDescription>
                Envía un mensaje al equipo legal encargado del caso {selectedCase?.caseNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de Contacto</label>
                <Select
                  value={contactType}
                  onValueChange={(value: 'lawyer' | 'broker' | 'support') => setContactType(value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lawyer">Abogado Asignado</SelectItem>
                    <SelectItem value="broker">Corredor Intermediario</SelectItem>
                    <SelectItem value="support">Soporte Rent360</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea
                  placeholder="Escribe tu mensaje..."
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  className="mt-1"
                  rows={6}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Información del Caso</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>Caso:</strong> {selectedCase?.caseNumber}
                  </p>
                  <p>
                    <strong>Tipo:</strong>{' '}
                    {selectedCase ? getCaseTypeLabel(selectedCase.caseType) : ''}
                  </p>
                  <p>
                    <strong>Monto:</strong>{' '}
                    {selectedCase ? formatCurrency(selectedCase.totalAmount) : ''}
                  </p>
                  <p>
                    <strong>Fase:</strong>{' '}
                    {selectedCase ? getPhaseLabel(selectedCase.currentPhase) : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setContactModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendContactMessage}
                disabled={!contactMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Enviar Mensaje
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Training Modal */}
        <Dialog open={trainingModalOpen} onOpenChange={setTrainingModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedTrainingModule === 'property-rights' && 'Derechos del Propietario'}
                {selectedTrainingModule === 'legal-process' && 'Proceso Legal en Chile'}
                {selectedTrainingModule === 'communication' && 'Comunicación Efectiva'}
              </DialogTitle>
              <DialogDescription>Módulo de capacitación interactivo</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {selectedTrainingModule === 'property-rights' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Derechos Fundamentales del Propietario
                    </h3>
                    <ul className="text-blue-800 space-y-2">
                      <li>• Derecho a recibir el pago puntual del arriendo</li>
                      <li>• Derecho a que se respete la propiedad y sus instalaciones</li>
                      <li>• Derecho a terminar el contrato por incumplimiento</li>
                      <li>• Derecho a inspeccionar la propiedad con previo aviso</li>
                      <li>• Derecho a recibir el depósito de garantía</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">
                      Obligaciones del Propietario
                    </h3>
                    <ul className="text-green-800 space-y-2">
                      <li>• Entregar la propiedad en buen estado</li>
                      <li>• Mantener la propiedad habitable</li>
                      <li>• Respetar la privacidad del inquilino</li>
                      <li>• Devolver el depósito al término del contrato</li>
                      <li>• Cumplir con las condiciones del contrato</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-2">Causales de Terminación</h3>
                    <ul className="text-yellow-800 space-y-2">
                      <li>• Incumplimiento en el pago de arriendos</li>
                      <li>• Destrucción o deterioro grave de la propiedad</li>
                      <li>• Uso de la propiedad para fines no convenidos</li>
                      <li>• Subarriendo sin autorización</li>
                      <li>• Molestias a vecinos o terceros</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedTrainingModule === 'legal-process' && (
                <div className="space-y-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-900 mb-2">Fases del Proceso Legal</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold text-sm">
                          1
                        </div>
                        <div>
                          <h4 className="font-medium text-orange-900">Fase Pre-Judicial</h4>
                          <p className="text-orange-800 text-sm">
                            Requerimientos extrajudiciales, mediación, negociación
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold text-sm">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium text-orange-900">Fase Judicial</h4>
                          <p className="text-orange-800 text-sm">
                            Demanda, citación, audiencia, sentencia
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold text-sm">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium text-orange-900">Fase de Ejecución</h4>
                          <p className="text-orange-800 text-sm">Embargo, remate, cobro efectivo</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">Plazos Importantes</h3>
                    <ul className="text-red-800 space-y-2">
                      <li>• Requerimiento extrajudicial: 15 días hábiles</li>
                      <li>• Demanda judicial: 30 días desde el requerimiento</li>
                      <li>• Audiencia: 20 días desde la citación</li>
                      <li>• Sentencia: 30 días desde la audiencia</li>
                      <li>• Ejecución: 6 meses desde la sentencia</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">Costos del Proceso</h3>
                    <ul className="text-purple-800 space-y-2">
                      <li>• Honorarios de abogado: 10-20% del monto</li>
                      <li>• Gastos judiciales: $50,000 - $200,000</li>
                      <li>• Peritos y tasaciones: $100,000 - $500,000</li>
                      <li>• Notificaciones: $5,000 - $15,000</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedTrainingModule === 'communication' && (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">
                      Comunicación Efectiva con Inquilinos
                    </h3>
                    <ul className="text-green-800 space-y-2">
                      <li>• Mantener un tono profesional y respetuoso</li>
                      <li>• Documentar todas las comunicaciones</li>
                      <li>• Ser claro en las expectativas y plazos</li>
                      <li>• Escuchar activamente las preocupaciones</li>
                      <li>• Ofrecer soluciones prácticas</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Técnicas de Negociación</h3>
                    <ul className="text-blue-800 space-y-2">
                      <li>• Identificar intereses comunes</li>
                      <li>• Proponer alternativas creativas</li>
                      <li>• Mantener la calma en situaciones tensas</li>
                      <li>• Buscar acuerdos ganar-ganar</li>
                      <li>• Documentar todos los acuerdos</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-2">Manejo de Conflictos</h3>
                    <ul className="text-yellow-800 space-y-2">
                      <li>• Abordar problemas temprano</li>
                      <li>• Separar el problema de la persona</li>
                      <li>• Buscar mediación cuando sea necesario</li>
                      <li>• Mantener registros detallados</li>
                      <li>• Conocer cuándo escalar legalmente</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setTrainingModalOpen(false)}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    alert('Módulo completado exitosamente. ¡Buen trabajo!');
                    setTrainingModalOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completar Módulo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
