'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Building,
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Download,
  Printer,
  Share2,
  Clock,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';

interface PaymentDetail {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  method?: string;
  invoiceNumber?: string;
  description?: string;
  landlordName: string;
  landlordEmail: string;
}

export default function TenantPaymentDetailPage() {
  const { paymentId } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useAuth();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (paymentId) {
      loadPaymentDetail(paymentId as string);
    }
  }, [paymentId]);

  const loadPaymentDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for payment detail
      const mockPayment: PaymentDetail = {
        id: id,
        propertyTitle: 'Departamento Las Condes',
        propertyAddress: 'Av. Las Condes 1234, Las Condes, Santiago',
        amount: 450000,
        dueDate: '2024-01-15',
        paymentDate: '2024-01-14',
        status: 'paid',
        method: 'transferencia bancaria',
        invoiceNumber: 'INV-001-2024',
        description: 'Pago mensual de arriendo correspondiente a enero 2024',
        landlordName: 'María González',
        landlordEmail: 'maria.gonzalez@propiedades.cl',
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPayment(mockPayment);
    } catch (error) {
      logger.error('Error loading payment detail:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los detalles del pago');
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'Pagado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      overdue: { label: 'Vencido', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleDownloadReceipt = () => {
    if (payment?.invoiceNumber) {
      setSuccessMessage(
        `Descargando recibo: ${payment.invoiceNumber} - ${formatCurrency(payment.amount)}`
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleShareReceipt = () => {
    if (navigator.share && payment) {
      navigator.share({
        title: `Recibo de Pago - ${payment.propertyTitle}`,
        text: `Recibo de pago por ${formatCurrency(payment.amount)} correspondiente a ${payment.propertyTitle}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setSuccessMessage('Enlace copiado al portapapeles');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Detalle de Pago" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando detalles del pago...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error || !payment) {
    return (
      <UnifiedDashboardLayout title="Detalle de Pago" subtitle="Error al cargar">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error || 'Pago no encontrado'}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title={`Pago - ${payment.propertyTitle}`}
      subtitle={`ID: ${payment.id}`}
    >
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Pagos
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShareReceipt}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
            <Button variant="outline" onClick={handlePrintReceipt}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            {payment.status === 'paid' && (
              <Button onClick={handleDownloadReceipt}>
                <Download className="w-4 h-4 mr-2" />
                Descargar Recibo
              </Button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Estado del Pago
                </CardTitle>
                <CardDescription>Información general del pago</CardDescription>
              </div>
              {getStatusBadge(payment.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Monto</label>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(payment.amount)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Vencimiento</label>
                <div className="text-lg text-gray-900 mt-1">{formatDate(payment.dueDate)}</div>
              </div>

              {payment.paymentDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Pago</label>
                  <div className="text-lg text-green-600 mt-1">
                    {formatDate(payment.paymentDate)}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Método de Pago</label>
                <div className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {payment.method || 'No especificado'}
                </div>
              </div>

              {payment.invoiceNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Número de Factura</label>
                  <div className="text-lg text-gray-900 mt-1 font-mono">
                    {payment.invoiceNumber}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Property Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Información de la Propiedad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Propiedad</label>
                <div className="text-lg text-gray-900 mt-1">{payment.propertyTitle}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Dirección</label>
                <div className="text-lg text-gray-900 mt-1">{payment.propertyAddress}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Propietario</label>
                <div className="text-lg text-gray-900 mt-1">{payment.landlordName}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Email del Propietario</label>
                <div className="text-lg text-gray-900 mt-1">{payment.landlordEmail}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Description */}
        {payment.description && (
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{payment.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Payment Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Cronología del Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Pago Creado</div>
                  <div className="text-sm text-gray-600">
                    Fecha de vencimiento: {formatDate(payment.dueDate)}
                  </div>
                </div>
              </div>

              {payment.paymentDate && (
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-900">Pago Realizado</div>
                    <div className="text-sm text-gray-600">
                      Fecha de pago: {formatDate(payment.paymentDate)}
                    </div>
                    {payment.method && (
                      <div className="text-sm text-gray-600">Método: {payment.method}</div>
                    )}
                  </div>
                </div>
              )}

              {payment.status === 'overdue' && (
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-900">Pago Vencido</div>
                    <div className="text-sm text-gray-600">El pago está pendiente de pago</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
