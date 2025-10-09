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
  Shield,
  CheckCircle,
  Clock,
  DollarSign,
  Home,
  User,
  Calendar,
  Send,
  AlertCircle,
  Info,
  TrendingUp,
  Users,
  BarChart3,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger';

interface Dispute {
  id: string;
  disputeNumber: string;
  contractId: string;
  propertyTitle: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  disputeType: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
  resolution?: string;
  riskLevel?: string;
}

export default function OwnerDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [settlementOffer, setSettlementOffer] = useState('');

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/owner/disputes');
      // const data = await response.json();

      // Mock data for demonstration
      const mockDisputes: Dispute[] = [
        {
          id: 'dispute-1',
          disputeNumber: 'DISPUTE-2024-001',
          contractId: 'contract-1',
          propertyTitle: 'Apartamento Centro Histórico',
          propertyAddress: 'Calle Estado 123, Santiago',
          tenantName: 'María González',
          tenantEmail: 'maria.gonzalez@email.com',
          disputeType: 'MAINTENANCE_NOT_COMPLETED',
          description:
            'La inquilina reclama que no se han completado las reparaciones acordadas en el contrato.',
          amount: 150000,
          status: 'PENDING',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          riskLevel: 'MEDIUM',
        },
        {
          id: 'dispute-2',
          disputeNumber: 'DISPUTE-2024-002',
          contractId: 'contract-2',
          propertyTitle: 'Casa Los Dominicos',
          propertyAddress: 'Avenida Los Dominicos 456, Las Condes',
          tenantName: 'Carlos Rodríguez',
          tenantEmail: 'carlos.rodriguez@email.com',
          disputeType: 'DEPOSIT_RETENTION_UNFAIR',
          description: 'La inquilina cuestiona la retención del depósito por daños menores.',
          amount: 200000,
          status: 'IN_PROGRESS',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          riskLevel: 'HIGH',
        },
      ];

      setDisputes(mockDisputes);
    } catch (error) {
      logger.error('Error loading owner disputes:', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResponseText(`Estimada/o ${dispute.tenantName},

He recibido su disputa respecto al contrato de arriendo de la propiedad "${dispute.propertyTitle}".

Me gustaría aclarar lo siguiente:

[Su respuesta aquí]

Estoy dispuesto/a a resolver esta situación de manera amistosa. Le propongo que nos reunamos para discutir los detalles.

Atentamente,
[Su Nombre]
Propietario`);
    setResponseDialogOpen(true);
  };

  const handleOfferSettlement = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setSettlementOffer((dispute.amount * 0.8).toString());
    setSettlementDialogOpen(true);
  };

  const submitResponse = async () => {
    if (!selectedDispute || !responseText.trim()) {
      return;
    }

    try {
      // TODO: Implement actual API call
      alert(
        `Respuesta enviada para la disputa ${selectedDispute.disputeNumber}\n\nEl inquilino será notificado y Rent360 facilitará la mediación.`
      );

      setResponseDialogOpen(false);
      setSelectedDispute(null);
      setResponseText('');
    } catch (error) {
      logger.error('Error sending response:', { error });
      alert('Error al enviar respuesta. Intente nuevamente.');
    }
  };

  const submitSettlement = async () => {
    if (!selectedDispute || !settlementOffer) {
      return;
    }

    try {
      // TODO: Implement actual API call
      alert(
        `Propuesta de acuerdo enviada: $${parseInt(settlementOffer).toLocaleString()}\n\nEl inquilino será notificado de la oferta de conciliación.`
      );

      setSettlementDialogOpen(false);
      setSelectedDispute(null);
      setSettlementOffer('');
    } catch (error) {
      logger.error('Error sending settlement:', { error });
      alert('Error al enviar propuesta. Intente nuevamente.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente Respuesta</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800">En Mediación</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-green-100 text-green-800">Resuelta</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'LOW':
        return (
          <Badge variant="outline" className="border-green-300 text-green-700">
            Riesgo Bajo
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            Riesgo Medio
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="outline" className="border-orange-300 text-orange-700">
            Riesgo Alto
          </Badge>
        );
      case 'CRITICAL':
        return (
          <Badge variant="outline" className="border-red-300 text-red-700">
            Riesgo Crítico
          </Badge>
        );
      default:
        return <Badge variant="outline">Sin evaluar</Badge>;
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      MAINTENANCE_NOT_COMPLETED: 'Mantenimiento Pendiente',
      DEPOSIT_RETENTION_UNFAIR: 'Disputa por Depósito',
      CONTRACT_VIOLATION: 'Incumplimiento Contractual',
      PROPERTY_CONDITION: 'Estado de Propiedad',
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

  const preventiveTips = [
    {
      title: 'Inspección Previa',
      description: 'Realiza inspecciones detalladas antes y después del arriendo',
      icon: '🔍',
    },
    {
      title: 'Contrato Detallado',
      description: 'Incluye cláusulas claras sobre mantenimientos y depósitos',
      icon: '📄',
    },
    {
      title: 'Comunicación Constante',
      description: 'Mantén contacto regular con tus inquilinos',
      icon: '💬',
    },
    {
      title: 'Mantenimiento Preventivo',
      description: 'Realiza mantenimientos regulares para evitar problemas',
      icon: '🔧',
    },
  ];

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Gestión de Disputas" subtitle="Cargando información...">
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
      title="Centro de Disputas para Propietarios"
      subtitle="Herramientas profesionales para manejar conflictos y prevenir problemas"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="active-disputes" className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active-disputes">Disputas Activas</TabsTrigger>
            <TabsTrigger value="preventive">Prevención</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="resources">Recursos</TabsTrigger>
          </TabsList>

          <TabsContent value="active-disputes">
            {/* Disputes List */}
            <div className="space-y-4">
              {disputes.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No hay disputas activas
                    </h3>
                    <p className="text-gray-600">
                      ¡Excelente! No tienes disputas pendientes en este momento.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                disputes.map(dispute => (
                  <Card
                    key={dispute.id}
                    className={`hover:shadow-md transition-shadow ${
                      dispute.riskLevel === 'CRITICAL'
                        ? 'border-red-300 bg-red-50'
                        : dispute.riskLevel === 'HIGH'
                          ? 'border-orange-300 bg-orange-50'
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
                                  Disputa {dispute.disputeNumber}
                                </h3>
                                {getStatusBadge(dispute.status)}
                                {getRiskBadge(dispute.riskLevel)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {getDisputeTypeLabel(dispute.disputeType)} • Iniciada por inquilino
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                Propiedad: {dispute.propertyTitle} • Inquilino: {dispute.tenantName}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-red-600">
                                {formatCurrency(dispute.amount)}
                              </div>
                              <div className="text-xs text-gray-500">Monto en disputa</div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-700">
                              Reclamo del inquilino:
                            </span>
                            <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded-lg">
                              {dispute.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Iniciada: {formatDate(dispute.createdAt)}</span>
                            <span>Estado: Requiere tu respuesta</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:min-w-[250px]">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDispute(dispute)}
                            >
                              <Info className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`mailto:${dispute.tenantEmail}`)}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Contactar
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleRespondToDispute(dispute)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Responder
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOfferSettlement(dispute)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Ofrecer Acuerdo
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="preventive">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Preventive Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Estrategias Preventivas</CardTitle>
                  <CardDescription>Minimiza riesgos y evita disputas futuras</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {preventiveTips.map((tip, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{tip.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{tip.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle>Evaluación de Riesgos</CardTitle>
                  <CardDescription>Identifica y mitiga riesgos potenciales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium">Propiedades sin inspección</span>
                      <Badge variant="destructive">Alto Riesgo</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium">Contratos sin cláusulas claras</span>
                      <Badge className="bg-orange-100 text-orange-800">Riesgo Medio</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium">Comunicación limitada</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Riesgo Bajo</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Mantenimiento al día</span>
                      <Badge className="bg-green-100 text-green-800">Sin Riesgo</Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button className="w-full">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Ver Reporte Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Disputas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total de disputas:</span>
                      <span className="font-semibold">{disputes.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tasa de resolución:</span>
                      <span className="font-semibold text-green-600">
                        {disputes.length > 0
                          ? (
                              (disputes.filter(d => d.status === 'RESOLVED').length /
                                disputes.length) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Monto promedio disputado:</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          disputes.length > 0
                            ? disputes.reduce((sum, d) => sum + d.amount, 0) / disputes.length
                            : 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tiempo promedio de resolución:</span>
                      <span className="font-semibold">15 días</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Disputas Más Comunes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      'MAINTENANCE_NOT_COMPLETED',
                      'DEPOSIT_RETENTION_UNFAIR',
                      'CONTRACT_VIOLATION',
                      'PROPERTY_CONDITION',
                    ].map(type => {
                      const count = disputes.filter(d => d.disputeType === type).length;
                      const percentage =
                        disputes.length > 0 ? ((count / disputes.length) * 100).toFixed(1) : '0';
                      return (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm">{getDisputeTypeLabel(type)}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Plantillas Legales</CardTitle>
                  <CardDescription>Documentos profesionales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Respuesta a Disputa
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Acuerdo de Conciliación
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Carta de Intención
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Guías de Prevención</CardTitle>
                  <CardDescription>Mejores prácticas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Info className="w-4 h-4 mr-2" />
                    Checklist de Arriendo
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Info className="w-4 h-4 mr-2" />
                    Guía de Mantenimiento
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Info className="w-4 h-4 mr-2" />
                    Derechos del Propietario
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Soporte Profesional</CardTitle>
                  <CardDescription>Asistencia especializada</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Abogado Especialista
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Consultoría Legal
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Mediador Certificado
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Response Dialog */}
        <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Responder a Disputa</DialogTitle>
              <DialogDescription>
                Envía tu respuesta formal a la disputa {selectedDispute?.disputeNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tu Respuesta</label>
                <Textarea
                  placeholder="Explica tu versión de los hechos, proporciona evidencia si es necesario..."
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  className="mt-1"
                  rows={8}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  💡 Recomendaciones para tu respuesta:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Mantén un tono profesional y objetivo</li>
                  <li>• Proporciona evidencia que respalde tu posición</li>
                  <li>• Ofrece soluciones constructivas</li>
                  <li>• Incluye fechas y detalles específicos</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={submitResponse}
                disabled={!responseText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Respuesta
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settlement Dialog */}
        <Dialog open={settlementDialogOpen} onOpenChange={setSettlementDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ofrecer Acuerdo de Conciliación</DialogTitle>
              <DialogDescription>
                Propón un acuerdo para resolver la disputa {selectedDispute?.disputeNumber} de
                manera amistosa
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Monto Propuesto</label>
                <input
                  type="number"
                  placeholder="Ingresa el monto que estás dispuesto a aceptar"
                  value={settlementOffer}
                  onChange={e => setSettlementOffer(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                />
                {selectedDispute && (
                  <p className="text-xs text-gray-600 mt-1">
                    Monto original en disputa: {formatCurrency(selectedDispute.amount)}
                    {settlementOffer &&
                      ` • Ahorro: ${formatCurrency(selectedDispute.amount - parseInt(settlementOffer))}`}
                  </p>
                )}
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">✅ Beneficios de un acuerdo:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Resolución rápida y económica</li>
                  <li>• Evita costos legales adicionales</li>
                  <li>• Mantiene relación cordial con inquilino</li>
                  <li>• Posibilidad de recuperar propiedad más rápido</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSettlementDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={submitSettlement}
                disabled={!settlementOffer}
                className="bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Enviar Propuesta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
