'use client';

import React, { useState, useEffect } from 'react';

// Forzar renderizado dinámico para evitar problemas de autenticación durante build
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Download,
  PenTool,
  Eye,
  MessageSquare,
  RefreshCw,
  Building,
  Home,
  Edit,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Contract } from '@/types';
import ElectronicSignature from '@/components/contracts/ElectronicSignature';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Usar el tipo Contract importado de @/types

export default function TenantContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // 'csv', 'json'
    status: 'all', // filtro por estado
  });
  const { user } = useAuth();

  useEffect(() => {
    loadContracts();
  }, [refreshTrigger]);

  const loadContracts = async () => {
    try {
      setLoading(true);

      // Obtener datos reales desde la API
      const response = await fetch('/api/tenant/contracts', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Validar y transformar contratos para asegurar datos seguros
          const validatedContracts = result.data.map((contract: any) => ({
            ...contract,
            // Asegurar que las fechas sean objetos Date válidos
            startDate: contract.startDate ? new Date(contract.startDate) : new Date(),
            endDate: contract.endDate ? new Date(contract.endDate) : new Date(),
            signedAt: contract.signedAt ? new Date(contract.signedAt) : null,
            terminatedAt: contract.terminatedAt ? new Date(contract.terminatedAt) : null,
            createdAt: contract.createdAt ? new Date(contract.createdAt) : new Date(),
            updatedAt: contract.updatedAt ? new Date(contract.updatedAt) : new Date(),
            property: {
              ...(contract as any).property,
              // Asegurar que features sea un array
              features: Array.isArray((contract as any).property?.features) ? (contract as any).property.features : [],
              // Asegurar que availableFrom sea una fecha válida si existe
              availableFrom: (contract as any).property?.availableFrom ? new Date((contract as any).property.availableFrom) : null,
            }
          }));
          setContracts(validatedContracts);
          setLoading(false);
          return;
        }
      }

      // Fallback a datos mock si la API falla
      logger.warn('API falló, usando datos mock');

      setTimeout(() => {
        setContracts([]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      logger.error('Error cargando contratos:', { error });
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleExportContracts = () => {
    logger.info('Abriendo opciones de exportación de contratos');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando contratos del inquilino', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.status !== 'all') {
        params.append('status', exportOptions.status);
      }

      // Crear URL de descarga
      const exportUrl = `/api/tenant/contracts/export?${params.toString()}`;

      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `contratos_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportDialog(false);

      // Resetear opciones de exportación
      setExportOptions({
        format: 'csv',
        status: 'all',
      });

      logger.info('Exportación de contratos completada exitosamente');
    } catch (error) {
      logger.error('Error exportando contratos:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar los contratos. Por favor, intenta nuevamente.');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'DRAFT':
        return <PenTool className="h-4 w-4 text-blue-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'EXPIRED':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'TERMINATED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'DRAFT':
        return <Badge className="bg-blue-100 text-blue-800">Pendiente de Firma</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-orange-100 text-orange-800">Expirado</Badge>;
      case 'TERMINATED':
        return <Badge className="bg-red-100 text-red-800">Terminado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Mis Contratos" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando contratos...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  // Función para refrescar contratos
  function refreshContracts() {
    setRefreshTrigger(prev => prev + 1);
  }

  return (
    <UnifiedDashboardLayout
      title="Mis Contratos"
      subtitle="Gestiona y firma tus contratos de arriendo"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contratos</p>
                  <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contratos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{contracts.filter(c => c.status === 'ACTIVE').length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
        <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes de Firma</p>
                  <p className="text-2xl font-bold text-gray-900">{contracts.filter(c => c.status === 'DRAFT').length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <PenTool className="w-6 h-6 text-yellow-600" />
                </div>
        </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Próximos a Vencer</p>
                  <p className="text-2xl font-bold text-gray-900">{contracts.filter(c => {
                    if (!c.endDate) return false;
                    const daysUntilExpiry = Math.ceil((new Date(c.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                  }).length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Actions Bar */}
      <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {contracts.length} contrato{contracts.length !== 1 ? 's' : ''} encontrado{contracts.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={refreshContracts} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          {contracts.length > 0 && (
            <Button onClick={handleExportContracts} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
                Exportar
            </Button>
          )}
        </div>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes contratos</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Cuando tengas contratos activos, aparecerán aquí. Puedes contactar a un corredor para
              encontrar propiedades disponibles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {contracts.map(contract => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(contract.status)}
                    <div>
                      <CardTitle className="text-lg">{contract.contractNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground">{(contract as any).property?.title || 'Propiedad'}</p>
                    </div>
                  </div>
                  {getStatusBadge(contract.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información de la propiedad */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{(contract as any).property?.address || 'Dirección no disponible'}</span>
                      </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Propietario: {(contract as any).owner?.name}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Arriendo: {formatPrice(contract.monthlyRent)}/mes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>Depósito: {formatPrice((contract as any).depositAmount || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Fechas del contrato */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Inicio: {formatDate(contract.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Fin: {formatDate(contract.endDate)}</span>
                  </div>
                </div>

                {/* Términos del contrato */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Términos del Contrato</h4>
                  <p className="text-sm text-muted-foreground">{contract.terms}</p>
                </div>

                {/* Características de la propiedad */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Características</h4>
                  <div className="flex flex-wrap gap-2">
                      {(contract as any).property?.features && (contract as any).property.features.length > 0 ? (
                        (contract as any).property.features.map((feature: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Sin características especificadas</span>
                      )}
                  </div>
                </div>

                {/* Acciones */}
                  <div className="border-t pt-4 flex flex-wrap gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                    Ver Detalles
                  </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalles del Contrato {contract.contractNumber}</DialogTitle>
                          <DialogDescription>
                            Información completa del contrato de arriendo
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Información General */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Información del Contrato</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Número:</span>
                                  <span className="font-medium">{contract.contractNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Estado:</span>
                                  {getStatusBadge(contract.status)}
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Arriendo:</span>
                                  <span className="font-medium">{formatPrice(contract.monthlyRent)}/mes</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Depósito:</span>
                                  <span className="font-medium">{formatPrice((contract as any).depositAmount || 0)}</span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Fechas Importantes</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Fecha Inicio:</span>
                                  <span className="font-medium">{formatDate(contract.startDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Fecha Fin:</span>
                                  <span className="font-medium">{formatDate(contract.endDate)}</span>
                                </div>
                                {contract.signedAt && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Firmado:</span>
                                    <span className="font-medium">{formatDate(contract.signedAt)}</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          {/* Información de las Partes */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Inquilino</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{user?.name || 'Usuario'}</p>
                                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Propietario</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Home className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{(contract as any).owner?.name || 'Propietario'}</p>
                                    <p className="text-sm text-muted-foreground">Propietario de la propiedad</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Información de la Propiedad */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Información de la Propiedad</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <h4 className="font-medium mb-2">{(contract as any).property?.title || 'Propiedad'}</h4>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      <span>{(contract as any).property?.address || 'Dirección no disponible'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Building className="h-4 w-4" />
                                      <span>{(contract as any).property?.city || 'Ciudad'}, {(contract as any).property?.commune || 'Comuna'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Características</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {(contract as any).property?.features && (contract as any).property.features.length > 0 ? (
                                      (contract as any).property.features.map((feature: string, index: number) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {feature}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-sm text-muted-foreground">Sin características especificadas</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Términos del Contrato */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Términos del Contrato</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {contract.terms}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Firma Electrónica */}
                    {contract.status === 'DRAFT' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="default" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Firmar Contrato
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Firma Electrónica del Contrato</DialogTitle>
                            <DialogDescription>
                              Revisa y firma electrónicamente el contrato {contract.contractNumber}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium text-blue-900 mb-1">Importante</p>
                                  <p className="text-blue-800">
                                    Al firmar este contrato, aceptas todos los términos y condiciones establecidos.
                                    Esta firma tiene valor legal y es vinculante.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <ElectronicSignature
                              contractId={contract.id}
                              documentName={`Contrato de Arriendo - ${contract.contractNumber}`}
                              documentHash={`hash-${contract.id}`}
                              onSignatureComplete={() => {
                                // Refrescar contratos después de firmar
                                refreshContracts();
                              }}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Contactar Propietario */}
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contactar Propietario
                    </Button>

                    {/* Solicitar Mantenimiento (solo contratos activos) */}
                    {contract.status === 'ACTIVE' && (
                      <Button variant="outline" size="sm">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                      Solicitar Mantenimiento
                    </Button>
                  )}

                    {/* Descargar Contrato */}
                  <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de exportación */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Contratos</DialogTitle>
            <DialogDescription>
              Selecciona el formato y filtra los contratos que deseas exportar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="export-format">Formato de Archivo</Label>
              <Select
                value={exportOptions.format}
                onValueChange={value => setExportOptions(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="export-status">Filtrar por Estado</Label>
              <Select
                value={exportOptions.status}
                onValueChange={value => setExportOptions(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los contratos</SelectItem>
                  <SelectItem value="ACTIVE">Activos</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="EXPIRED">Expirados</SelectItem>
                  <SelectItem value="TERMINATED">Terminados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Se exportarán {contracts.length} contratos
                {exportOptions.format === 'csv'
                  ? ' en formato CSV compatible con Excel'
                  : ' en formato JSON'}
                {exportOptions.status !== 'all' &&
                  ` filtrados por estado "${exportOptions.status}"`}
                .
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowExportDialog(false);
                setExportOptions({
                  format: 'csv',
                  status: 'all',
                });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Contratos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </UnifiedDashboardLayout>
  );
}
