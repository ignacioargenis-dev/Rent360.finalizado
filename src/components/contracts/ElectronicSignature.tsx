'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
  Shield,
  Zap,
  Trash2 } from 'lucide-react';
import { useToast } from '@/components/notifications/NotificationSystem';
import { SignatureStatus, SignatureType } from '@/lib/signature';

interface ElectronicSignatureProps {
  contractId: string;
  documentName: string;
  documentHash: string;
  onSignatureComplete?: (signatureId: string) => void;
  onSignatureCancel?: () => void;
}

interface Signer {
  id: string;
  email: string;
  name: string;
  rut?: string;
  phone?: string;
  order: number;
  isRequired: boolean;
}

interface SignatureInfo {
  id: string;
  status: SignatureStatus;
  provider: string;
  createdAt: string;
  expiresAt: string;
  signers: Signer[];
  metadata?: any;
}

export default function ElectronicSignature({
  contractId,
  documentName,
  documentHash,
  onSignatureComplete,
  onSignatureCancel,
}: ElectronicSignatureProps) {

  const [signers, setSigners] = useState<Signer[]>([
    {
      id: '1',
      email: '',
      name: '',
      rut: '',
      phone: '',
      order: 1,
      isRequired: true,
    },
  ]);

  const [signatureType, setSignatureType] = useState<SignatureType>(SignatureType.ADVANCED);

  const [expiresAt, setExpiresAt] = useState<string>('');

  const [loading, setLoading] = useState(false);

  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | null>(null);

  const [polling, setPolling] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    // Establecer fecha de expiración por defecto (7 días)
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 7);
    setExpiresAt(defaultExpiry.toISOString().slice(0, 16));
  }, []);

  const addSigner = () => {
    const newSigner: Signer = {
      id: Date.now().toString(),
      email: '',
      name: '',
      rut: '',
      phone: '',
      order: signers.length + 1,
      isRequired: true,
    };
    setSigners([...signers, newSigner]);
  };

  const removeSigner = (id: string) => {
    if (signers.length > 1) {
      const updatedSigners = signers
        .filter(signer => signer.id !== id)
        .map((signer, index) => ({ ...signer, order: index + 1 }));
      setSigners(updatedSigners);
    }
  };

  const updateSigner = (id: string, field: keyof Signer, value: any) => {
    setSigners(prev => prev.map(signer => 
      signer.id === id ? { ...signer, [field]: value } : signer,
    ));
  };

  const validateSigners = (): boolean => {
    return signers.every(signer => 
      signer.email && signer.name && signer.email.includes('@'),
    );
  };

  const createSignatureRequest = async () => {
    if (!validateSigners()) {
      error('Error', 'Por favor completa todos los campos requeridos de los firmantes');
      return;
    }

    if (!expiresAt) {
      error('Error', 'Por favor establece una fecha de expiración');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: contractId,
          documentName,
          documentHash,
          signers,
          type: signatureType,
          expiresAt: new Date(expiresAt).toISOString(),
          metadata: {
            contractId,
            createdBy: 'system', // Se obtendrá del contexto de autenticación
            source: 'rent360',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        success('Firma Creada', 'Solicitud de firma creada exitosamente');
        setSignatureInfo({
          id: data.signatureId,
          status: data.status,
          provider: data.provider,
          createdAt: new Date().toISOString(),
          expiresAt,
          signers,
          metadata: data.metadata,
        });
        
        // Iniciar polling para verificar estado
        startPolling(data.signatureId);
        
        onSignatureComplete?.(data.signatureId);
      } else {
        error('Error', data.error || 'Error al crear la solicitud de firma');
      }
    } catch (err) {
      error('Error', 'Error al crear la solicitud de firma');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (signatureId: string) => {
    setPolling(true);
    let retryCount = 0;
    const maxRetries = 5;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/signatures?signatureId=${signatureId}`);
        const data = await response.json();

        if (data.success) {
          setSignatureInfo(prev => prev ? {
            ...prev,
            status: data.status,
            metadata: data.metadata,
          } : null);

          // Detener polling si la firma está completada, fallida o expirada
          if (['completed', 'failed', 'expired', 'cancelled'].includes(data.status)) {
            clearInterval(pollInterval);
            setPolling(false);
            
            if (data.status === 'completed') {
              success('Firma Completada', 'El documento ha sido firmado exitosamente');
            } else if (data.status === 'failed') {
              error('Firma Fallida', 'La firma no pudo ser completada');
            } else if (data.status === 'expired') {
              error('Firma Expirada', 'La solicitud de firma ha expirado');
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error('Error en polling de firma:', {
          error: errorMessage,
          signatureId
        });

        // Implementar reintentos con backoff exponencial
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 segundos
          setTimeout(() => {
            // Reintentar la consulta después del delay
            // Esta lógica se implementará cuando se integre con la API real
          }, delay);
        } else {
          logger.error('Máximo número de reintentos alcanzado en polling de firma', { signatureId });
          clearInterval(pollInterval);
          setPolling(false);
        }
      }
    }, 5000); // Consultar cada 5 segundos

    // Limpiar intervalo después de 30 minutos
    setTimeout(() => {
      clearInterval(pollInterval);
      setPolling(false);
    }, 30 * 60 * 1000);
  };

  const cancelSignature = async () => {
    if (!signatureInfo) {
return;
}

    try {
      const response = await fetch(`/api/signatures/${signatureInfo.id}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        success('Firma Cancelada', 'La solicitud de firma ha sido cancelada');
        setSignatureInfo(null);
        setPolling(false);
        onSignatureCancel?.();
      } else {
        error('Error', data.error || 'Error al cancelar la firma');
      }
    } catch (err) {
      error('Error', 'Error al cancelar la firma');
    }
  };

  const getStatusBadge = (status: SignatureStatus) => {
    const statusConfig = {
      [SignatureStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente' },
      [SignatureStatus.IN_PROGRESS]: { color: 'bg-blue-100 text-blue-800', text: 'En Progreso' },
      [SignatureStatus.COMPLETED]: { color: 'bg-green-100 text-green-800', text: 'Completada' },
      [SignatureStatus.FAILED]: { color: 'bg-red-100 text-red-800', text: 'Fallida' },
      [SignatureStatus.EXPIRED]: { color: 'bg-gray-100 text-gray-800', text: 'Expirada' },
      [SignatureStatus.CANCELLED]: { color: 'bg-gray-100 text-gray-800', text: 'Cancelada' },
    };

    const config = statusConfig[status];
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getStatusIcon = (status: SignatureStatus) => {
    switch (status) {
      case SignatureStatus.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case SignatureStatus.FAILED:
        return <XCircle className="w-5 h-5 text-red-600" />;
      case SignatureStatus.EXPIRED:
      case SignatureStatus.CANCELLED:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      case SignatureStatus.IN_PROGRESS:
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (signatureInfo) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(signatureInfo.status)}
              <div>
                <CardTitle>Solicitud de Firma</CardTitle>
                <CardDescription>
                  Estado: {getStatusBadge(signatureInfo.status)}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{signatureInfo.provider}</Badge>
              {polling && <RefreshCw className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Documento</Label>
              <p className="text-sm text-gray-600">{documentName}</p>
            </div>
            <div>
              <Label>Tipo de Firma</Label>
              <p className="text-sm text-gray-600 capitalize">
                {signatureType === SignatureType.ADVANCED ? 'Avanzada' : 'Cualificada'}
              </p>
            </div>
            <div>
              <Label>ID de Firma</Label>
              <p className="text-sm text-gray-600 font-mono">{signatureInfo.id}</p>
            </div>
            <div>
              <Label>Expira</Label>
              <p className="text-sm text-gray-600">
                {new Date(signatureInfo.expiresAt).toLocaleString('es-CL')}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Firmantes ({signatureInfo.signers.length})
            </Label>
            <div className="mt-2 space-y-2">
              {signatureInfo.signers.map((signer, index) => (
                <div key={signer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{signer.name}</p>
                    <p className="text-sm text-gray-600">{signer.email}</p>
                    {signer.rut && <p className="text-sm text-gray-600">RUT: {signer.rut}</p>}
                  </div>
                  <Badge variant="outline">Orden {signer.order}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {signatureInfo.status === SignatureStatus.COMPLETED && (
              <Button className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Descargar Documento Firmado
              </Button>
            )}
            {['pending', 'in_progress'].includes(signatureInfo.status) && (
              <Button 
                variant="outline" 
                onClick={cancelSignature}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Cancelar Firma
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Firma Electrónica
        </CardTitle>
        <CardDescription>
          Configura la firma electrónica del documento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Firma */}
        <div>
          <Label className="text-base font-medium">Tipo de Firma</Label>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                signatureType === SignatureType.ADVANCED
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSignatureType(SignatureType.ADVANCED)}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium">Firma Avanzada</h3>
              </div>
              <p className="text-sm text-gray-600">
                Firma electrónica avanzada con validación de identidad
              </p>
            </div>
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                signatureType === SignatureType.QUALIFIED
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSignatureType(SignatureType.QUALIFIED)}
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <h3 className="font-medium">Firma Cualificada</h3>
              </div>
              <p className="text-sm text-gray-600">
                Firma electrónica cualificada con certificado digital
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Firmantes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Firmantes
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSigner}
            >
              Agregar Firmante
            </Button>
          </div>
          
          <div className="space-y-4">
            {signers.map((signer, index) => (
              <div key={signer.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Firmante {signer.order}</h4>
                  {signers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSigner(signer.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`name-${signer.id}`}>Nombre Completo *</Label>
                    <Input
                      id={`name-${signer.id}`}
                      value={signer.name}
                      onChange={(e) => updateSigner(signer.id, 'name', e.target.value)}
                      placeholder="Nombre y apellido"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`email-${signer.id}`}>Email *</Label>
                    <Input
                      id={`email-${signer.id}`}
                      type="email"
                      value={signer.email}
                      onChange={(e) => updateSigner(signer.id, 'email', e.target.value)}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`rut-${signer.id}`}>RUT</Label>
                    <Input
                      id={`rut-${signer.id}`}
                      value={signer.rut}
                      onChange={(e) => updateSigner(signer.id, 'rut', e.target.value)}
                      placeholder="12.345.678-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`phone-${signer.id}`}>Teléfono</Label>
                    <Input
                      id={`phone-${signer.id}`}
                      value={signer.phone}
                      onChange={(e) => updateSigner(signer.id, 'phone', e.target.value)}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Configuración */}
        <div>
          <Label className="text-base font-medium">Configuración</Label>
          <div className="mt-2">
            <Label htmlFor="expiresAt">Fecha de Expiración *</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-sm text-gray-600 mt-1">
              La solicitud de firma expirará en esta fecha
            </p>
          </div>
        </div>

        <Separator />

        {/* Acciones */}
        <div className="flex gap-2">
          <Button
            onClick={createSignatureRequest}
            disabled={loading || !validateSigners()}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {loading ? 'Creando Firma...' : 'Crear Solicitud de Firma'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onSignatureCancel?.()}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
