'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

import {
  FileText,
  Plus,
  Download,
  Eye,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  Shield,
  Loader2
} from 'lucide-react';

interface Signature {
  id: string;
  documentId: string;
  documentName: string;
  type: string;
  status: string;
  provider: string;
  createdAt: string;
  expiresAt: string;
  signers: Array<{
    id: string;
    rut: string;
    email: string;
    name: string;
    status: string;
    signedAt?: string;
  }>;
  metadata?: any;
}

interface CreateSignatureData {
  documentId: string;
  documentName: string;
  documentHash: string;
  signers: Array<{
    rut: string;
    email: string;
    name: string;
    phone?: string;
    order: number;
    isRequired: boolean;
  }>;
  type: 'QUALIFIED' | 'ADVANCED';
  provider?: string;
  expiresAt?: string;
}

export const SignatureManagement: React.FC = () => {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const { toast } = useToast();

  // Estado para el formulario de creación
  const [createForm, setCreateForm] = useState<CreateSignatureData>({
    documentId: '',
    documentName: '',
    documentHash: '',
    signers: [{
      rut: '',
      email: '',
      name: '',
      phone: '',
      order: 1,
      isRequired: true
    }],
    type: 'QUALIFIED',
    expiresAt: ''
  });

  // Cargar firmas al montar el componente
  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/signatures');

      if (!response.ok) {
        throw new Error('Error cargando firmas');
      }

      const data = await response.json();
      setSignatures(data.data || []);
    } catch (error) {
      logger.error('Error cargando firmas:', { error: error instanceof Error ? error.message : String(error) });
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las firmas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createSignature = async () => {
    try {
      setCreating(true);

      // Validar formulario
      if (!createForm.documentId || !createForm.documentName) {
        throw new Error('Documento requerido');
      }

      if (createForm.signers.length === 0) {
        throw new Error('Al menos un firmante requerido');
      }

      // Generar hash simulado del documento
      const documentHash = createForm.documentHash || `hash_${Date.now()}_${Math.random().toString(36)}`;

      const signatureData = {
        ...createForm,
        documentHash
      };

      const response = await fetch('/api/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(signatureData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando firma');
      }

      const result = await response.json();

      toast({
        title: 'Éxito',
        description: 'Solicitud de firma creada exitosamente',
      });

      setShowCreateDialog(false);
      resetCreateForm();
      loadSignatures();

      logger.info('Firma creada exitosamente:', {
        signatureId: result.data.signatureId,
        provider: result.data.provider
      });

    } catch (error) {
      logger.error('Error creando firma:', { error: error instanceof Error ? error.message : String(error) });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error creando firma',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const downloadSignature = async (signatureId: string) => {
    try {
      const response = await fetch(`/api/signatures/${signatureId}/download`);

      if (!response.ok) {
        throw new Error('Error descargando documento');
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento-firmado-${signatureId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Éxito',
        description: 'Documento descargado exitosamente',
      });

    } catch (error) {
      logger.error('Error descargando firma:', { signatureId, error: error instanceof Error ? error.message : String(error) });
      toast({
        title: 'Error',
        description: 'Error descargando documento',
        variant: 'destructive'
      });
    }
  };

  const cancelSignature = async (signatureId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta firma?')) {
      return;
    }

    try {
      const response = await fetch(`/api/signatures/${signatureId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error cancelando firma');
      }

      toast({
        title: 'Éxito',
        description: 'Firma cancelada exitosamente',
      });

      loadSignatures();

    } catch (error) {
      logger.error('Error cancelando firma:', { signatureId, error: error instanceof Error ? error.message : String(error) });
      toast({
        title: 'Error',
        description: 'Error cancelando firma',
        variant: 'destructive'
      });
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      documentId: '',
      documentName: '',
      documentHash: '',
      signers: [{
        rut: '',
        email: '',
        name: '',
        phone: '',
        order: 1,
        isRequired: true
      }],
      type: 'QUALIFIED',
      expiresAt: ''
    });
  };

  const addSigner = () => {
    setCreateForm(prev => ({
      ...prev,
      signers: [
        ...prev.signers,
        {
          rut: '',
          email: '',
          name: '',
          phone: '',
          order: prev.signers.length + 1,
          isRequired: true
        }
      ]
    }));
  };

  const removeSigner = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      signers: prev.signers.filter((_, i) => i !== index)
    }));
  };

  const updateSigner = (index: number, field: string, value: any) => {
    setCreateForm(prev => ({
      ...prev,
      signers: prev.signers.map((signer, i) =>
        i === index ? { ...signer, [field]: value } : signer
      )
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'FAILED':
      case 'CANCELLED':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      COMPLETED: 'default',
      PENDING: 'secondary',
      IN_PROGRESS: 'outline',
      FAILED: 'destructive',
      CANCELLED: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Cargando firmas...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gestión de Firmas Electrónicas
              </CardTitle>
              <CardDescription>
                Crea y gestiona firmas electrónicas avanzadas certificadas por SII
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Firma
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Solicitud de Firma</DialogTitle>
                  <DialogDescription>
                    Configura una nueva solicitud de firma electrónica avanzada
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Información del documento */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Documento</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="documentId">ID del Documento</Label>
                        <Input
                          id="documentId"
                          value={createForm.documentId}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, documentId: e.target.value }))}
                          placeholder="Ej: DOC-2024-001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="documentName">Nombre del Documento</Label>
                        <Input
                          id="documentName"
                          value={createForm.documentName}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, documentName: e.target.value }))}
                          placeholder="Ej: Contrato de Arrendamiento"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="documentHash">Hash del Documento (opcional)</Label>
                      <Input
                        id="documentHash"
                        value={createForm.documentHash}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, documentHash: e.target.value }))}
                        placeholder="Se generará automáticamente si está vacío"
                      />
                    </div>
                  </div>

                  {/* Firmantes */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Firmantes</h3>
                      <Button type="button" variant="outline" onClick={addSigner}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Firmante
                      </Button>
                    </div>

                    {createForm.signers.map((signer, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-medium">Firmante {index + 1}</span>
                            {createForm.signers.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeSigner(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>RUT *</Label>
                              <Input
                                value={signer.rut}
                                onChange={(e) => updateSigner(index, 'rut', e.target.value)}
                                placeholder="12.345.678-9"
                              />
                            </div>
                            <div>
                              <Label>Nombre *</Label>
                              <Input
                                value={signer.name}
                                onChange={(e) => updateSigner(index, 'name', e.target.value)}
                                placeholder="Nombre completo"
                              />
                            </div>
                            <div>
                              <Label>Email *</Label>
                              <Input
                                type="email"
                                value={signer.email}
                                onChange={(e) => updateSigner(index, 'email', e.target.value)}
                                placeholder="correo@ejemplo.com"
                              />
                            </div>
                            <div>
                              <Label>Teléfono</Label>
                              <Input
                                value={signer.phone}
                                onChange={(e) => updateSigner(index, 'phone', e.target.value)}
                                placeholder="+56912345678"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Configuración */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Configuración</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Tipo de Firma</Label>
                        <Select value={createForm.type} onValueChange={(value) => setCreateForm(prev => ({ ...prev, type: value as any }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="QUALIFIED">Firma Electrónica Calificada</SelectItem>
                            <SelectItem value="ADVANCED">Firma Electrónica Avanzada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="expiresAt">Fecha de Expiración</Label>
                        <Input
                          id="expiresAt"
                          type="datetime-local"
                          value={createForm.expiresAt}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={createSignature} disabled={creating}>
                      {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Crear Firma
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="completed">Completadas</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <SignatureTable
                signatures={signatures}
                onView={(signature) => {
                  setSelectedSignature(signature);
                  setShowDetailDialog(true);
                }}
                onDownload={downloadSignature}
                onCancel={cancelSignature}
              />
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <SignatureTable
                signatures={signatures.filter(s => ['PENDING', 'IN_PROGRESS'].includes(s.status))}
                onView={(signature) => {
                  setSelectedSignature(signature);
                  setShowDetailDialog(true);
                }}
                onDownload={downloadSignature}
                onCancel={cancelSignature}
              />
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <SignatureTable
                signatures={signatures.filter(s => s.status === 'COMPLETED')}
                onView={(signature) => {
                  setSelectedSignature(signature);
                  setShowDetailDialog(true);
                }}
                onDownload={downloadSignature}
                onCancel={cancelSignature}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog de detalles */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Firma</DialogTitle>
          </DialogHeader>

          {selectedSignature && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID de Firma</Label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedSignature.id}</p>
                </div>
                <div>
                  <Label>Estado</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedSignature.status)}
                    {getStatusBadge(selectedSignature.status)}
                  </div>
                </div>
                <div>
                  <Label>Proveedor</Label>
                  <p className="text-sm">{selectedSignature.provider}</p>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <p className="text-sm">{selectedSignature.type}</p>
                </div>
              </div>

              <div>
                <Label>Documento</Label>
                <p className="text-sm">{selectedSignature.documentName}</p>
                <p className="text-xs text-gray-500">ID: {selectedSignature.documentId}</p>
              </div>

              <div>
                <Label>Firmantes</Label>
                <div className="space-y-2 mt-2">
                  {selectedSignature.signers.map((signer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{signer.name}</p>
                        <p className="text-sm text-gray-600">{signer.email}</p>
                        <p className="text-xs text-gray-500">RUT: {signer.rut}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(signer.status)}
                        <Badge variant={signer.status === 'signed' ? 'default' : 'secondary'}>
                          {signer.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSignature.status === 'COMPLETED' && (
                <div className="flex justify-end">
                  <Button onClick={() => downloadSignature(selectedSignature.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Documento
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente auxiliar para la tabla de firmas
const SignatureTable: React.FC<{
  signatures: Signature[];
  onView: (signature: Signature) => void;
  onDownload: (signatureId: string) => void;
  onCancel: (signatureId: string) => void;
}> = ({ signatures, onView, onDownload, onCancel }) => {
  if (signatures.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay firmas</h3>
          <p className="text-gray-500 text-center">
            Aún no has creado ninguna solicitud de firma electrónica.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Firmantes</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signatures.map((signature) => (
              <TableRow key={signature.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{signature.documentName}</p>
                    <p className="text-xs text-gray-500">{signature.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {signature.status === 'COMPLETED' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {signature.status === 'PENDING' && <Clock className="h-4 w-4 text-yellow-500" />}
                    {signature.status === 'IN_PROGRESS' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                    {(signature.status === 'FAILED' || signature.status === 'CANCELLED') && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    <Badge variant={
                      signature.status === 'COMPLETED' ? 'default' :
                      signature.status === 'PENDING' ? 'secondary' :
                      signature.status === 'IN_PROGRESS' ? 'outline' :
                      'destructive'
                    }>
                      {signature.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{signature.provider}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{signature.signers.length}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {new Date(signature.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(signature)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {signature.status === 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(signature.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {(signature.status === 'PENDING' || signature.status === 'IN_PROGRESS') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCancel(signature.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SignatureManagement;
