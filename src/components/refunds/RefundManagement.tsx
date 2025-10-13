'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  FileText,
  Building,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Edit,
  Eye,
  Loader2,
  Download,
  Send,
} from 'lucide-react';
import { useToast } from '@/components/notifications/NotificationSystem';
import { useAuth } from '@/components/auth/AuthProviderSimple';

interface Refund {
  id: string;
  contractId: string;
  tenantId: string;
  amount: number;
  reason: string;
  description?: string;
  documents?: string[];
  bankAccount?: {
    accountNumber: string;
    accountType: 'checking' | 'savings';
    bankName: string;
    rut: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  contract: {
    property: {
      address: string;
      city: string;
      commune: string;
    };
    tenant: {
      name: string;
      email: string;
      rut: string;
    };
    owner: {
      name: string;
      email: string;
    };
  };
  tenant: {
    name: string;
    email: string;
    rut: string;
  };
  admin?: {
    name: string;
    email: string;
  };
}

interface RefundFormData {
  contractId: string;
  amount: number;
  reason: string;
  description: string;
  documents: string[];
  bankAccount: {
    accountNumber: string;
    accountType: 'checking' | 'savings';
    bankName: string;
    rut: string;
  };
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  processing: 'Procesando',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export default function RefundManagement() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRefund, setEditingRefund] = useState<Refund | null>(null);
  const [formData, setFormData] = useState<RefundFormData>({
    contractId: '',
    amount: 0,
    reason: '',
    description: '',
    documents: [],
    bankAccount: {
      accountNumber: '',
      accountType: 'checking',
      bankName: '',
      rut: '',
    },
  });
  const [activeTab, setActiveTab] = useState('all');
  const [contracts, setContracts] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    fetchRefunds();
    if (user?.role === 'TENANT') {
      fetchContracts();
    }
  }, [user]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/refunds?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Error obteniendo reembolsos');
      }

      const data = await response.json();
      setRefunds(data.data || []);
    } catch (err) {
      error(
        'Error',
        'Error cargando reembolsos: ' + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts?status=COMPLETED,TERMINATED');
      if (response.ok) {
        const data = await response.json();
        setContracts(data.data || []);
      }
    } catch (err) {
      logger.error('Error obteniendo contratos:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.contractId || !formData.amount || !formData.reason) {
        error('Error', 'Por favor completa todos los campos requeridos');
        return;
      }

      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando solicitud');
      }

      success('Éxito', 'Solicitud de reembolso creada exitosamente');
      setShowForm(false);
      setFormData({
        contractId: '',
        amount: 0,
        reason: '',
        description: '',
        documents: [],
        bankAccount: {
          accountNumber: '',
          accountType: 'checking',
          bankName: '',
          rut: '',
        },
      });
      await fetchRefunds();
    } catch (err) {
      error(
        'Error',
        'Error creando solicitud: ' + (err instanceof Error ? err.message : String(err))
      );
    }
  };

  const handleStatusUpdate = async (refundId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch('/api/refunds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundId,
          status: newStatus,
          adminNotes: notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Error actualizando estado');
      }

      success('Éxito', 'Estado de reembolso actualizado exitosamente');
      await fetchRefunds();
    } catch (err) {
      error(
        'Error',
        'Error actualizando estado: ' + (err instanceof Error ? err.message : String(err))
      );
    }
  };

  const filteredRefunds = refunds.filter(refund => {
    if (activeTab !== 'all' && refund.status !== activeTab) {
      return false;
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        refund.contract.property.address.toLowerCase().includes(searchLower) ||
        refund.tenant.name.toLowerCase().includes(searchLower) ||
        refund.reason.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></Loader2>
          <p className="mt-2 text-gray-600">Cargando reembolsos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Reembolsos</h1>
          <p className="text-gray-600">Gestiona las solicitudes de reembolso de garantías</p>
        </div>
        {user?.role === 'TENANT' && (
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        )}
      </div>

      {/* Formulario de nueva solicitud */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Solicitud de Reembolso</CardTitle>
            <CardDescription>
              Completa los datos para solicitar el reembolso de tu garantía
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractId">Contrato</Label>
                <Select
                  value={formData.contractId}
                  onValueChange={value => setFormData({ ...formData, contractId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map(contract => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.property.address} - {contract.property.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Monto a Reembolsar</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={e =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Motivo del Reembolso</Label>
              <Select
                value={formData.reason}
                onValueChange={value => setFormData({ ...formData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract_completed">Contrato Completado</SelectItem>
                  <SelectItem value="early_termination">Terminación Anticipada</SelectItem>
                  <SelectItem value="property_issues">Problemas con la Propiedad</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Descripción Adicional</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el motivo del reembolso..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Banco</Label>
                <Input
                  id="bankName"
                  value={formData.bankAccount.bankName}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount, bankName: e.target.value },
                    })
                  }
                  placeholder="Nombre del banco"
                />
              </div>
              <div>
                <Label htmlFor="accountType">Tipo de Cuenta</Label>
                <Select
                  value={formData.bankAccount.accountType}
                  onValueChange={(value: 'checking' | 'savings') =>
                    setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount, accountType: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Cuenta Corriente</SelectItem>
                    <SelectItem value="savings">Cuenta de Ahorro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountNumber">Número de Cuenta</Label>
                <Input
                  id="accountNumber"
                  value={formData.bankAccount.accountNumber}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount, accountNumber: e.target.value },
                    })
                  }
                  placeholder="Número de cuenta"
                />
              </div>
              <div>
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  value={formData.bankAccount.rut}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount, rut: e.target.value },
                    })
                  }
                  placeholder="RUT del titular"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                <Send className="h-4 w-4 mr-2" />
                Enviar Solicitud
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por dirección, inquilino o motivo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="approved">Aprobados</SelectItem>
            <SelectItem value="rejected">Rechazados</SelectItem>
            <SelectItem value="processing">Procesando</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs de estados */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="approved">Aprobados</TabsTrigger>
          <TabsTrigger value="rejected">Rechazados</TabsTrigger>
          <TabsTrigger value="processing">Procesando</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredRefunds.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No hay reembolsos en este estado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRefunds.map(refund => (
                <Card key={refund.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Reembolso por ${refund.amount.toLocaleString()}
                          </CardTitle>
                          <CardDescription>
                            {refund.contract.property.address}, {refund.contract.property.city}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={STATUS_COLORS[refund.status]}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(refund.status)}
                          {STATUS_LABELS[refund.status]}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Inquilino</Label>
                        <p className="text-sm">{refund.tenant.name}</p>
                        <p className="text-xs text-gray-500">{refund.tenant.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Propietario</Label>
                        <p className="text-sm">{refund.contract.owner.name}</p>
                        <p className="text-xs text-gray-500">{refund.contract.owner.email}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-600">Motivo</Label>
                      <p className="text-sm">{refund.reason}</p>
                      {refund.description && (
                        <p className="text-sm text-gray-600 mt-1">{refund.description}</p>
                      )}
                    </div>

                    {refund.bankAccount && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium text-gray-600">
                          Información Bancaria
                        </Label>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                          <div>
                            <span className="font-medium">Banco:</span>{' '}
                            {refund.bankAccount.bankName}
                          </div>
                          <div>
                            <span className="font-medium">Tipo:</span>{' '}
                            {refund.bankAccount.accountType === 'checking' ? 'Corriente' : 'Ahorro'}
                          </div>
                          <div>
                            <span className="font-medium">Cuenta:</span>{' '}
                            {refund.bankAccount.accountNumber}
                          </div>
                          <div>
                            <span className="font-medium">RUT:</span> {refund.bankAccount.rut}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Solicitado: {new Date(refund.createdAt).toLocaleDateString()}</span>
                      <span>Actualizado: {new Date(refund.updatedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Acciones según rol y estado */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      {user?.role === 'ADMIN' && refund.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(refund.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(refund.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </>
                      )}

                      {user?.role === 'TENANT' && refund.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingRefund(refund);
                            setFormData({
                              contractId: refund.contractId,
                              amount: refund.amount,
                              reason: refund.reason,
                              description: refund.description || '',
                              documents: refund.documents || [],
                              bankAccount: refund.bankAccount || {
                                accountNumber: '',
                                accountType: 'checking',
                                bankName: '',
                                rut: '',
                              },
                            });
                            setShowForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}

                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
