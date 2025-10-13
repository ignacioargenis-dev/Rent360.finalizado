'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';


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
  TrendingUp,
  Receipt,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

export default function NewBrokerPaymentPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    brokerId: '',
    brokerName: '',
    brokerEmail: '',
    brokerPhone: '',
    commissionType: '',
    propertyId: '',
    propertyAddress: '',
    clientId: '',
    clientName: '',
    amount: '',
    currency: 'CLP',
    paymentMethod: '',
    paymentDate: '',
    dueDate: '',
    status: 'pending',
    description: '',
    reference: '',
    invoiceNumber: '',
    commissionRate: '',
    baseAmount: '',
    bonus: '',
    totalCommission: '',
    notes: '',
  });

  const [brokers] = useState([
    { id: '1', name: 'Juan Pérez', email: 'juan@broker.cl', phone: '+56912345678' },
    { id: '2', name: 'María García', email: 'maria@broker.cl', phone: '+56987654321' },
    { id: '3', name: 'Carlos López', email: 'carlos@broker.cl', phone: '+56955556666' },
  ]);

  const [properties] = useState([
    { id: '1', address: 'Av. Providencia 123, Santiago', brokerId: '1' },
    { id: '2', address: 'Calle Las Condes 456, Las Condes', brokerId: '1' },
    { id: '3', address: 'Paseo Ñuñoa 789, Ñuñoa', brokerId: '2' },
    { id: '4', address: 'Av. Vitacura 321, Vitacura', brokerId: '3' },
  ]);

  const [clients] = useState([
    { id: '1', name: 'Ana Rodríguez', propertyId: '1' },
    { id: '2', name: 'Pedro Sánchez', propertyId: '2' },
    { id: '3', name: 'Laura Martínez', propertyId: '3' },
    { id: '4', name: 'Diego Torres', propertyId: '4' },
  ]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'brokerId') {
      const selectedBroker = brokers.find(b => b.id === value);
      if (selectedBroker) {
        setFormData(prev => ({
          ...prev,
          brokerId: value,
          brokerName: selectedBroker.name,
          brokerEmail: selectedBroker.email,
          brokerPhone: selectedBroker.phone,
          propertyId: '', // Reset property selection
          propertyAddress: '',
          clientId: '', // Reset client selection
          clientName: '',
        }));
      }
    }

    if (field === 'propertyId') {
      const selectedProperty = properties.find(p => p.id === value);
      if (selectedProperty) {
        setFormData(prev => ({
          ...prev,
          propertyId: value,
          propertyAddress: selectedProperty.address,
          clientId: '', // Reset client when property changes
          clientName: '',
        }));
      }
    }

    if (field === 'clientId') {
      const selectedClient = clients.find(c => c.id === value);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          clientId: value,
          clientName: selectedClient.name,
        }));
      }
    }

    if (field === 'baseAmount' || field === 'commissionRate' || field === 'bonus') {
      calculateCommission(
        field === 'baseAmount' ? value : formData.baseAmount,
        field === 'commissionRate' ? value : formData.commissionRate,
        field === 'bonus' ? value : formData.bonus
      );
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateCommission = (baseAmount: string, commissionRate: string, bonus: string) => {
    const numBaseAmount = parseFloat(baseAmount) || 0;
    const numCommissionRate = parseFloat(commissionRate) || 0;
    const numBonus = parseFloat(bonus) || 0;
    const commissionAmount = numBaseAmount * (numCommissionRate / 100);
    const totalCommission = commissionAmount + numBonus;

    setFormData(prev => ({
      ...prev,
      amount: totalCommission.toFixed(2),
      totalCommission: totalCommission.toFixed(2),
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.brokerId) {
      newErrors.brokerId = 'Debe seleccionar un corredor';
    }
    if (!formData.commissionType) {
      newErrors.commissionType = 'Debe seleccionar un tipo de comisión';
    }
    if (!formData.propertyId) {
      newErrors.propertyId = 'Debe seleccionar una propiedad';
    }
    if (!formData.clientId) {
      newErrors.clientId = 'Debe seleccionar un cliente';
    }
    if (!formData.baseAmount || parseFloat(formData.baseAmount) <= 0) {
      newErrors.baseAmount = 'Debe ingresar un monto base válido';
    }
    if (!formData.commissionRate || parseFloat(formData.commissionRate) <= 0) {
      newErrors.commissionRate = 'Debe ingresar una tasa de comisión válida';
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

      logger.info('Pago de comisión a corredor creado exitosamente', {
        brokerId: formData.brokerId,
        propertyId: formData.propertyId,
        clientId: formData.clientId,
        amount: formData.amount,
        paymentDate: formData.paymentDate,
      });

      setSuccessMessage('Pago de comisión creado exitosamente');

      setTimeout(() => {
        router.push('/admin/payments/brokers');
      }, 2000);
    } catch (error) {
      logger.error('Error al crear pago de comisión', { error });
      setErrorMessage('Error al crear el pago. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/payments/brokers');
  };

  const availableProperties = properties.filter(p => p.brokerId === formData.brokerId);
  const availableClients = clients.filter(c => c.propertyId === formData.propertyId);

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Comisión a Corredor</h1>
            <p className="text-gray-600">Registre un nuevo pago de comisión para corredores</p>
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
            {/* Información del Corredor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Corredor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brokerId">Seleccionar Corredor</Label>
                  <Select
                    value={formData.brokerId}
                    onValueChange={value => handleInputChange('brokerId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un corredor" />
                    </SelectTrigger>
                    <SelectContent>
                      {brokers.map(broker => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.name} - {broker.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.brokerId && (
                    <p className="text-sm text-red-600 mt-1">{errors.brokerId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="brokerName">Nombre del Corredor</Label>
                  <Input
                    id="brokerName"
                    value={formData.brokerName}
                    onChange={e => handleInputChange('brokerName', e.target.value)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brokerEmail">Email</Label>
                    <Input
                      id="brokerEmail"
                      type="email"
                      value={formData.brokerEmail}
                      onChange={e => handleInputChange('brokerEmail', e.target.value)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brokerPhone">Teléfono</Label>
                    <Input
                      id="brokerPhone"
                      value={formData.brokerPhone}
                      onChange={e => handleInputChange('brokerPhone', e.target.value)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="commissionType">Tipo de Comisión</Label>
                  <Select
                    value={formData.commissionType}
                    onValueChange={value => handleInputChange('commissionType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo de comisión" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property_sale">Venta de Propiedad</SelectItem>
                      <SelectItem value="property_rental">Arriendo de Propiedad</SelectItem>
                      <SelectItem value="renewal">Renovación de Contrato</SelectItem>
                      <SelectItem value="referral">Referencia</SelectItem>
                      <SelectItem value="bonus">Bono Especial</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.commissionType && (
                    <p className="text-sm text-red-600 mt-1">{errors.commissionType}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información de la Transacción */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Información de la Transacción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="propertyId">Seleccionar Propiedad</Label>
                  <Select
                    value={formData.propertyId}
                    onValueChange={value => handleInputChange('propertyId', value)}
                    disabled={!formData.brokerId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          formData.brokerId
                            ? 'Seleccione una propiedad'
                            : 'Primero seleccione un corredor'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProperties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyId && (
                    <p className="text-sm text-red-600 mt-1">{errors.propertyId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="propertyAddress">Dirección de la Propiedad</Label>
                  <Input
                    id="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={e => handleInputChange('propertyAddress', e.target.value)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="clientId">Seleccionar Cliente</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={value => handleInputChange('clientId', value)}
                    disabled={!formData.propertyId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          formData.propertyId
                            ? 'Seleccione un cliente'
                            : 'Primero seleccione una propiedad'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientId && (
                    <p className="text-sm text-red-600 mt-1">{errors.clientId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="clientName">Nombre del Cliente</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={e => handleInputChange('clientName', e.target.value)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cálculo de Comisión */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Cálculo de Comisión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="baseAmount">Monto Base</Label>
                    <Input
                      id="baseAmount"
                      type="number"
                      step="0.01"
                      value={formData.baseAmount}
                      onChange={e => handleInputChange('baseAmount', e.target.value)}
                      placeholder="0.00"
                    />
                    {errors.baseAmount && (
                      <p className="text-sm text-red-600 mt-1">{errors.baseAmount}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="commissionRate">Tasa de Comisión (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.01"
                      value={formData.commissionRate}
                      onChange={e => handleInputChange('commissionRate', e.target.value)}
                      placeholder="5.00"
                    />
                    {errors.commissionRate && (
                      <p className="text-sm text-red-600 mt-1">{errors.commissionRate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bonus">Bono Adicional (opcional)</Label>
                  <Input
                    id="bonus"
                    type="number"
                    step="0.01"
                    value={formData.bonus}
                    onChange={e => handleInputChange('bonus', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="totalCommission">Comisión Total</Label>
                    <Input
                      id="totalCommission"
                      value={formData.totalCommission}
                      readOnly
                      className="bg-blue-50 text-blue-900 font-semibold"
                      placeholder="0.00"
                    />
                  </div>
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
                  <Receipt className="w-5 h-5" />
                  Información Adicional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description">Descripción del Pago</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="Describa el motivo de la comisión..."
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
                      placeholder="Número de contrato, factura, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceNumber">Número de Recibo</Label>
                    <Input
                      id="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={e => handleInputChange('invoiceNumber', e.target.value)}
                      placeholder="REC-2024-001"
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
                  Crear Comisión
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
