'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Trash2,
  RotateCcw,
  User,
  Calendar,
  Building,
  Phone,
  Mail
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface SignatureRecord {
  id: string;
  contractId: string;
  contractTitle: string;
  signerName: string;
  signerEmail: string;
  signerRole: 'tenant' | 'owner' | 'broker';
  status: 'pending' | 'signed' | 'expired' | 'cancelled' | 'reset';
  signedAt?: string;
  expiresAt?: string;
  provider: string;
  ipAddress?: string;
  userAgent?: string;
  resetReason?: string;
  resetBy?: string;
  resetAt?: string;
}

interface Contract {
  id: string;
  title: string;
  property: {
    address: string;
    city: string;
  };
  tenantName: string;
  ownerName: string;
  status: string;
}

export default function SupportSignaturesPage() {
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSignature, setSelectedSignature] = useState<SignatureRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadSignatures();
    loadContracts();
  }, []);

  const loadSignatures = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demo - in production this would come from API
      const mockSignatures: SignatureRecord[] = [
        {
          id: '1',
          contractId: 'contract-001',
          contractTitle: 'Contrato Arriendo Departamento Las Condes',
          signerName: 'Carlos Ramírez',
          signerEmail: 'carlos.ramirez@email.com',
          signerRole: 'tenant',
          status: 'signed',
          signedAt: '2024-03-15T10:30:00Z',
          expiresAt: '2025-03-15T10:30:00Z',
          provider: 'TrustFactory',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: '2',
          contractId: 'contract-002',
          contractTitle: 'Contrato Arriendo Casa Providencia',
          signerName: 'Ana Martínez',
          signerEmail: 'ana.martinez@email.com',
          signerRole: 'owner',
          status: 'pending',
          expiresAt: '2024-03-20T15:00:00Z',
          provider: 'FirmaPro'
        },
        {
          id: '3',
          contractId: 'contract-003',
          contractTitle: 'Contrato Arriendo Local Comercial',
          signerName: 'Pedro Silva',
          signerEmail: 'pedro.silva@email.com',
          signerRole: 'tenant',
          status: 'reset',
          signedAt: '2024-02-10T09:15:00Z',
          resetReason: 'Error en la firma digital',
          resetBy: 'Soporte Técnico',
          resetAt: '2024-02-11T11:20:00Z',
          provider: 'TrustFactory'
        },
        {
          id: '4',
          contractId: 'contract-001',
          contractTitle: 'Contrato Arriendo Departamento Las Condes',
          signerName: 'María González',
          signerEmail: 'maria.gonzalez@email.com',
          signerRole: 'owner',
          status: 'expired',
          signedAt: '2023-03-15T10:30:00Z',
          expiresAt: '2024-03-15T10:30:00Z',
          provider: 'TrustFactory'
        }
      ];

      setSignatures(mockSignatures);
    } catch (err) {
      logger.error('Error loading signatures:', { error: err instanceof Error ? err.message : String(err) });
      setError('Error al cargar las firmas');
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      // Mock contracts data
      const mockContracts: Contract[] = [
        {
          id: 'contract-001',
          title: 'Contrato Arriendo Departamento Las Condes',
          property: { address: 'Av. Apoquindo 3400', city: 'Las Condes' },
          tenantName: 'Carlos Ramírez',
          ownerName: 'María González',
          status: 'ACTIVE'
        },
        {
          id: 'contract-002',
          title: 'Contrato Arriendo Casa Providencia',
          property: { address: 'Manuel Montt 123', city: 'Providencia' },
          tenantName: 'Ana Martínez',
          ownerName: 'Roberto Díaz',
          status: 'PENDING'
        }
      ];

      setContracts(mockContracts);
    } catch (err) {
      logger.error('Error loading contracts:', { error: err instanceof Error ? err.message : String(err) });
    }
  };

  const filteredSignatures = signatures.filter(signature => {
    const matchesSearch = signature.contractTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signature.signerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signature.signerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || signature.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Firmado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Expirado</Badge>;
      case 'reset':
        return <Badge className="bg-blue-100 text-blue-800"><RotateCcw className="w-3 h-3 mr-1" />Reseteado</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800"><Trash2 className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'tenant':
        return <Badge variant="outline" className="border-blue-300 text-blue-700">Inquilino</Badge>;
      case 'owner':
        return <Badge variant="outline" className="border-green-300 text-green-700">Propietario</Badge>;
      case 'broker':
        return <Badge variant="outline" className="border-purple-300 text-purple-700">Corredor</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const handleResetSignature = async () => {
    if (!selectedSignature || !resetReason.trim()) return;

    setResetting(true);
    try {
      // TODO: Implement API call to reset signature
      // const response = await fetch('/api/support/signatures/reset', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     signatureId: selectedSignature.id,
      //     reason: resetReason,
      //     resetBy: 'Support User' // This would come from auth context
      //   })
      // });

      // Mock update
      setSignatures(prev => prev.map(sig =>
        sig.id === selectedSignature.id
          ? {
              ...sig,
              status: 'reset' as const,
              resetReason,
              resetBy: 'Soporte Técnico',
              resetAt: new Date().toISOString()
            }
          : sig
      ));

      logger.info('Firma reseteada:', { signatureId: selectedSignature.id, reason: resetReason });
      setShowResetDialog(false);
      setResetReason('');
      setSelectedSignature(null);

    } catch (error) {
      logger.error('Error resetting signature:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setResetting(false);
    }
  };

  const openContractEditor = (contractId: string) => {
    // TODO: Implement contract editor
    logger.info('Abriendo editor de contrato:', { contractId });
    // This would navigate to a contract editor page or open a modal
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Firmas Electrónicas"
        subtitle="Cargando historial de firmas..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Firmas Electrónicas"
        subtitle="Error al cargar la página"
      >
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Firmas Electrónicas"
      subtitle="Historial y gestión de firmas digitales"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Firmas</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{signatures.length}</div>
              <p className="text-xs text-muted-foreground">
                En el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Firmas Completadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {signatures.filter(s => s.status === 'signed').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Firmas válidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {signatures.filter(s => s.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Esperando firma
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problemas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {signatures.filter(s => ['expired', 'reset', 'cancelled'].includes(s.status)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Firmas</CardTitle>
            <CardDescription>
              Busca y filtra las firmas electrónicas del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por contrato, firmante o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="signed">Firmados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                  <SelectItem value="reset">Reseteados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Signatures List */}
            <div className="space-y-4">
              {filteredSignatures.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron firmas</h3>
                  <p className="text-gray-600">
                    No hay firmas que coincidan con los criterios de búsqueda.
                  </p>
                </div>
              ) : (
                filteredSignatures.map((signature) => (
                  <div key={signature.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{signature.contractTitle}</h3>
                          {getStatusBadge(signature.status)}
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span>{signature.signerName}</span>
                              {getRoleBadge(signature.signerRole)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{signature.signerEmail}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Shield className="w-4 h-4" />
                              <span>Proveedor: {signature.provider}</span>
                            </div>
                            {signature.signedAt && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>Firmado: {new Date(signature.signedAt).toLocaleDateString('es-ES')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {signature.resetReason && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                            <p className="text-sm text-yellow-800">
                              <strong>Reseteo:</strong> {signature.resetReason}
                              {signature.resetBy && ` - Por: ${signature.resetBy}`}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSignature(signature);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openContractEditor(signature.contractId)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Contrato
                        </Button>
                        {signature.status === 'signed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSignature(signature);
                              setShowResetDialog(true);
                            }}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Resetear Firma
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Firma</DialogTitle>
          </DialogHeader>
          {selectedSignature && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Información del Contrato</h4>
                  <p><strong>Título:</strong> {selectedSignature.contractTitle}</p>
                  <p><strong>ID:</strong> {selectedSignature.contractId}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Información del Firmante</h4>
                  <p><strong>Nombre:</strong> {selectedSignature.signerName}</p>
                  <p><strong>Email:</strong> {selectedSignature.signerEmail}</p>
                  <p><strong>Rol:</strong> {selectedSignature.signerRole === 'tenant' ? 'Inquilino' :
                                             selectedSignature.signerRole === 'owner' ? 'Propietario' : 'Corredor'}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Estado de la Firma</h4>
                  <p><strong>Estado:</strong> {getStatusBadge(selectedSignature.status)}</p>
                  <p><strong>Proveedor:</strong> {selectedSignature.provider}</p>
                  {selectedSignature.signedAt && (
                    <p><strong>Fecha de firma:</strong> {new Date(selectedSignature.signedAt).toLocaleString('es-ES')}</p>
                  )}
                  {selectedSignature.expiresAt && (
                    <p><strong>Expira:</strong> {new Date(selectedSignature.expiresAt).toLocaleString('es-ES')}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Información Técnica</h4>
                  {selectedSignature.ipAddress && (
                    <p><strong>IP:</strong> {selectedSignature.ipAddress}</p>
                  )}
                  {selectedSignature.userAgent && (
                    <p><strong>Navegador:</strong> {selectedSignature.userAgent.substring(0, 50)}...</p>
                  )}
                </div>
              </div>

              {selectedSignature.resetReason && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <h4 className="font-semibold text-yellow-800 mb-1">Información de Reseteo</h4>
                  <p className="text-yellow-700"><strong>Razón:</strong> {selectedSignature.resetReason}</p>
                  {selectedSignature.resetBy && (
                    <p className="text-yellow-700"><strong>Reseteado por:</strong> {selectedSignature.resetBy}</p>
                  )}
                  {selectedSignature.resetAt && (
                    <p className="text-yellow-700"><strong>Fecha:</strong> {new Date(selectedSignature.resetAt).toLocaleString('es-ES')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Signature Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear Firma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta acción reseteará la firma del contrato. El firmante tendrá que firmar nuevamente.
                Esta acción no se puede deshacer.
              </AlertDescription>
            </Alert>

            {selectedSignature && (
              <div className="bg-gray-50 p-3 rounded">
                <p><strong>Contrato:</strong> {selectedSignature.contractTitle}</p>
                <p><strong>Firmante:</strong> {selectedSignature.signerName}</p>
              </div>
            )}

            <div>
              <Label htmlFor="reset-reason">Razón del reseteo *</Label>
              <Input
                id="reset-reason"
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="Ej: Error técnico, solicitud del cliente..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetReason('');
                }}
                disabled={resetting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetSignature}
                disabled={resetting || !resetReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Reseteando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetear Firma
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
