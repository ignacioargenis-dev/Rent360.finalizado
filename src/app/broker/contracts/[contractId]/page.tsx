'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  User,
  Building,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Send,
  Eye,
  RefreshCw,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';
import { logger } from '@/lib/logger';

interface ContractDetail {
  id: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyAddress: string;
  propertyType: string;
  monthlyRent: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'terminated' | 'pending';
  commission: number;
  commissionPercentage: number;
  lastPaymentDate: string;
  nextPaymentDate: string;
  paymentHistory: PaymentRecord[];
  documents: Document[];
  notes: Note[];
  propertyImages: string[];
  tenantRating: number;
  propertyRating: number;
  renewalDate?: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'failed';
  method: string;
  reference: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
}

interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  type: 'general' | 'payment' | 'renewal' | 'complaint';
}

export default function BrokerContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserState();
  const contractId = params.contractId as string;

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'payment' | 'renewal' | 'complaint'>(
    'general'
  );

  // Mock data for contract details
  const mockContract: ContractDetail = {
    id: contractId,
    tenantName: 'María González',
    tenantEmail: 'maria.gonzalez@email.com',
    tenantPhone: '+56 9 1234 5678',
    propertyAddress: 'Av. Providencia 123, Santiago',
    propertyType: 'Apartamento',
    monthlyRent: 450000,
    currency: 'CLP',
    startDate: '2024-01-15',
    endDate: '2025-01-14',
    status: 'active',
    commission: 67500,
    commissionPercentage: 15,
    lastPaymentDate: '2024-12-01',
    nextPaymentDate: '2025-01-01',
    paymentHistory: [
      {
        id: '1',
        date: '2024-12-01',
        amount: 450000,
        status: 'paid',
        method: 'Transferencia bancaria',
        reference: 'TXN-2024-12-001',
      },
      {
        id: '2',
        date: '2024-11-01',
        amount: 450000,
        status: 'paid',
        method: 'Transferencia bancaria',
        reference: 'TXN-2024-11-001',
      },
      {
        id: '3',
        date: '2024-10-01',
        amount: 450000,
        status: 'paid',
        method: 'Transferencia bancaria',
        reference: 'TXN-2024-10-001',
      },
    ],
    documents: [
      {
        id: '1',
        name: 'Contrato de Arriendo.pdf',
        type: 'PDF',
        uploadDate: '2024-01-10',
        size: '2.3 MB',
      },
      {
        id: '2',
        name: 'Ficha Personal Inquilino.pdf',
        type: 'PDF',
        uploadDate: '2024-01-08',
        size: '1.8 MB',
      },
      {
        id: '3',
        name: 'Certificado Laboral.jpg',
        type: 'JPG',
        uploadDate: '2024-01-08',
        size: '450 KB',
      },
    ],
    notes: [
      {
        id: '1',
        content: 'Inquilino muy responsable, siempre paga a tiempo.',
        createdBy: 'Broker System',
        createdAt: '2024-12-15',
        type: 'general',
      },
      {
        id: '2',
        content: 'Renovación automática aprobada para enero 2025.',
        createdBy: 'Broker System',
        createdAt: '2024-11-20',
        type: 'renewal',
      },
    ],
    propertyImages: [
      '/api/placeholder/400/300',
      '/api/placeholder/400/300',
      '/api/placeholder/400/300',
    ],
    tenantRating: 4.8,
    propertyRating: 4.5,
    renewalDate: '2025-01-15',
  };

  useEffect(() => {
    loadContractDetails();
  }, [contractId]);

  const loadContractDetails = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setContract(mockContract);
    } catch (error) {
      logger.error('Error al cargar detalles del contrato', { error, contractId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactTenant = (method: 'email' | 'phone') => {
    if (!contract) {
      return;
    }

    if (method === 'email') {
      window.open(
        `mailto:${contract.tenantEmail}?subject=Consulta sobre contrato ${contract.id}`,
        '_blank'
      );
    } else {
      window.open(`tel:${contract.tenantPhone}`, '_blank');
    }

    logger.info('Contacto con inquilino iniciado', { contractId, method });
  };

  const handleViewProperty = () => {
    // Navigate to property detail page
    router.push(`/broker/properties/${contract?.id}`);
  };

  const handleDownloadDocument = (documentId: string) => {
    // Simulate document download
    const link = document.createElement('a');
    link.href = `/api/contracts/${contractId}/documents/${documentId}/download`;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Documento descargado', { contractId, documentId });
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !contract) {
      return;
    }

    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      createdBy: user?.name || 'Broker',
      createdAt: new Date().toISOString(),
      type: noteType,
    };

    setContract(prev =>
      prev
        ? {
            ...prev,
            notes: [note, ...prev.notes],
          }
        : null
    );

    setNewNote('');
    setNoteType('general');

    logger.info('Nota agregada al contrato', { contractId, noteType });
  };

  const handleEditContract = () => {
    router.push(`/broker/contracts/${contractId}/edit`);
  };

  const handleRenewContract = () => {
    // Simulate contract renewal
    logger.info('Renovación de contrato iniciada', { contractId });
    alert('Proceso de renovación iniciado. Se notificará al propietario.');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expirado</Badge>;
      case 'terminated':
        return <Badge variant="destructive">Terminado</Badge>;
      case 'pending':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Pendiente
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pagado</Badge>;
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Pendiente
          </Badge>
        );
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilRenewal = () => {
    if (!contract?.renewalDate) {
      return null;
    }
    const renewal = new Date(contract.renewalDate);
    const today = new Date();
    const diffTime = renewal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPaymentProgress = () => {
    if (!contract) {
      return 0;
    }
    const paidPayments = contract.paymentHistory.filter(p => p.status === 'paid').length;
    const totalPayments = contract.paymentHistory.length;
    return totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin mr-2" />
          <span>Cargando detalles del contrato...</span>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!contract) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Contrato no encontrado</h2>
            <p className="text-gray-600 mb-4">
              El contrato solicitado no existe o no tienes permisos para verlo.
            </p>
            <Button onClick={() => router.push('/broker/contracts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Contratos
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/broker/contracts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contrato #{contract.id}</h1>
              <p className="text-gray-600">{contract.propertyAddress}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditContract}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={handleViewProperty}>
              <Eye className="w-4 h-4 mr-2" />
              Ver Propiedad
            </Button>
          </div>
        </div>

        {/* Status and Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {getStatusBadge(contract.status)}
            <span className="text-sm text-gray-600">Vence: {formatDate(contract.endDate)}</span>
            {contract.renewalDate && (
              <span className="text-sm text-blue-600">
                Renovación: {formatDate(contract.renewalDate)}
                {getDaysUntilRenewal() !== null && getDaysUntilRenewal()! > 0 && (
                  <span className="ml-1">({getDaysUntilRenewal()} días)</span>
                )}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleContactTenant('email')}>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleContactTenant('phone')}>
              <Phone className="w-4 h-4 mr-2" />
              Llamar
            </Button>
            <Button variant="outline" size="sm" onClick={handleRenewContract}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Renovar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contract Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Información del Contrato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tipo de Propiedad</label>
                      <p className="text-lg font-semibold">{contract.propertyType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Renta Mensual</label>
                      <p className="text-lg font-semibold">
                        {formatCurrency(contract.monthlyRent)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fecha de Inicio</label>
                      <p>{formatDate(contract.startDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fecha de Término</label>
                      <p>{formatDate(contract.endDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Comisión</label>
                      <p>
                        {contract.commissionPercentage}% ({formatCurrency(contract.commission)})
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Próximo Pago</label>
                      <p>{formatDate(contract.nextPaymentDate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tenant Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información del Inquilino
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src="/api/placeholder/150/150" alt={contract.tenantName} />
                      <AvatarFallback>
                        {contract.tenantName
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{contract.tenantName}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Mail className="w-4 h-4" />
                        {contract.tenantEmail}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {contract.tenantPhone}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Calificación Inquilino
                      </label>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-lg font-semibold">{contract.tenantRating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Calificación Propiedad
                      </label>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-lg font-semibold">{contract.propertyRating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Property Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Imágenes de la Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {contract.propertyImages.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-video bg-gray-200 rounded-lg overflow-hidden"
                    >
                      <img
                        src={image}
                        alt={`Propiedad ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Progreso de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pagos al día</span>
                    <span className="text-sm text-gray-600">
                      {contract.paymentHistory.filter(p => p.status === 'paid').length} de{' '}
                      {contract.paymentHistory.length}
                    </span>
                  </div>
                  <Progress value={getPaymentProgress()} className="w-full" />
                  <p className="text-xs text-gray-500">
                    Último pago: {formatDate(contract.lastPaymentDate)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract.paymentHistory.map(payment => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{formatDate(payment.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                        </div>
                        <span className="text-sm text-gray-600">{payment.method}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPaymentStatusBadge(payment.status)}
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Recibo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Pagado</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(
                        contract.paymentHistory
                          .filter(p => p.status === 'paid')
                          .reduce((sum, p) => sum + p.amount, 0)
                      )}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Comisión Ganada</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        contract.paymentHistory.filter(p => p.status === 'paid').length *
                          contract.commission
                      )}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Próximo Pago</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(contract.monthlyRent)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatDate(contract.nextPaymentDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos del Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-600">
                            {doc.type} • {doc.size} • Subido: {formatDate(doc.uploadDate)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            {/* Add New Note */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Agregar Nota
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <Textarea
                      placeholder="Escribe una nota sobre este contrato..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Nota</label>
                    <select
                      value={noteType}
                      onChange={e => setNoteType(e.target.value as typeof noteType)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="general">General</option>
                      <option value="payment">Pago</option>
                      <option value="renewal">Renovación</option>
                      <option value="complaint">Queja</option>
                    </select>
                    <Button onClick={handleAddNote} disabled={!newNote.trim()} className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes History */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract.notes.map(note => (
                    <div key={note.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {note.createdBy
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{note.createdBy}</p>
                            <p className="text-xs text-gray-500">{formatDate(note.createdAt)}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {note.type === 'general'
                            ? 'General'
                            : note.type === 'payment'
                              ? 'Pago'
                              : note.type === 'renewal'
                                ? 'Renovación'
                                : 'Queja'}
                        </Badge>
                      </div>
                      <p className="text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
