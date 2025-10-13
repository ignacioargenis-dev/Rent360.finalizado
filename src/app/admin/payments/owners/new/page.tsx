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
  Home,
  Receipt,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

export default function NewOwnerPaymentPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    ownerId: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    propertyId: '',
    propertyAddress: '',
    paymentType: '',
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
    commissionAmount: '',
    netAmount: '',
    notes: '',
  });

  const [owners] = useState([
    { id: '1', name: 'María González', email: 'maria@email.com', phone: '+56912345678' },
    { id: '2', name: 'Carlos Rodríguez', email: 'carlos@email.com', phone: '+56987654321' },
    { id: '3', name: 'Ana López', email: 'ana@email.com', phone: '+56955556666' },
  ]);

  const [properties] = useState([
    { id: '1', address: 'Av. Providencia 123, Santiago', ownerId: '1' },
    { id: '2', address: 'Calle Las Condes 456, Las Condes', ownerId: '1' },
    { id: '3', address: 'Paseo Ñuñoa 789, Ñuñoa', ownerId: '2' },
    { id: '4', address: 'Av. Vitacura 321, Vitacura', ownerId: '3' },
  ]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'ownerId') {
      const selectedOwner = owners.find(o => o.id === value);
      if (selectedOwner) {
        setFormData(prev => ({
          ...prev,
          ownerId: value,
          ownerName: selectedOwner.name,
          ownerEmail: selectedOwner.email,
          ownerPhone: selectedOwner.phone,
          propertyId: '', // Reset property selection
          propertyAddress: '',
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
        }));
      }
    }

    if (field === 'amount' || field === 'commissionRate') {
      calculateCommission(
        field === 'amount' ? value : formData.amount,
        field === 'commissionRate' ? value : formData.commissionRate
      );
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateCommission = (amount: string, commissionRate: string) => {
    const numAmount = parseFloat(amount) || 0;
    const numCommissionRate = parseFloat(commissionRate) || 0;
    const commissionAmount = numAmount * (numCommissionRate / 100);
    const netAmount = numAmount - commissionAmount;

    setFormData(prev => ({
      ...prev,
      commissionAmount: commissionAmount.toFixed(2),
      netAmount: netAmount.toFixed(2),
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.ownerId) {
      newErrors.ownerId = 'Debe seleccionar un propietario';
    }
    if (!formData.propertyId) {
      newErrors.propertyId = 'Debe seleccionar una propiedad';
    }
    if (!formData.paymentType) {
      newErrors.paymentType = 'Debe seleccionar un tipo de pago';
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

      logger.info('Pago a propietario creado exitosamente', {
        ownerId: formData.ownerId,
        propertyId: formData.propertyId,
        amount: formData.amount,
        paymentDate: formData.paymentDate,
      });

      setSuccessMessage('Pago a propietario creado exitosamente');

      setTimeout(() => {
        router.push('/admin/payments/owners');
      }, 2000);
    } catch (error) {
      logger.error('Error al crear pago a propietario', { error });
      setErrorMessage('Error al crear el pago. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/payments/owners');
  };

  const availableProperties = properties.filter(p => p.ownerId === formData.ownerId);

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Pago a Propietario</h1>
            <p className="text-gray-600">Registre un nuevo pago para propietarios</p>
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
            {/* Información del Propietario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Propietario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ownerId">Seleccionar Propietario</Label>
                  <Select
                    value={formData.ownerId}
                    onValueChange={value => handleInputChange('ownerId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un propietario" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map(owner => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.name} - {owner.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.ownerId && <p className="text-sm text-red-600 mt-1">{errors.ownerId}</p>}
                </div>

                <div>
                  <Label htmlFor="ownerName">Nombre del Propietario</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={e => handleInputChange('ownerName', e.target.value)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownerEmail">Email</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={formData.ownerEmail}
                      onChange={e => handleInputChange('ownerEmail', e.target.value)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerPhone">Teléfono</Label>
                    <Input
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={e => handleInputChange('ownerPhone', e.target.value)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de la Propiedad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Información de la Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="propertyId">Seleccionar Propiedad</Label>
                  <Select
                    value={formData.propertyId}
                    onValueChange={value => handleInputChange('propertyId', value)}
                    disabled={!formData.ownerId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          formData.ownerId
                            ? 'Seleccione una propiedad'
                            : 'Primero seleccione un propietario'
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
                  <Label htmlFor="paymentType">Tipo de Pago</Label>
                  <Select
                    value={formData.paymentType}
                    onValueChange={value => handleInputChange('paymentType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">Alquiler</SelectItem>
                      <SelectItem value="commission">Comisión</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      <SelectItem value="deposit">Depósito de Garantía</SelectItem>
                      <SelectItem value="refund">Reembolso</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.paymentType && (
                    <p className="text-sm text-red-600 mt-1">{errors.paymentType}</p>
                  )}
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
                    <Label htmlFor="amount">Monto Total</Label>
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

                {formData.paymentType === 'commission' && (
                  <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div>
                      <Label htmlFor="commissionAmount">Comisión Calculada</Label>
                      <Input
                        id="commissionAmount"
                        value={formData.commissionAmount}
                        readOnly
                        className="bg-gray-50"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                {formData.paymentType === 'commission' && (
                  <div>
                    <Label htmlFor="netAmount">Monto Neto (después de comisión)</Label>
                    <Input
                      id="netAmount"
                      value={formData.netAmount}
                      readOnly
                      className="bg-green-50 text-green-900 font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                )}

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
                    placeholder="Describa el motivo del pago..."
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
                      placeholder="Número de contrato, recibo, etc."
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
