'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gavel, 
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
  Scale,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { useToast } from '@/components/notifications/NotificationSystem';
import { useAuth } from '@/components/auth/AuthProvider';

interface LegalCase {
  id: string;
  contractId: string;
  requesterId: string;
  caseType: 'rent_arrears' | 'property_damage' | 'contract_breach' | 'eviction' | 'other';
  description: string;
  amount: number;
  documents?: string[];
  evidence?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number;
  legalBasis: string;
  requestedActions: string[];
  notes?: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  adminNotes?: string;
  rejectionReason?: string;
  nextHearingDate?: string;
  courtCaseNumber?: string;
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
  requester: {
    name: string;
    email: string;
    role: string;
  };
  assignedLawyer?: {
    name: string;
    email: string;
  };
  admin?: {
    name: string;
    email: string;
  };
}

interface LegalCaseFormData {
  contractId: string;
  caseType: 'rent_arrears' | 'property_damage' | 'contract_breach' | 'eviction' | 'other';
  description: string;
  amount: number;
  documents: string[];
  evidence: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number;
  legalBasis: string;
  requestedActions: string[];
  notes: string;
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  in_review: 'En Revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  in_progress: 'En Progreso',
  completed: 'Completada',
  cancelled: 'Cancelada'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
};

const CASE_TYPE_LABELS = {
  rent_arrears: 'Mora en el Pago',
  property_damage: 'Daños a la Propiedad',
  contract_breach: 'Incumplimiento de Contrato',
  eviction: 'Desalojo',
  other: 'Otro'
};

