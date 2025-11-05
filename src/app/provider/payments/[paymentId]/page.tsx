'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Wrench,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Download,
  Clock,
  User,
  Building,
  CreditCard,
  Save,
  Edit,
  Shield,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaymentDetail {
  id: string;
  jobTitle: string;
  clientName: string;
  clientEmail?: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
  jobDate?: string;
  dueDate?: string;
  rating?: number;
  description?: string;
  jobType: string;
  hoursWorked?: number;
}

export default function ProviderPaymentDetailPage() {
  const params = useParams();
  const paymentId = params?.paymentId as string;
  const router = useRouter();
  const { user, loading: userLoading } = useAuth();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showBankConfig, setShowBankConfig] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankAccount, setBankAccount] = useState({
    bankName: '',
    accountType: 'checking', // 'checking' | 'savings'
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    rut: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (paymentId) {
      loadPaymentDetail(paymentId as string);
      loadBankAccount();
    }
  }, [paymentId]);

  const loadBankAccount = async () => {
    try {
      const response = await fetch('/api/provider/bank-account', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.bankAccount) {
          setBankAccount({
            bankName: data.bankAccount.bankName || '',
            accountType: data.bankAccount.accountType || 'checking',
            accountNumber: data.bankAccount.accountNumber || '',
            routingNumber: data.bankAccount.routingNumber || '',
            accountHolderName: data.bankAccount.accountHolderName || '',
            rut: data.bankAccount.rut || '',
            email: data.bankAccount.email || '',
            phone: data.bankAccount.phone || '',
          });
        }
      }
    } catch (error) {
      logger.error('Error loading bank account:', { error });
    }
  };

  const handleSaveBankAccount = async () => {
    setIsSavingBank(true);
    try {
      const response = await fetch('/api/provider/bank-account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bankAccount),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccessMessage('Configuración bancaria guardada exitosamente');
          setIsEditingBank(false);
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la configuración bancaria');
      }
    } catch (error) {
      logger.error('Error saving bank account:', { error });
      setError(
        error instanceof Error ? error.message : 'Error al guardar la configuración bancaria'
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSavingBank(false);
    }
  };

  const loadPaymentDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos reales desde la API
      const response = await fetch(`/api/provider/payments/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform API data to match our interface
      const transformedPayment: PaymentDetail = {
        id: data.id,
        jobTitle: data.jobTitle || 'Trabajo no identificado',
        clientName: data.client?.name || 'Cliente no identificado',
        clientEmail: data.client?.email || '',
        amount: data.amount || 0,
        status: data.status?.toLowerCase() || 'pending',
        paymentDate: data.paymentDate,
        jobDate: data.jobDate,
        dueDate: data.dueDate,
        rating: data.rating || 0,
        description: data.description || 'Sin descripción',
        jobType: data.jobType || 'Servicio',
        hoursWorked: data.hoursWorked || 0,
      };

      setPayment(transformedPayment);

      logger.debug('Detalles de pago de proveedor cargados', {
        paymentId: id,
        jobTitle: transformedPayment.jobTitle,
        amount: transformedPayment.amount,
      });
    } catch (error) {
      logger.error('Error loading payment detail:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los detalles del pago');

      // En caso de error, mostrar datos vacíos
      setPayment(null);
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) {
      return 'No especificada';
    }
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

  const handleDownloadInvoice = () => {
    if (payment) {
      // Generate invoice content
      const invoiceContent = `
FACTURA DE SERVICIO
==================

Número de Factura: INV-${payment.id}
Fecha: ${new Date().toLocaleDateString('es-ES')}
Cliente: ${payment.clientName}
Trabajo: ${payment.jobTitle}
Monto: ${formatCurrency(payment.amount)}
Estado: ${payment.status}
Fecha de Pago: ${payment.paymentDate}

DETALLES DEL SERVICIO:
- Servicio realizado: ${payment.jobTitle}
- Monto cobrado: ${formatCurrency(payment.amount)}
- Tipo de trabajo: ${payment.jobType}

Rent360 - Sistema de Gestión de Servicios
      `.trim();

      // Create and download the invoice
      const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura_${payment.id}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage('Factura descargada exitosamente');
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
    <UnifiedDashboardLayout title={`Pago - ${payment.jobTitle}`} subtitle={`ID: ${payment.id}`}>
      <div className="space-y-6">
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

        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Ingresos
          </Button>

          {payment.status === 'paid' && (
            <Button onClick={handleDownloadInvoice}>
              <Download className="w-4 h-4 mr-2" />
              Descargar Factura
            </Button>
          )}
        </div>

        {/* Payment Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Estado del Pago
              </CardTitle>
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
                <label className="text-sm font-medium text-gray-500">Tipo de Trabajo</label>
                <div className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  {payment.jobType}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Cliente</label>
                <div className="text-lg text-gray-900 mt-1">{payment.clientName}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Fecha del Trabajo</label>
                <div className="text-lg text-gray-900 mt-1">
                  {payment.jobDate ? formatDate(payment.jobDate) : 'No especificada'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Vencimiento</label>
                <div className="text-lg text-gray-900 mt-1">
                  {payment.dueDate ? formatDate(payment.dueDate) : 'No especificada'}
                </div>
              </div>

              {payment.paymentDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Pago</label>
                  <div className="text-lg text-green-600 mt-1">
                    {formatDate(payment.paymentDate)}
                  </div>
                </div>
              )}

              {payment.hoursWorked && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Horas Trabajadas</label>
                  <div className="text-lg text-gray-900 mt-1">{payment.hoursWorked} horas</div>
                </div>
              )}

              {payment.rating && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Calificación</label>
                  <div className="text-lg text-yellow-600 mt-1">⭐ {payment.rating}/5</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Información del Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Trabajo Realizado</label>
                <div className="text-lg text-gray-900 mt-1">{payment.jobTitle}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Cliente</label>
                <div className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {payment.clientName}
                </div>
                {payment.clientEmail && (
                  <div className="text-sm text-gray-600 mt-1">{payment.clientEmail}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        {payment.description && (
          <Card>
            <CardHeader>
              <CardTitle>Descripción del Trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{payment.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Bank Account Configuration */}
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Configuración de Cuenta Bancaria
              </CardTitle>
              {!isEditingBank && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingBank(true);
                    setShowBankConfig(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {bankAccount.accountNumber ? 'Editar' : 'Configurar'}
                </Button>
              )}
            </div>
            <CardDescription>
              Configura tu cuenta bancaria para recibir pagos directamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditingBank ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Banco *</Label>
                    <Input
                      id="bankName"
                      value={bankAccount.bankName}
                      onChange={e => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                      placeholder="Ej: Banco de Chile"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountType">Tipo de Cuenta *</Label>
                    <Select
                      value={bankAccount.accountType}
                      onValueChange={value =>
                        setBankAccount({
                          ...bankAccount,
                          accountType: value as 'checking' | 'savings',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Cuenta Corriente</SelectItem>
                        <SelectItem value="savings">Cuenta de Ahorro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountNumber">Número de Cuenta *</Label>
                    <Input
                      id="accountNumber"
                      value={bankAccount.accountNumber}
                      onChange={e =>
                        setBankAccount({ ...bankAccount, accountNumber: e.target.value })
                      }
                      placeholder="Ej: 1234567890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="routingNumber">RUT Titular *</Label>
                    <Input
                      id="routingNumber"
                      value={bankAccount.rut}
                      onChange={e => setBankAccount({ ...bankAccount, rut: e.target.value })}
                      placeholder="Ej: 12.345.678-9"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accountHolderName">Nombre del Titular *</Label>
                  <Input
                    id="accountHolderName"
                    value={bankAccount.accountHolderName}
                    onChange={e =>
                      setBankAccount({ ...bankAccount, accountHolderName: e.target.value })
                    }
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email de Contacto</Label>
                    <Input
                      id="email"
                      type="email"
                      value={bankAccount.email}
                      onChange={e => setBankAccount({ ...bankAccount, email: e.target.value })}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono de Contacto</Label>
                    <Input
                      id="phone"
                      value={bankAccount.phone}
                      onChange={e => setBankAccount({ ...bankAccount, phone: e.target.value })}
                      placeholder="+56912345678"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Tu información bancaria está protegida y encriptada. Solo se usa para procesar
                    tus pagos.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveBankAccount} disabled={isSavingBank}>
                    {isSavingBank ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingBank(false);
                      loadBankAccount(); // Recargar datos originales
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {bankAccount.accountNumber ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Banco</Label>
                      <div className="text-lg font-medium">
                        {bankAccount.bankName || 'No configurado'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Tipo de Cuenta</Label>
                      <div className="text-lg font-medium">
                        {bankAccount.accountType === 'checking'
                          ? 'Cuenta Corriente'
                          : 'Cuenta de Ahorro'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Número de Cuenta</Label>
                      <div className="text-lg font-mono">
                        {bankAccount.accountNumber.slice(0, 4)}****
                        {bankAccount.accountNumber.slice(-4)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Titular</Label>
                      <div className="text-lg font-medium">
                        {bankAccount.accountHolderName || 'No configurado'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      No has configurado una cuenta bancaria para recibir pagos
                    </p>
                    <Button onClick={() => setIsEditingBank(true)}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Configurar Cuenta Bancaria
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Cronología del Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Trabajo Solicitado</div>
                  <div className="text-sm text-gray-600">Tipo: {payment.jobType}</div>
                  {payment.jobDate &&
                    (() => {
                      const jobDateValue = payment.jobDate!;
                      return (
                        <div className="text-sm text-gray-600">
                          Fecha: {formatDate(jobDateValue)}
                        </div>
                      );
                    })()}
                </div>
              </div>

              {payment.jobDate &&
                (() => {
                  const jobDateValue = payment.jobDate!;
                  return (
                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-gray-900">Trabajo Programado</div>
                        <div className="text-sm text-gray-600">
                          Fecha programada: {formatDate(jobDateValue)}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Trabajo Completado</div>
                  <div className="text-sm text-gray-600">Servicio realizado exitosamente</div>
                  {payment.hoursWorked && (
                    <div className="text-sm text-gray-600">
                      Tiempo trabajado: {payment.hoursWorked} horas
                    </div>
                  )}
                  {payment.rating && (
                    <div className="text-sm text-yellow-600">
                      Calificación del cliente: ⭐ {payment.rating}/5
                    </div>
                  )}
                </div>
              </div>

              {payment.paymentDate && (
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-900">Pago Recibido</div>
                    <div className="text-sm text-gray-600">
                      Fecha de pago: {formatDate(payment.paymentDate)}
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      Monto: {formatCurrency(payment.amount)}
                    </div>
                  </div>
                </div>
              )}

              {payment.status === 'pending' && (
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-900">Pago Pendiente</div>
                    <div className="text-sm text-gray-600">
                      Vence el: {payment.dueDate ? formatDate(payment.dueDate) : 'No especificada'}
                    </div>
                  </div>
                </div>
              )}

              {payment.status === 'overdue' && (
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-900">Pago Vencido</div>
                    <div className="text-sm text-gray-600">El pago está pendiente de cobro</div>
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
