'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Building,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

export default function NewProviderPaymentPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    providerId: '',
    providerName: '',
    providerEmail: '',
    providerPhone: '',
    serviceType: '',
    amount: '',
    currency: 'CLP',
    paymentMethod: '',
    paymentDate: '',
    dueDate: '',
    status: 'pending',
    description: '',
    reference: '',
    invoiceNumber: '',
    taxRate: '19',
    taxAmount: '',
    totalAmount: '',
    notes: '',
  });

  const [providers] = useState([
    {
      id: '1',
      name: 'Servicios Eléctricos Ltda',
      email: 'contacto@electricos.cl',
      phone: '+56912345678',
      serviceType: 'Electricidad',
    },
    {
      id: '2',
      name: 'Fontanería Express',
      email: 'info@fontaneria.cl',
      phone: '+56987654321',
      serviceType: 'Fontanería',
    },
    {
      id: '3',
      name: 'Mantenimiento General SPA',
      email: 'admin@mantenimiento.cl',
      phone: '+56955556666',
      serviceType: 'Mantenimiento',
    },
  ]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'providerId') {
      const selectedProvider = providers.find(p => p.id === value);
      if (selectedProvider) {
        setFormData(prev => ({
          ...prev,
          providerId: value,
          providerName: selectedProvider.name,
          providerEmail: selectedProvider.email,
          providerPhone: selectedProvider.phone,
          serviceType: selectedProvider.serviceType,
        }));
      }
    }

    if (field === 'amount' || field === 'taxRate') {
      calculateTotals(
        field === 'amount' ? value : formData.amount,
        field === 'taxRate' ? value : formData.taxRate
      );
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateTotals = (amount: string, taxRate: string) => {
    const numAmount = parseFloat(amount) || 0;
    const numTaxRate = parseFloat(taxRate) || 0;
    const taxAmount = numAmount * (numTaxRate / 100);
    const totalAmount = numAmount + taxAmount;

    setFormData(prev => ({
      ...prev,
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.providerId) {
      newErrors.providerId = 'Debe seleccionar un proveedor';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Debe ingresar un monto válido';
    }
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Debe seleccionar un método de pago';
    }
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Debe seleccionar una fecha de pago';
    }
    if (!formData.description) {
      newErrors.description = 'Debe ingresar una descripción';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      setErrorMessage('Por favor complete todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      logger.info('Pago a proveedor creado exitosamente', {
        providerId: formData.providerId,
        amount: formData.totalAmount,
        paymentDate: formData.paymentDate,
      });

      setSuccessMessage('Pago a proveedor creado exitosamente');

      setTimeout(() => {
        router.push('/admin/payments/providers');
      }, 2000);
    } catch (error) {
      logger.error('Error al crear pago a proveedor', { error });
      setErrorMessage('Error al crear el pago. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/payments/providers');
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Pago a Proveedor</h1>
            <p className="text-gray-600">Registre un nuevo pago para servicios de proveedores</p>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del Proveedor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Proveedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="providerId">Seleccionar Proveedor</Label>
                  <Select
                    value={formData.providerId}
                    onValueChange={value => handleInputChange('providerId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name} - {provider.serviceType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.providerId && (
                    <p className="text-sm text-red-600 mt-1">{errors.providerId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="providerName">Nombre del Proveedor</Label>
                  <Input
                    id="providerName"
                    value={formData.providerName}
                    onChange={e => handleInputChange('providerName', e.target.value)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="providerEmail">Email</Label>
                    <Input
                      id="providerEmail"
                      type="email"
                      value={formData.providerEmail}
                      onChange={e => handleInputChange('providerEmail', e.target.value)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="providerPhone">Teléfono</Label>
                    <Input
                      id="providerPhone"
                      value={formData.providerPhone}
                      onChange={e => handleInputChange('providerPhone', e.target.value)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="serviceType">Tipo de Servicio</Label>
                  <Input
                    id="serviceType"
                    value={formData.serviceType}
                    onChange={e => handleInputChange('serviceType', e.target.value)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Detalles del Pago */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Detalles del Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Monto Base (sin IVA)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={e => handleInputChange('amount', e.target.value)}
                      placeholder="0.00"
                    />
                    {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount}</p>}
                  </div>
                  <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={value => handleInputChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxRate">Tasa IVA (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={formData.taxRate}
                      onChange={e => handleInputChange('taxRate', e.target.value)}
                      placeholder="19"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxAmount">IVA Calculado</Label>
                    <Input
                      id="taxAmount"
                      value={formData.taxAmount}
                      readOnly
                      className="bg-gray-50"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="totalAmount">Total con IVA</Label>
                  <Input
                    id="totalAmount"
                    value={formData.totalAmount}
                    readOnly
                    className="bg-blue-50 text-blue-900 font-semibold"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Método de Pago</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={value => handleInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transferencia Bancaria</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta de Crédito/Débito</SelectItem>
                      <SelectItem value="wallet">Billetera Digital</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.paymentMethod && (
                    <p className="text-sm text-red-600 mt-1">{errors.paymentMethod}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fechas y Estado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Fechas y Estado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentDate">Fecha de Pago</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={e => handleInputChange('paymentDate', e.target.value)}
                    />
                    {errors.paymentDate && (
                      <p className="text-sm text-red-600 mt-1">{errors.paymentDate}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Fecha de Vencimiento (opcional)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={e => handleInputChange('dueDate', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Estado del Pago</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Pendiente
                        </div>
                      </SelectItem>
                      <SelectItem value="processing">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Procesando
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Completado
                        </div>
                      </SelectItem>
                      <SelectItem value="failed">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Fallido
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Información Adicional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Información Adicional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description">Descripción del Servicio</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="Describa el servicio o trabajo realizado..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reference">Referencia</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={e => handleInputChange('reference', e.target.value)}
                      placeholder="Número de orden, contrato, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceNumber">Número de Factura</Label>
                    <Input
                      id="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={e => handleInputChange('invoiceNumber', e.target.value)}
                      placeholder="FAC-2024-001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    placeholder="Observaciones adicionales..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Pago
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
