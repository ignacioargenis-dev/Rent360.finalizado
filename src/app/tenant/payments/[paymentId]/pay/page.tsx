'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Building,
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Shield,
  Lock,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useUserState } from '@/hooks/useUserState';

interface PaymentData {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  amount: number;
  dueDate: string;
  description?: string;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash';
  name: string;
  details: string;
  isDefault: boolean;
}

export default function TenantPaymentProcessPage() {
  const { paymentId } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUserState();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentId) {
      loadPaymentData(paymentId as string);
      loadPaymentMethods();
    }
  }, [paymentId]);

  const loadPaymentData = async (id: string) => {
    try {
      // Mock payment data
      const mockPayment: PaymentData = {
        id: id,
        propertyTitle: 'Departamento Las Condes',
        propertyAddress: 'Av. Las Condes 1234, Las Condes, Santiago',
        amount: 450000,
        dueDate: '2024-01-15',
        description: 'Pago mensual de arriendo correspondiente a enero 2024',
      };

      setPayment(mockPayment);
    } catch (error) {
      logger.error('Error loading payment data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar datos del pago');
    }
  };

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);

      // Mock payment methods
      const mockMethods: PaymentMethod[] = [
        {
          id: '1',
          type: 'credit_card',
          name: 'Visa **** 1234',
          details: 'Vence: 12/26',
          isDefault: true,
        },
        {
          id: '2',
          type: 'debit_card',
          name: 'Banco Estado **** 5678',
          details: 'Cuenta corriente',
          isDefault: false,
        },
        {
          id: '3',
          type: 'bank_transfer',
          name: 'Transferencia Bancaria',
          details: 'Pago directo a propietario',
          isDefault: false,
        },
      ];

      setPaymentMethods(mockMethods);
      setSelectedMethod(mockMethods.find(m => m.isDefault)?.id || mockMethods[0]?.id || '');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error('Error loading payment methods:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="w-5 h-5" />;
      case 'bank_transfer':
        return <Building className="w-5 h-5" />;
      case 'cash':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Por favor selecciona un método de pago');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate success
      alert('Pago procesado exitosamente');
      router.push(`/tenant/payments/${paymentId}`);
    } catch (error) {
      logger.error('Error processing payment:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al procesar el pago. Por favor intenta nuevamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Procesar Pago" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando información del pago...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !payment) {
    return (
      <DashboardLayout title="Procesar Pago" subtitle="Error al cargar">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!payment) {
    return (
      <DashboardLayout title="Procesar Pago" subtitle="Pago no encontrado">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pago no encontrado</h3>
              <p className="text-gray-600 mb-4">
                El pago solicitado no existe o no está disponible.
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Procesar Pago" subtitle={`Pago de ${payment.propertyTitle}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumen del Pago
            </CardTitle>
            <CardDescription>Verifica los detalles antes de proceder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Propiedad</label>
                <div className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {payment.propertyTitle}
                </div>
                <div className="text-sm text-gray-600 mt-1">{payment.propertyAddress}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Monto a Pagar</label>
                <div className="text-3xl font-bold text-blue-600 mt-1">
                  {formatCurrency(payment.amount)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Vencimiento</label>
                <div className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(payment.dueDate)}
                </div>
              </div>

              {payment.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción</label>
                  <div className="text-lg text-gray-900 mt-1">{payment.description}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Método de Pago
            </CardTitle>
            <CardDescription>Selecciona cómo deseas realizar el pago</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
              <div className="space-y-4">
                {paymentMethods.map(method => (
                  <div
                    key={method.id}
                    className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getMethodIcon(method.type)}
                          <div>
                            <div className="font-medium text-gray-900">{method.name}</div>
                            <div className="text-sm text-gray-600">{method.details}</div>
                          </div>
                        </div>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Predeterminado
                          </Badge>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <Separator className="my-6" />

            <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium text-blue-900">Pago Seguro</div>
                <div className="text-blue-700">Tus datos están protegidos con encriptación SSL</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Payment Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total a pagar</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(payment.amount)}
                </div>
              </div>

              <Button
                size="lg"
                onClick={handlePayment}
                disabled={processing || !selectedMethod}
                className="px-8"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Pagar Ahora
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Este pago está protegido por nuestras políticas de seguridad. Al proceder, aceptas
            nuestros términos y condiciones de pago.
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
}
