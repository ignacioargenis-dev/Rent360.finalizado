'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  QrCode,
  Shield,
  Zap,
} from 'lucide-react';

interface KhipuPaymentProps {
  amount: number
  currency?: string
  subject: string
  description?: string
  payerEmail?: string
  payerName?: string
  contractId?: string
  userId: string
  returnUrl: string
  cancelUrl: string
  onSuccess?: (paymentData: any) => void
  onError?: (error: string) => void
  onStatusChange?: (status: string) => void
}

interface PaymentStatus {
  payment_id: string
  khipu_payment_id: string
  status: 'pending' | 'completed' | 'failed' | 'expired' | 'cancelled'
  amount: number
  currency: string
  payment_url?: string
  expires_at?: string
  created_at: string
  completed_at?: string
  transaction_id?: string
}

export default function KhipuPayment({
  amount,
  currency = 'CLP',
  subject,
  description = '',
  payerEmail,
  payerName,
  contractId,
  userId,
  returnUrl,
  cancelUrl,
  onSuccess,
  onError,
  onStatusChange,
}: KhipuPaymentProps) {

  const [loading, setLoading] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [polling, setPolling] = useState(false);

  const [showQR, setShowQR] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const createPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const notifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/api/payments/khipu/notify`;
      
      const response = await fetch('/api/payments/khipu/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          subject,
          body: description,
          return_url: returnUrl,
          cancel_url: cancelUrl,
          notify_url: notifyUrl,
          payer_email: payerEmail,
          payer_name: payerName,
          contract_id: contractId,
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Error al crear el pago';
        logger.error('Error creating Khipu payment', { 
          error: errorMessage, 
          status: response.status,
          data 
        });
        throw new Error(errorMessage);
      }

      setPaymentStatus(data);
      onStatusChange?.(data.status);
      
      // Iniciar polling para verificar el estado
      startPolling(data.payment_id);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('errorMessage');
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (paymentId: string) => {
    setPolling(true);
    let retryCount = 0;
    const maxRetries = 10;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/khipu/status/${paymentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.error || data.message || 'Error al consultar estado del pago';
          logger.error('Error checking Khipu payment status', { 
            error: errorMessage, 
            status: response.status,
            paymentId,
            data 
          });
          throw new Error(errorMessage);
        }

        setPaymentStatus(data);
        onStatusChange?.(data.status);
        retryCount = 0; // Reset retry count on success

        // Detener polling si el pago está completado, fallido o expirado
        if (['completed', 'failed', 'expired', 'cancelled'].includes(data.status)) {
          clearInterval(pollInterval);
          setPolling(false);
          
          if (data.status === 'completed') {
            onSuccess?.(data);
          }
        }
      } catch (err) {
        logger.error('Error en polling:', { error: err instanceof Error ? err.message : String(err) });
        retryCount++;
        
        // Detener polling si se excede el número máximo de reintentos
        if (retryCount >= maxRetries) {
          logger.error('Error al verificar el estado del pago después de múltiples intentos');
          clearInterval(pollInterval);
          setPolling(false);
          return;
        }
      }
    }, 5000); // Consultar cada 5 segundos

    // Limpiar intervalo después de 30 minutos (tiempo máximo de espera)
    setTimeout(() => {
      clearInterval(pollInterval);
      setPolling(false);
    }, 30 * 60 * 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Enlace copiado al portapapeles');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'expired':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente de pago';
      case 'completed':
        return 'Pago completado';
      case 'failed':
        return 'Pago fallido';
      case 'expired':
        return 'Pago expirado';
      case 'cancelled':
        return 'Pago cancelado';
      default:
        return 'Estado desconocido';
    }
  };

  if (!paymentStatus) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-xl">Pagar con Khipu</CardTitle>
          <CardDescription>
            Paga de forma segura y rápida con transferencia bancaria o móvil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(amount)}
            </div>
            <div className="text-sm text-gray-600">{subject}</div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={createPayment} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Pagar con Khipu
                </>
              )}
            </Button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
                <Shield className="w-4 h-4" />
                Pagos seguros con Khipu
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Mobile
                </div>
                <div className="flex items-center gap-1">
                  <Banknote className="w-3 h-3" />
                  Transferencia
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Seguro
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Pago en Proceso</CardTitle>
            <CardDescription>
              {formatCurrency(amount)} - {subject}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(paymentStatus.status)}>
            {getStatusText(paymentStatus.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          {getStatusIcon(paymentStatus.status)}
          <span className="font-medium">{getStatusText(paymentStatus.status)}</span>
          {polling && (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          )}
        </div>

        {paymentStatus.status === 'pending' && paymentStatus.payment_url && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Completa tu pago
                </span>
              </div>
              <p className="text-xs text-blue-700">
                Haz clic en el botón o escanea el código QR para pagar
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => window.open(paymentStatus.payment_url, '_blank')}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Khipu para pagar
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQR(!showQR)}
                  className="flex-1"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {showQR ? 'Ocultar QR' : 'Mostrar QR'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(paymentStatus.payment_url!)}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar enlace
                </Button>
              </div>

              {showQR && (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="w-48 h-48 bg-white rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-600">
                    Escanea este código QR con tu app bancaria
                  </p>
                </div>
              )}
            </div>

            {paymentStatus.expires_at && (
              <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                <Clock className="w-3 h-3" />
                <span>
                  Expira: {new Date(paymentStatus.expires_at).toLocaleString('es-CL')}
                </span>
              </div>
            )}
          </div>
        )}

        {paymentStatus.status === 'completed' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">
                  ¡Pago completado con éxito!
                </span>
              </div>
              <p className="text-sm text-green-700">
                Tu pago ha sido procesado correctamente.
              </p>
              {paymentStatus.transaction_id && (
                <p className="text-xs text-green-600 mt-2">
                  ID de transacción: {paymentStatus.transaction_id}
                </p>
              )}
            </div>

            <Button 
              onClick={() => window.location.href = returnUrl}
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        )}

        {['failed', 'expired', 'cancelled'].includes(paymentStatus.status) && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">
                  Pago no completado
                </span>
              </div>
              <p className="text-sm text-red-700">
                {paymentStatus.status === 'failed' && 'El pago ha fallado. Por favor intenta nuevamente.'}
                {paymentStatus.status === 'expired' && 'El tiempo para pagar ha expirado. Por favor inicia un nuevo pago.'}
                {paymentStatus.status === 'cancelled' && 'El pago ha sido cancelado.'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={createPayment}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  'Intentar nuevamente'
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = cancelUrl}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
