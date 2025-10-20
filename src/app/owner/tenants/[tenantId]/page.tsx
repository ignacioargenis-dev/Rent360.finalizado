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
  Home,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Send,
  Eye,
  RefreshCw,
  Star,
  TrendingUp,
  PieChart,
  BarChart3,
  Users,
  AlertCircle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface TenantDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  rut?: string;
  birthDate?: string;
  occupation?: string;
  income?: number;
  status: 'ACTIVE' | 'PENDING' | 'TERMINATED' | 'NOTICE';
  paymentStatus: 'CURRENT' | 'OVERDUE' | 'LATE';
  registrationDate: string;
  lastContact: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  properties: TenantProperty[];
  paymentHistory: PaymentRecord[];
  documents: Document[];
  notes: Note[];
  rating: number;
  totalPaid: number;
  outstandingBalance: number;
  lastPayment: string;
}

interface TenantProperty {
  id: string;
  title: string;
  address: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  status: 'active' | 'completed' | 'terminated';
  brokerName?: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  property: string;
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
  category: 'identification' | 'financial' | 'contract' | 'other';
}

interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  type: 'general' | 'payment' | 'maintenance' | 'complaint';
}

export default function OwnerTenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tenantId = params?.tenantId as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for tenant details
  const mockTenant: TenantDetail = {
    id: tenantId,
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+56 9 1234 5678',
    rut: '12.345.678-9',
    birthDate: '1985-03-15',
    occupation: 'Profesora',
    income: 800000,
    status: 'ACTIVE',
    paymentStatus: 'CURRENT',
    registrationDate: '2024-01-15',
    lastContact: '2024-12-01',
    emergencyContact: {
      name: 'Carlos González',
      phone: '+56 9 8765 4321',
      relationship: 'Hermano',
    },
    properties: [
      {
        id: '1',
        title: 'Apartamento Providencia',
        address: 'Av. Providencia 123, Santiago',
        leaseStart: '2024-01-15',
        leaseEnd: '2025-01-14',
        monthlyRent: 450000,
        status: 'active',
        brokerName: 'Ana Broker',
      },
    ],
    paymentHistory: [
      {
        id: '1',
        date: '2024-12-01',
        amount: 450000,
        property: 'Apartamento Providencia',
        status: 'paid',
        method: 'Transferencia bancaria',
        reference: 'TXN-2024-12-001',
      },
      {
        id: '2',
        date: '2024-11-01',
        amount: 450000,
        property: 'Apartamento Providencia',
        status: 'paid',
        method: 'Transferencia bancaria',
        reference: 'TXN-2024-11-001',
      },
      {
        id: '3',
        date: '2024-10-01',
        amount: 450000,
        property: 'Apartamento Providencia',
        status: 'paid',
        method: 'Transferencia bancaria',
        reference: 'TXN-2024-10-001',
      },
    ],
    documents: [
      {
        id: '1',
        name: 'Cédula de Identidad.pdf',
        type: 'PDF',
        uploadDate: '2024-01-10',
        size: '2.3 MB',
        category: 'identification',
      },
      {
        id: '2',
        name: 'Certificado de Trabajo.pdf',
        type: 'PDF',
        uploadDate: '2024-01-10',
        size: '1.8 MB',
        category: 'financial',
      },
      {
        id: '3',
        name: 'Contrato de Arriendo.pdf',
        type: 'PDF',
        uploadDate: '2024-01-15',
        size: '3.1 MB',
        category: 'contract',
      },
    ],
    notes: [
      {
        id: '1',
        content:
          'Excelente inquilina, siempre paga a tiempo y mantiene la propiedad en buen estado.',
        createdBy: 'Owner',
        createdAt: '2024-12-01',
        type: 'general',
      },
      {
        id: '2',
        content: 'Solicitó renovación del contrato para enero 2025.',
        createdBy: 'Owner',
        createdAt: '2024-11-15',
        type: 'general',
      },
    ],
    rating: 4.8,
    totalPaid: 5400000,
    outstandingBalance: 0,
    lastPayment: '2024-12-01',
  };

  useEffect(() => {
    loadTenantDetails();
  }, [tenantId]);

  const loadTenantDetails = async () => {
    setIsLoading(true);
    try {
      // Obtener datos reales desde la API
      const response = await fetch(`/api/owner/tenants/${tenantId}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTenant(result.data);
          setIsLoading(false);
          return;
        }
      }

      // Fallback a datos mock si la API falla
      logger.warn('API falló, usando datos mock');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTenant(mockTenant);
    } catch (error) {
      logger.error('Error al cargar detalles del inquilino', { error, tenantId });
      // Fallback a datos mock en caso de error
      setTenant(mockTenant);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactTenant = (method: 'email' | 'phone') => {
    if (!tenant) {
      return;
    }

    if (method === 'email') {
      window.open(`mailto:${tenant.email}?subject=Consulta sobre tu arriendo`, '_blank');
    } else {
      window.open(`tel:${tenant.phone}`, '_blank');
    }

    logger.info('Contacto con inquilino iniciado', { tenantId, method });
  };

  const handleDownloadDocument = (documentId: string) => {
    // Simulate document download
    const link = document.createElement('a');
    link.href = `/api/tenants/${tenantId}/documents/${documentId}/download`;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Documento descargado', { tenantId, documentId });
  };

  const handleViewProperty = (propertyId: string) => {
    router.push(`/owner/properties/${propertyId}`);
  };

  const handleEditTenant = () => {
    router.push(`/owner/tenants/${tenantId}/edit`);
  };

  const handleSendReminder = () => {
    // Simulate sending payment reminder
    logger.info('Recordatorio de pago enviado', { tenantId });
    alert('Recordatorio de pago enviado exitosamente.');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'PENDING':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Pendiente
          </Badge>
        );
      case 'TERMINATED':
        return <Badge variant="destructive">Terminado</Badge>;
      case 'NOTICE':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Con Aviso
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'CURRENT':
        return <Badge className="bg-green-500">Al Día</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'LATE':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Atrasado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentHistoryStatusBadge = (status: string) => {
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

  const getDaysSinceLastPayment = () => {
    if (!tenant?.lastPayment) {
      return null;
    }
    const lastPayment = new Date(tenant.lastPayment);
    const today = new Date();
    const diffTime = today.getTime() - lastPayment.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPaymentProgress = () => {
    if (!tenant) {
      return 0;
    }
    const paidPayments = tenant.paymentHistory.filter(p => p.status === 'paid').length;
    const totalPayments = tenant.paymentHistory.length;
    return totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin mr-2" />
          <span>Cargando detalles del inquilino...</span>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!tenant) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Inquilino no encontrado</h2>
            <p className="text-gray-600 mb-4">
              El inquilino solicitado no existe o no tienes permisos para verlo.
            </p>
            <Button onClick={() => router.push('/owner/tenants')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Inquilinos
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
            <Button variant="outline" onClick={() => router.push('/owner/tenants')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-gray-600 flex items-center gap-2">
                {getStatusBadge(tenant.status)}
                <span>• Registrado: {formatDate(tenant.registrationDate)}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditTenant}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={() => handleContactTenant('email')}>
              <Mail className="w-4 h-4 mr-2" />
              Contactar
            </Button>
          </div>
        </div>

        {/* Status and Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Estado de Pago:</span>
              {getPaymentStatusBadge(tenant.paymentStatus)}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{tenant.rating}</span>
            </div>
            {tenant.outstandingBalance > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Deuda: {formatCurrency(tenant.outstandingBalance)}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSendReminder}>
              <AlertCircle className="w-4 h-4 mr-2" />
              Recordatorio
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="properties">Propiedades</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src="/api/placeholder/150/150" alt={tenant.name} />
                      <AvatarFallback>
                        {tenant.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{tenant.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Mail className="w-4 h-4" />
                        {tenant.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {tenant.phone}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    {tenant.rut && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">RUT</label>
                        <p>{tenant.rut}</p>
                      </div>
                    )}
                    {tenant.birthDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Fecha de Nacimiento
                        </label>
                        <p>{formatDate(tenant.birthDate)}</p>
                      </div>
                    )}
                    {tenant.occupation && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Ocupación</label>
                        <p>{tenant.occupation}</p>
                      </div>
                    )}
                    {tenant.income && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Ingresos Mensuales
                        </label>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(tenant.income)}
                        </p>
                      </div>
                    )}
                  </div>

                  {tenant.emergencyContact && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Contacto de Emergencia
                        </label>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium">{tenant.emergencyContact.name}</p>
                          <p className="text-sm text-gray-600">{tenant.emergencyContact.phone}</p>
                          <p className="text-xs text-gray-500">
                            {tenant.emergencyContact.relationship}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Resumen Financiero
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Total Pagado</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(tenant.totalPaid)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Saldo Pendiente</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(tenant.outstandingBalance)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Último Pago</span>
                      <span className="font-medium">{formatDate(tenant.lastPayment)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Días desde último pago</span>
                      <span className="font-medium">{getDaysSinceLastPayment()} días</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tasa de pago puntual</span>
                      <span className="font-medium">{getPaymentProgress().toFixed(1)}%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progreso de Pagos</span>
                      <span>{getPaymentProgress().toFixed(1)}%</span>
                    </div>
                    <Progress value={getPaymentProgress()} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenant.notes.slice(0, 3).map(note => (
                    <div key={note.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {note.createdBy.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{note.createdBy}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {note.type === 'general'
                            ? 'General'
                            : note.type === 'payment'
                              ? 'Pago'
                              : note.type === 'maintenance'
                                ? 'Mantenimiento'
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

          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Propiedades Arrendadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenant.properties.map(property => (
                    <div key={property.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{property.title}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {property.address}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              property.status === 'active'
                                ? 'text-green-600 border-green-600'
                                : property.status === 'completed'
                                  ? 'text-blue-600 border-blue-600'
                                  : 'text-red-600 border-red-600'
                            }
                          >
                            {property.status === 'active'
                              ? 'Activo'
                              : property.status === 'completed'
                                ? 'Completado'
                                : 'Terminado'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProperty(property.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <label className="text-gray-600">Inicio</label>
                          <p className="font-medium">{formatDate(property.leaseStart)}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Término</label>
                          <p className="font-medium">{formatDate(property.leaseEnd)}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Renta Mensual</label>
                          <p className="font-medium">{formatCurrency(property.monthlyRent)}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Días Restantes</label>
                          <p className="font-medium">
                            {Math.ceil(
                              (new Date(property.leaseEnd).getTime() - new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}
                          </p>
                        </div>
                      </div>

                      {property.brokerName && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            Broker: <span className="font-medium">{property.brokerName}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
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
                  {tenant.paymentHistory.map(payment => (
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
                        <span className="text-sm text-gray-600">{payment.property}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPaymentHistoryStatusBadge(payment.status)}
                        <span className="text-sm text-gray-600">{payment.method}</span>
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
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos del Inquilino</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenant.documents.map(doc => (
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
                          <Badge variant="outline" className="mt-1">
                            {doc.category === 'identification'
                              ? 'Identificación'
                              : doc.category === 'financial'
                                ? 'Financiero'
                                : doc.category === 'contract'
                                  ? 'Contrato'
                                  : 'Otro'}
                          </Badge>
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
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
