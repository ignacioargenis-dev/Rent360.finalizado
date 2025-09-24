'use client';

import { logger } from '@/lib/logger';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload,
  Shield,
  User,
  Mail,
  Phone,
  Hash,
  PenTool,
  RotateCcw,
  Save,
  Send,
  Pen,
  Eye
} from 'lucide-react';
interface DocumentData {
  id: string
  title: string
  type: 'contract' | 'agreement' | 'receipt' | 'form' | 'other'
  content: string
  parties: {
    name: string
    email: string
    phone: string
    role: string
  }[]
  metadata?: {
    property_id?: string
    contract_id?: string
    amount?: number
    start_date?: string
    end_date?: string
  }
}

interface SignatureData {
  id: string
  document_id: string
  signer_id: string
  signer_name: string
  signer_email: string
  signature_image: string
  signature_date: string
  ip_address: string
  user_agent: string
  status: 'pending' | 'signed' | 'declined'
  verification_hash: string
}

interface DigitalSignatureProps {
  document: DocumentData
  currentUser: {
    id: string
    name: string
    email: string
    phone: string
    role: string
  }
  onSigned?: (signatureData: SignatureData) => void
  onDeclined?: (reason: string) => void
  onSave?: (documentData: DocumentData) => void
  mode?: 'sign' | 'view' | 'edit'
}