export default function LegalCasesManagement() {
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);
  const [formData, setFormData] = useState<LegalCaseFormData>({
    contractId: '',
    caseType: 'rent_arrears',
    description: '',
    amount: 0,
    documents: [],
    evidence: [],
    priority: 'medium',
    estimatedDuration: 30,
    legalBasis: '',
    requestedActions: [],
    notes: ''
  });
  const [activeTab, setActiveTab] = useState('all');
  const [contracts, setContracts] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    fetchLegalCases();
    if (['OWNER', 'BROKER', 'ADMIN'].includes(user?.role || '')) {
      fetchContracts();
    }
  }, [user]);

  const fetchLegalCases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      
      const response = await fetch(`/api/legal/cases?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error obteniendo causas legales');
      }

      const data = await response.json();
      setLegalCases(data.data || []);
    } catch (err) {
      error('Error', 'Error cargando causas legales: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts?status=ACTIVE,EXPIRED');
      if (response.ok) {
        const data = await response.json();
        setContracts(data.data || []);
      }
    } catch (err) {
      logger.error('Error obteniendo contratos:', { error: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.contractId || !formData.description || !formData.amount || !formData.legalBasis || formData.requestedActions.length === 0) {
        error('Error', 'Por favor completa todos los campos requeridos');
        return;
      }

      const response = await fetch('/api/legal/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando causa legal');
      }

      const result = await response.json();

      // Solo resetear y cerrar el formulario si la operación fue exitosa
      success('Éxito', 'Causa legal creada exitosamente');
      setShowForm(false);
      setFormData({
        contractId: '',
        caseType: 'rent_arrears',
        description: '',
        amount: 0,
        documents: [],
        evidence: [],
        priority: 'medium',
        estimatedDuration: 30,
        legalBasis: '',
        requestedActions: [],
        notes: ''
      });

      // Recargar la lista de casos legales
      await fetchLegalCases();
    } catch (err) {
      error('Error', 'Error creando causa legal: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleStatusUpdate = async (caseId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch('/api/legal/cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalCaseId: caseId,
          status: newStatus,
          adminNotes: notes
        })
      });

      if (!response.ok) {
        throw new Error('Error actualizando estado');
      }

      success('Éxito', 'Estado de causa legal actualizado exitosamente');
      await fetchLegalCases();
    } catch (err) {
      error('Error', 'Error actualizando estado: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const filteredLegalCases = legalCases.filter(legalCase => {
    if (activeTab !== 'all' && legalCase.status !== activeTab) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        legalCase.contract.property.address.toLowerCase().includes(searchLower) ||
        legalCase.contract.tenant.name.toLowerCase().includes(searchLower) ||
        legalCase.description.toLowerCase().includes(searchLower) ||
        legalCase.requester.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_review': return <Eye className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return <Shield className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></Loader2>
          <p className="mt-2 text-gray-600">Cargando causas legales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Causas Legales</h1>
          <p className="text-gray-600">
            Gestiona las causas legales por mora e incumplimientos de contrato
          </p>
        </div>
        {['OWNER', 'BROKER', 'ADMIN'].includes(user?.role || '') && (
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Causa Legal
          </Button>
        )}
      </div>

      {/* Formulario de nueva causa legal */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Causa Legal</CardTitle>
            <CardDescription>
              Completa los datos para iniciar una nueva causa legal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractId">Contrato</Label>
                <Select
                  value={formData.contractId}
                  onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.property.address} - {contract.property.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="caseType">Tipo de Causa</Label>
                <Select
                  value={formData.caseType}
                  onValueChange={(value: any) => setFormData({ ...formData, caseType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent_arrears">Mora en el Pago</SelectItem>
                    <SelectItem value="property_damage">Daños a la Propiedad</SelectItem>
                    <SelectItem value="contract_breach">Incumplimiento de Contrato</SelectItem>
                    <SelectItem value="eviction">Desalojo</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Monto Reclamado</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción del Caso</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe detalladamente el caso legal..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="legalBasis">Fundamento Legal</Label>
              <Textarea
                id="legalBasis"
                value={formData.legalBasis}
                onChange={(e) => setFormData({ ...formData, legalBasis: e.target.value })}
                placeholder="Cita las leyes y artículos que fundamentan la causa..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="requestedActions">Acciones Solicitadas</Label>
              <div className="space-y-2">
                {['Pago de deuda', 'Reparación de daños', 'Cumplimiento de contrato', 'Desalojo', 'Indemnización'].map((action) => (
                  <div key={action} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={action}
                      checked={formData.requestedActions.includes(action)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            requestedActions: [...formData.requestedActions, action]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            requestedActions: formData.requestedActions.filter(a => a !== action)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={action} className="text-sm">{action}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedDuration">Duración Estimada (días)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 30 })}
                  placeholder="30"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas opcionales..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                <Send className="h-4 w-4 mr-2" />
                Iniciar Causa Legal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por dirección, inquilino, solicitante o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="in_review">En Revisión</SelectItem>
            <SelectItem value="approved">Aprobadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las prioridades</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs de estados */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="in_review">En Revisión</TabsTrigger>
          <TabsTrigger value="approved">Aprobadas</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
          <TabsTrigger value="in_progress">En Progreso</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredLegalCases.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No hay causas legales en este estado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredLegalCases.map((legalCase) => (
                <Card key={legalCase.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <Gavel className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {CASE_TYPE_LABELS[legalCase.caseType]}
                          </CardTitle>
                          <CardDescription>
                            {legalCase.contract.property.address}, {legalCase.contract.property.city}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={PRIORITY_COLORS[legalCase.priority]}>
                          <div className="flex items-center gap-1">
                            {getPriorityIcon(legalCase.priority)}
                            {PRIORITY_LABELS[legalCase.priority]}
                          </div>
                        </Badge>
                        <Badge className={STATUS_COLORS[legalCase.status]}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(legalCase.status)}
                            {STATUS_LABELS[legalCase.status]}
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Inquilino</Label>
                        <p className="text-sm">{legalCase.contract.tenant.name}</p>
                        <p className="text-xs text-gray-500">{legalCase.contract.tenant.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Solicitante</Label>
                        <p className="text-sm">{legalCase.requester.name}</p>
                        <p className="text-xs text-gray-500">{legalCase.requester.email} ({legalCase.requester.role})</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-600">Descripción</Label>
                      <p className="text-sm">{legalCase.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Monto Reclamado</Label>
                        <p className="text-sm font-semibold">${legalCase.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Duración Estimada</Label>
                        <p className="text-sm">{legalCase.estimatedDuration} días</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Acciones Solicitadas</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {legalCase.requestedActions.map((action, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-600">Fundamento Legal</Label>
                      <p className="text-sm text-gray-700">{legalCase.legalBasis}</p>
                    </div>

                    {legalCase.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium text-gray-600">Notas</Label>
                        <p className="text-sm text-gray-700">{legalCase.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Solicitada: {new Date(legalCase.createdAt).toLocaleDateString()}</span>
                      <span>Actualizada: {new Date(legalCase.updatedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Acciones según rol y estado */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      {user?.role === 'ADMIN' && ['pending', 'in_review'].includes(legalCase.status) && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(legalCase.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(legalCase.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                          {legalCase.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(legalCase.id, 'in_review')}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Enviar a Revisión
                            </Button>
                          )}
                        </>
                      )}
                      
                      {['OWNER', 'BROKER'].includes(user?.role || '') && legalCase.requesterId === user?.id && ['pending', 'in_review'].includes(legalCase.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCase(legalCase);
                            setFormData({
                              contractId: legalCase.contractId,
                              caseType: legalCase.caseType,
                              description: legalCase.description,
                              amount: legalCase.amount,
                              documents: legalCase.documents || [],
                              evidence: legalCase.evidence || [],
                              priority: legalCase.priority,
                              estimatedDuration: legalCase.estimatedDuration,
                              legalBasis: legalCase.legalBasis,
                              requestedActions: legalCase.requestedActions,
                              notes: legalCase.notes || ''
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
