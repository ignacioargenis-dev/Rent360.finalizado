'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  HelpCircle,
  CheckCircle,
  Clock,
  Shield,
  DollarSign,
  Home,
  User,
  Calendar,
  Send,
  AlertCircle,
  Info,
  Eye,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger-minimal';

interface Dispute {
  id: string;
  disputeNumber: string;
  contractId: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  ownerEmail: string;
  disputeType: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
  resolution?: string;
}

export default function TenantDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDisputeDialogOpen, setNewDisputeDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  // Form states for new dispute
  const [disputeData, setDisputeData] = useState({
    disputeType: '',
    description: '',
    amount: '',
    contractId: '',
  });

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/tenant/disputes');
      // const data = await response.json();

      // Mock data for demonstration
      const mockDisputes: Dispute[] = [
        {
          id: 'dispute-1',
          disputeNumber: 'DISPUTE-2024-001',
          contractId: 'contract-1',
          propertyTitle: 'Apartamento Centro Histórico',
          propertyAddress: 'Calle Estado 123, Santiago',
          ownerName: 'Propietarios Unidos Ltda.',
          ownerEmail: 'contacto@propietarios.cl',
          disputeType: 'MAINTENANCE_NOT_COMPLETED',
          description:
            'El propietario no ha completado las reparaciones prometidas en el contrato de arriendo.',
          amount: 150000,
          status: 'PENDING',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'dispute-2',
          disputeNumber: 'DISPUTE-2024-002',
          contractId: 'contract-2',
          propertyTitle: 'Casa Los Dominicos',
          propertyAddress: 'Avenida Los Dominicos 456, Las Condes',
          ownerName: 'Inversiones Familiares SpA',
          ownerEmail: 'admin@inversionesfamiliares.cl',
          disputeType: 'DEPOSIT_RETENTION_UNFAIR',
          description:
            'El propietario está reteniendo el depósito de garantía por motivos no válidos.',
          amount: 300000,
          status: 'IN_PROGRESS',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setDisputes(mockDisputes);
    } catch (error) {
      logger.error('Error loading tenant disputes:', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async () => {
    if (!disputeData.disputeType || !disputeData.description) {
      alert('Por favor complete todos los campos requeridos.');
      return;
    }

    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/tenant/disputes', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(disputeData),
      // });

      alert(
        `Disputa creada exitosamente!\n\nTipo: ${disputeData.disputeType}\nMonto: $${parseInt(disputeData.amount).toLocaleString()}\n\nSe ha notificado al propietario y al equipo de mediación de Rent360. Recibirás una confirmación por email.`
      );

      setNewDisputeDialogOpen(false);
      setDisputeData({
        disputeType: '',
        description: '',
        amount: '',
        contractId: '',
      });

      // Refresh disputes
      await loadDisputes();
    } catch (error) {
      logger.error('Error creating dispute:', { error });
      alert('Error al crear la disputa. Intente nuevamente.');
    }
  };

  const handleContactSupport = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    // TODO: Implement contact support functionality
    alert(
      `Conectando con soporte especializado para la disputa ${dispute.disputeNumber}\n\nUn mediador de Rent360 te contactará pronto.`
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800">En Proceso</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-green-100 text-green-800">Resuelta</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      MAINTENANCE_NOT_COMPLETED: 'Mantenimiento No Completado',
      DEPOSIT_RETENTION_UNFAIR: 'Retención Indebida de Depósito',
      CONTRACT_VIOLATION: 'Violación de Contrato',
      PROPERTY_CONDITION: 'Estado de la Propiedad',
      PAYMENT_ISSUES: 'Problemas de Pago',
      OTHER: 'Otro',
    };
    return labels[type] || type;
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

  const commonDisputeTypes = [
    {
      type: 'MAINTENANCE_NOT_COMPLETED',
      title: 'Mantenimiento No Realizado',
      description: 'Reparaciones o mantenimientos prometidos no han sido completados',
      icon: '🛠️',
    },
    {
      type: 'DEPOSIT_RETENTION_UNFAIR',
      title: 'Retención de Depósito',
      description: 'El propietario retiene el depósito por motivos no válidos',
      icon: '💰',
    },
    {
      type: 'CONTRACT_VIOLATION',
      title: 'Incumplimiento Contractual',
      description: 'El propietario viola términos del contrato de arriendo',
      icon: '📄',
    },
    {
      type: 'PROPERTY_CONDITION',
      title: 'Estado de la Propiedad',
      description: 'La propiedad no cumple con las condiciones acordadas',
      icon: '🏠',
    },
  ];

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Mis Disputas" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando disputas...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Centro de Disputas"
      subtitle="Herramientas para resolver conflictos de arriendo de manera justa y eficiente"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="my-disputes" className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="my-disputes">Mis Disputas</TabsTrigger>
            <TabsTrigger value="new-dispute">Nueva Disputa</TabsTrigger>
            <TabsTrigger value="help">Ayuda</TabsTrigger>
            <TabsTrigger value="resources">Recursos</TabsTrigger>
          </TabsList>

          <TabsContent value="my-disputes">
            {/* Disputes List */}
            <div className="space-y-4">
              {disputes.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No tienes disputas activas
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Si tienes algún problema con tu arriendo, puedes iniciar una disputa aquí.
                    </p>
                    <Button onClick={() => setNewDisputeDialogOpen(true)}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Iniciar Nueva Disputa
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                disputes.map(dispute => (
                  <Card key={dispute.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Disputa {dispute.disputeNumber}
                                </h3>
                                {getStatusBadge(dispute.status)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {getDisputeTypeLabel(dispute.disputeType)} • Iniciada{' '}
                                {formatDate(dispute.createdAt)}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                Propiedad: {dispute.propertyTitle}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="font-medium">Propietario:</span>
                                <p className="truncate">{dispute.ownerName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="font-medium">Monto en disputa:</span>
                                <p className="font-semibold text-red-600">
                                  {formatCurrency(dispute.amount)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-700">Descripción:</span>
                            <p className="text-sm text-gray-600 mt-1">{dispute.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:min-w-[200px]">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDispute(dispute)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleContactSupport(dispute)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contactar Soporte
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="new-dispute">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Common Dispute Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Disputas Comunes</CardTitle>
                  <CardDescription>
                    Selecciona el tipo de problema que estás experimentando
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {commonDisputeTypes.map(disputeType => (
                    <div
                      key={disputeType.type}
                      className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      onClick={() => {
                        setDisputeData(prev => ({ ...prev, disputeType: disputeType.type }));
                        setNewDisputeDialogOpen(true);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{disputeType.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{disputeType.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{disputeType.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Help and Guidance */}
              <Card>
                <CardHeader>
                  <CardTitle>¿Necesitas Ayuda?</CardTitle>
                  <CardDescription>Guía paso a paso para iniciar tu disputa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-blue-600">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Reúne tu evidencia</h4>
                        <p className="text-xs text-gray-600">Fotos, correos, contratos, etc.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-blue-600">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Describe claramente</h4>
                        <p className="text-xs text-gray-600">Explica el problema detalladamente</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-blue-600">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Envía la disputa</h4>
                        <p className="text-xs text-gray-600">Nosotros nos encargamos del resto</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setHelpDialogOpen(true)}
                      className="w-full"
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Más Información
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="help">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>¿Qué es una disputa?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm text-gray-600">
                    <p>
                      Una disputa es un mecanismo formal para resolver conflictos entre inquilinos y
                      propietarios de manera justa y eficiente, con la mediación de Rent360.
                    </p>
                    <p>
                      <strong>Beneficios:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Resolución imparcial y profesional</li>
                      <li>Proceso más rápido que los tribunales</li>
                      <li>Costos significativamente menores</li>
                      <li>Posibilidad de mantener buena relación</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Proceso de Resolución</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Inicio</h4>
                        <p className="text-xs text-gray-600">Presentas tu disputa con evidencia</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Mediación</h4>
                        <p className="text-xs text-gray-600">Nuestro equipo facilita el diálogo</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Resolución</h4>
                        <p className="text-xs text-gray-600">Acuerdo vinculante o recomendación</p>
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
                  <CardTitle className="text-lg">Documentos Útiles</CardTitle>
                  <CardDescription>Plantillas y formularios</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Modelo de Carta de Disputa
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Lista de Verificación
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Guía de Evidencia
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Derechos del Inquilino</CardTitle>
                  <CardDescription>Información legal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Info className="w-4 h-4 mr-2" />
                    Ley de Arrendamiento
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Info className="w-4 h-4 mr-2" />
                    Derechos Básicos
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Info className="w-4 h-4 mr-2" />
                    Casos Precedentes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contacto de Emergencia</CardTitle>
                  <CardDescription>Soporte inmediato</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Línea de Emergencia
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Email de Soporte
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat en Vivo
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* New Dispute Dialog */}
        <Dialog open={newDisputeDialogOpen} onOpenChange={setNewDisputeDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Iniciar Nueva Disputa</DialogTitle>
              <DialogDescription>
                Describe tu problema para que podamos ayudarte a resolverlo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de Disputa</label>
                <select
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  value={disputeData.disputeType}
                  onChange={e => setDisputeData(prev => ({ ...prev, disputeType: e.target.value }))}
                >
                  <option value="">Selecciona un tipo</option>
                  {commonDisputeTypes.map(type => (
                    <option key={type.type} value={type.type}>
                      {type.icon} {type.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Monto en Disputa (opcional)</label>
                <input
                  type="number"
                  placeholder="Ingresa el monto si aplica"
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  value={disputeData.amount}
                  onChange={e => setDisputeData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descripción Detallada</label>
                <Textarea
                  placeholder="Describe claramente el problema, cuándo ocurrió, qué has intentado resolver, y qué solución esperas..."
                  className="mt-1"
                  rows={6}
                  value={disputeData.description}
                  onChange={e => setDisputeData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">
                  💡 Consejos para una buena disputa:
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Sé específico sobre fechas, montos y hechos</li>
                  <li>• Incluye evidencia: fotos, correos, contratos</li>
                  <li>• Mantén un tono profesional y objetivo</li>
                  <li>• Explica claramente qué resolución esperas</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setNewDisputeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateDispute}
                disabled={!disputeData.disputeType || !disputeData.description.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Iniciar Disputa
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Help Dialog */}
        <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Centro de Ayuda - Disputas</DialogTitle>
              <DialogDescription>
                Información completa sobre el proceso de disputas en Rent360
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <h4 className="font-medium mb-2">¿Cuándo iniciar una disputa?</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• El propietario no cumple con reparaciones acordadas</li>
                  <li>• Retención injustificada del depósito de garantía</li>
                  <li>• Violación de términos contractuales</li>
                  <li>• Problemas con el estado de la propiedad</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">¿Qué necesitas para iniciar?</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Descripción clara del problema</li>
                  <li>• Evidencia: fotos, correos, contratos</li>
                  <li>• Información de contacto actualizada</li>
                  <li>• Expectativas de resolución</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Proceso típico:</h4>
                <ol className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>1. Presentas la disputa con evidencia</li>
                  <li>2. Contactamos al propietario</li>
                  <li>3. Facilitamos la mediación</li>
                  <li>4. Llegamos a un acuerdo o emitimos recomendación</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setHelpDialogOpen(false)}>Entendido</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