export default function DigitalSignature({
  document,
  currentUser,
  onSigned,
  onDeclined,
  onSave,
  mode = 'sign',
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);

  const [signatureData, setSignatureData] = useState<string>('');

  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type' | 'upload'>('draw');

  const [typedSignature, setTypedSignature] = useState('');

  const [declineReason, setDeclineReason] = useState('');

  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [verificationCode, setVerificationCode] = useState('');

  const [showVerification, setShowVerification] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
return;
}

    const ctx = canvas.getContext('2d');
    if (!ctx) {
return;
}

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set canvas style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [showSignaturePad]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) {
return;
}

    const ctx = canvas.getContext('2d');
    if (!ctx) {
return;
}

    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e && e.touches && e.touches[0] ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e && e.touches && e.touches[0] ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) {
return;
}

    const canvas = canvasRef.current;
    if (!canvas) {
return;
}

    const ctx = canvas.getContext('2d');
    if (!ctx) {
return;
}

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e && e.touches && e.touches[0] ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e && e.touches && e.touches[0] ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
return;
}

    const ctx = canvas.getContext('2d');
    if (!ctx) {
return;
}

    ctx.closePath();
    setIsDrawing(false);

    // Save signature data
    setSignatureData(canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
return;
}

    const ctx = canvas.getContext('2d');
    if (!ctx) {
return;
}

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
return;
}

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSignatureData(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateVerificationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setShowVerification(true);
    
    // Enviar código por correo (simulado)
    logger.info('Código de verificación enviado:', { code });
  };

  const verifyCode = (inputCode: string) => {
    return inputCode === verificationCode;
  };

  const handleSign = async () => {
    if (!signatureData && !typedSignature) {
      alert('Por favor proporciona una firma');
      return;
    }

    if (!agreedToTerms) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }

    setIsProcessing(true);

    try {
      // Generar código de verificación si no se ha generado
      if (!showVerification) {
        generateVerificationCode();
        setIsProcessing(false);
        return;
      }

      // Simular verificación (en producción, esto sería un input real)
      const isVerified = verifyCode(verificationCode);

      if (!isVerified) {
        alert('Código de verificación inválido');
        setIsProcessing(false);
        return;
      }

      // Crear objeto de firma
      const signature: SignatureData = {
        id: `sig_${Date.now()}`,
        document_id: document.id,
        signer_id: currentUser?.id || '',
        signer_name: currentUser?.name || 'Usuario',
        signer_email: currentUser?.email || '',
        signature_image: signatureData || typedSignature,
        signature_date: new Date().toISOString(),
        ip_address: '192.168.1.1', // Esto debería obtenerse del servidor
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        status: 'signed',
        verification_hash: `hash_${Date.now()}_${Math.random().toString(36)}`,
      };

      // Simular guardado en blockchain o base de datos
      logger.info('Firma digital guardada:', { signature });

      // Notificar al componente padre
      onSigned?.(signature);

    } catch (error) {
      logger.error('Error al firmar documento:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al procesar la firma');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    if (!declineReason.trim()) {
      alert('Por favor proporciona una razón para declinar');
      return;
    }

    onDeclined?.(declineReason);
    setShowDeclineDialog(false);
    setDeclineReason('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'contract':
        return 'Contrato';
      case 'agreement':
        return 'Acuerdo';
      case 'receipt':
        return 'Recibo';
      case 'form':
        return 'Formulario';
      default:
        return 'Documento';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {document.title}
              </CardTitle>
              <CardDescription>
                {getDocumentTypeLabel(document.type)} • {formatDate(document.metadata?.start_date || new Date().toISOString())}
              </CardDescription>
            </div>
            <Badge className={
              mode === 'sign' ? 'bg-blue-100 text-blue-800' :
              mode === 'view' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
            }>
              {mode === 'sign' ? 'Pendiente de firma' :
               mode === 'view' ? 'Para revisión' :
               'En edición'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Document Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contenido del Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border">
              {document.content}
            </div>
          </div>

          {/* Document Metadata */}
          {document.metadata && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {document.metadata.property_id && (
                <div>
                  <Label className="text-sm font-medium">ID de Propiedad</Label>
                  <p className="text-sm text-gray-600">{document.metadata.property_id}</p>
                </div>
              )}
              {document.metadata.contract_id && (
                <div>
                  <Label className="text-sm font-medium">ID de Contrato</Label>
                  <p className="text-sm text-gray-600">{document.metadata.contract_id}</p>
                </div>
              )}
              {document.metadata.amount && (
                <div>
                  <Label className="text-sm font-medium">Monto</Label>
                  <p className="text-sm text-gray-600">
                    ${document.metadata.amount.toLocaleString('es-CL')}
                  </p>
                </div>
              )}
              {document.metadata.start_date && (
                <div>
                  <Label className="text-sm font-medium">Fecha de Inicio</Label>
                  <p className="text-sm text-gray-600">{formatDate(document.metadata.start_date)}</p>
                </div>
              )}
              {document.metadata.end_date && (
                <div>
                  <Label className="text-sm font-medium">Fecha de Término</Label>
                  <p className="text-sm text-gray-600">{formatDate(document.metadata.end_date)}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parties Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Partes Involucradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {document.parties?.map((party, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{party.name}</span>
                  {party.email === currentUser?.email && (
                    <Badge className="bg-blue-100 text-blue-800">Yo</Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {party.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {party.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {party.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signature Section */}
      {mode === 'sign' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Firma Digital
            </CardTitle>
            <CardDescription>
              Firma este documento digitalmente para completar el proceso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Signature Method Selection */}
            <div>
              <Label className="text-sm font-medium">Método de Firma</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={signatureMethod === 'draw' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSignatureMethod('draw')}
                >
                  <Pen className="w-4 h-4 mr-1" />
                  Dibujar
                </Button>
                <Button
                  variant={signatureMethod === 'type' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSignatureMethod('type')}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Escribir
                </Button>
                <Button
                  variant={signatureMethod === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSignatureMethod('upload')}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Subir
                </Button>
              </div>
            </div>

            {/* Signature Input */}
            {signatureMethod === 'draw' && (
              <div>
                <Label className="text-sm font-medium">Firma Manuscrita</Label>
                <div className="mt-2">
                  {!showSignaturePad ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowSignaturePad(true)}
                      className="w-full"
                    >
                      <Pen className="w-4 h-4 mr-2" />
                      Abrir pad de firma
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg">
                        <canvas
                          ref={canvasRef}
                          className="w-full h-40 cursor-crosshair bg-white"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={clearSignature}>
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Limpiar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowSignaturePad(false)}>
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {signatureMethod === 'type' && (
              <div>
                <Label className="text-sm font-medium">Firma Escrita</Label>
                <Input
                  placeholder="Escribe tu nombre completo como firma"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  className="mt-2"
                  style={{ fontFamily: 'cursive', fontSize: '18px' }}
                />
              </div>
            )}

            {signatureMethod === 'upload' && (
              <div>
                <Label className="text-sm font-medium">Subir Imagen de Firma</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full"
                  />
                  {signatureData && (
                    <div className="mt-2">
                      <img
                        src={signatureData}
                        alt="Firma subida"
                        className="max-w-xs h-20 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification */}
            {showVerification && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Verificación de Identidad</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Hemos enviado un código de verificación a tu correo: {currentUser?.email || 'correo@ejemplo.com'}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Ingresa el código de 6 dígitos"
                    className="flex-1"
                  />
                  <Button size="sm">Verificar</Button>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  Acepto los términos y condiciones de la firma digital
                </Label>
              </div>
              <p className="text-xs text-gray-600 ml-6">
                Al firmar este documento, acepto que mi firma digital tiene la misma validez legal 
                que una firma manuscrita y autorizo el uso de este documento en formato electrónico.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSign}
                disabled={isProcessing || !agreedToTerms || (!signatureData && !typedSignature)}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Firmar Documento
                  </>
                )}
              </Button>
              
              {mode === 'sign' && (
                <Button
                  variant="outline"
                  onClick={() => setShowDeclineDialog(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Declinar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decline Dialog */}
      {showDeclineDialog && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-800">Declinar Documento</CardTitle>
            <CardDescription>
              Por favor indica la razón por la cual declinas firmar este documento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe la razón para declinar este documento..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleDecline} disabled={!declineReason.trim()}>
                <XCircle className="w-4 h-4 mr-2" />
                Confirmar Declinación
              </Button>
              <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Mode Actions */}
      {mode === 'view' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Ver Historial
              </Button>
              {onSave && (
                <Button onClick={() => onSave(document)}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
