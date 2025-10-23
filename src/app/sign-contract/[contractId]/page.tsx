'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileSignature,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { logger } from '@/lib/logger-minimal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ContractData {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  ownerName: string;
  ownerEmail: string;
  brokerName: string;
  monthlyRent: number;
  startDate: string;
  endDate: string;
  terms: string;
  status: string;
  signatureStatus: string;
  signatureToken?: string;
  signatureExpiresAt?: string;
}

export default function SignContractPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const contractId = params?.contractId as string;
  const token = searchParams?.get('token');

  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);

  // Datos de firma
  const [signerName, setSignerName] = useState('');
  const [signerRUT, setSignerRUT] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signature, setSignature] = useState('');

  // Cargar datos del contrato
  useEffect(() => {
    const loadContract = async () => {
      if (!contractId || !token) {
        setError('Enlace de firma inválido o expirado');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/contracts/${contractId}/signature?token=${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Contrato no encontrado o enlace expirado');
          } else if (response.status === 403) {
            setError('No tienes permisos para firmar este contrato');
          } else {
            setError('Error al cargar el contrato');
          }
          return;
        }

        const data = await response.json();
        if (data.success) {
          setContract(data.contract);

          // Si ya está firmado, mostrar mensaje de éxito
          if (data.contract.signatureStatus === 'signed') {
            setError('Este contrato ya ha sido firmado');
          }
        } else {
          setError('Error al cargar los datos del contrato');
        }
      } catch (err) {
        logger.error('Error loading contract for signature:', err);
        setError('Error de conexión al cargar el contrato');
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, [contractId, token]);

  const handleSign = async () => {
    if (!contract || !acceptTerms || !signerName || !signerRUT) {
      alert('Por favor complete todos los campos requeridos y acepte los términos');
      return;
    }

    setSigning(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          signerName,
          signerRUT,
          signature: signature || 'FIRMADO ELECTRÓNICAMENTE',
          acceptTerms,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Contrato firmado exitosamente con firma electrónica');
        router.push('/contract-signed-success');
      } else {
        const errorData = await response.json();
        alert(`❌ Error al firmar contrato: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (err) {
      logger.error('Error signing contract:', err);
      alert('❌ Error de conexión al firmar el contrato');
    } finally {
      setSigning(false);
      setShowSignDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {error || 'Error al cargar contrato'}
              </h2>
              <p className="text-gray-600 mb-4">
                El enlace de firma puede haber expirado o ser inválido.
              </p>
              <Button onClick={() => router.push('/')}>Volver al Inicio</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (contract.signatureStatus === 'signed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Contrato Ya Firmado</h2>
              <p className="text-gray-600 mb-4">
                Este contrato ya ha sido firmado electrónicamente.
              </p>
              <Button onClick={() => router.push('/')}>Volver al Inicio</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileSignature className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Firma Electrónica de Contrato</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Revise el contrato de arriendo y firme electrónicamente con su clave única. Este proceso
            es seguro y legalmente vinculante.
          </p>
        </div>

        {/* Información del Contrato */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Detalles del Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Propiedad</Label>
                <p className="text-sm text-gray-900">{contract.propertyTitle}</p>
                <p className="text-xs text-gray-600">{contract.propertyAddress}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Renta Mensual</Label>
                <p className="text-sm text-gray-900">
                  ${contract.monthlyRent.toLocaleString('es-CL')} CLP
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Fecha de Inicio</Label>
                <p className="text-sm text-gray-900">{contract.startDate}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Fecha de Término</Label>
                <p className="text-sm text-gray-900">{contract.endDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Propietario
                </Label>
                <p className="text-sm text-gray-900">{contract.ownerName}</p>
                <p className="text-xs text-gray-600">{contract.ownerEmail}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Inquilino
                </Label>
                <p className="text-sm text-gray-900">{contract.tenantName}</p>
                <p className="text-xs text-gray-600">{contract.tenantEmail}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Corredor
                </Label>
                <p className="text-sm text-gray-900">{contract.brokerName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Términos del Contrato */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Términos y Condiciones del Contrato</CardTitle>
            <p className="text-sm text-gray-600">
              Por favor revise detenidamente todos los términos antes de firmar
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {contract.terms}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de Firma */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Firma Electrónica Segura
            </CardTitle>
            <p className="text-sm text-gray-600">
              Complete sus datos para firmar electrónicamente este contrato
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="signerName">Nombre Completo *</Label>
                <Input
                  id="signerName"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder="Juan Pérez González"
                />
              </div>
              <div>
                <Label htmlFor="signerRUT">RUT *</Label>
                <Input
                  id="signerRUT"
                  value={signerRUT}
                  onChange={e => setSignerRUT(e.target.value)}
                  placeholder="12.345.678-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="signature">Firma Digital (Opcional)</Label>
              <Input
                id="signature"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="Su nombre o firma digital"
              />
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="mt-1 rounded"
              />
              <div className="text-sm">
                <Label htmlFor="acceptTerms" className="cursor-pointer">
                  Acepto los términos del contrato y confirmo que he leído y entendido todas las
                  cláusulas *
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Esta firma electrónica tiene el mismo valor legal que una firma manuscrita.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Seguridad */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Información de Seguridad</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Este enlace de firma es único y expira automáticamente</li>
                  <li>• Su firma electrónica está protegida por encriptación SSL</li>
                  <li>• El contrato firmado se almacena de forma segura y auditada</li>
                  <li>• Recibirá una copia del contrato firmado por email</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => router.push('/')} className="px-8">
            Cancelar
          </Button>
          <Button
            onClick={() => setShowSignDialog(true)}
            disabled={!acceptTerms || !signerName || !signerRUT}
            className="px-8 bg-green-600 hover:bg-green-700"
          >
            <FileSignature className="w-4 h-4 mr-2" />
            Firmar Contrato
          </Button>
        </div>

        {/* Modal de Confirmación de Firma */}
        <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                Confirmar Firma Electrónica
              </DialogTitle>
              <DialogDescription>
                Está a punto de firmar electrónicamente este contrato de arriendo. Esta acción es
                legalmente vinculante.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">Confirmación Final</p>
                    <p className="text-yellow-700">
                      Al firmar este contrato, acepta todos los términos y condiciones. Esta firma
                      tiene el mismo valor legal que una firma manuscrita.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Datos de la firma:</p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p>
                    <strong>Nombre:</strong> {signerName}
                  </p>
                  <p>
                    <strong>RUT:</strong> {signerRUT}
                  </p>
                  <p>
                    <strong>Fecha:</strong> {new Date().toLocaleDateString('es-CL')}
                  </p>
                  <p>
                    <strong>Hora:</strong> {new Date().toLocaleTimeString('es-CL')}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSignDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSign}
                disabled={signing}
                className="bg-green-600 hover:bg-green-700"
              >
                {signing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Firmando...
                  </>
                ) : (
                  <>
                    <FileSignature className="w-4 h-4 mr-2" />
                    Confirmar Firma
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
