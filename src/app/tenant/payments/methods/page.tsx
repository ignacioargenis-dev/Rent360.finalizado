'use client';

// Build fix - force update

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  CreditCard,
  Building2,
  Smartphone,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet';
  name: string;
  lastFour?: string;
  expiryDate?: string;
  bankName?: string;
  accountNumber?: string;
  walletType?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function TenantPaymentMethodsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const loadPaymentMethods = async () => {
      try {
        // Mock payment methods data
        const mockPaymentMethods: PaymentMethod[] = [
          {
            id: '1',
            type: 'credit_card',
            name: 'Visa **** 4532',
            lastFour: '4532',
            expiryDate: '12/26',
            isDefault: true,
            isActive: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          },
          {
            id: '2',
            type: 'debit_card',
            name: 'Mastercard **** 7890',
            lastFour: '7890',
            expiryDate: '08/25',
            isDefault: false,
            isActive: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
          },
          {
            id: '3',
            type: 'bank_transfer',
            name: 'Cuenta Banco Estado',
            bankName: 'Banco Estado',
            accountNumber: '****1234',
            isDefault: false,
            isActive: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          },
          {
            id: '4',
            type: 'digital_wallet',
            name: 'Mercado Pago',
            walletType: 'Mercado Pago',
            isDefault: false,
            isActive: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          },
        ];

        setPaymentMethods(mockPaymentMethods);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading payment methods:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadPaymentMethods();
  }, []);

  const handleSetDefault = async (methodId: string) => {
    setPaymentMethods(prev =>
      prev.map(method => ({
        ...method,
        isDefault: method.id === methodId,
      }))
    );
  };

  const handleToggleActive = async (methodId: string) => {
    setPaymentMethods(prev =>
      prev.map(method =>
        method.id === methodId ? { ...method, isActive: !method.isActive } : method
      )
    );
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este método de pago?')) {
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
    }
  };

  const handleAddMethod = async () => {
    const methodType = prompt(
      'Tipo de método de pago (tarjeta_credito, tarjeta_debito, transferencia, efectivo):'
    );
    if (
      methodType &&
      ['tarjeta_credito', 'tarjeta_debito', 'transferencia', 'efectivo'].includes(methodType)
    ) {
      setSuccessMessage(`Método de pago "${methodType}" agregado exitosamente`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else if (methodType) {
      setErrorMessage('Tipo de método de pago no válido');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="w-6 h-6" />;
      case 'bank_transfer':
        return <Building2 className="w-6 h-6" />;
      case 'digital_wallet':
        return <Smartphone className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'credit_card':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'debit_card':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'bank_transfer':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'digital_wallet':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'credit_card':
        return <Badge className="bg-blue-100 text-blue-800">Tarjeta Crédito</Badge>;
      case 'debit_card':
        return <Badge className="bg-green-100 text-green-800">Tarjeta Débito</Badge>;
      case 'bank_transfer':
        return <Badge className="bg-purple-100 text-purple-800">Transferencia</Badge>;
      case 'digital_wallet':
        return <Badge className="bg-orange-100 text-orange-800">Billetera Digital</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando métodos de pago...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout title="Métodos de Pago" subtitle="Gestiona tus métodos de pago">
      <div className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
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
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Métodos de Pago</h1>
            <p className="text-gray-600">Gestiona tus métodos de pago para pagos automáticos</p>
          </div>
          <Button onClick={handleAddMethod}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Método
          </Button>
        </div>

        {/* Payment Methods List */}
        <div className="grid gap-4">
          {paymentMethods.map(method => (
            <Card key={method.id} className={`border-l-4 ${getTypeColor(method.type)}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${getTypeColor(method.type)}`}>
                      {getTypeIcon(method.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{method.name}</h3>
                        {getTypeBadge(method.type)}
                        {method.isDefault && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Predeterminado
                          </Badge>
                        )}
                        {!method.isActive && (
                          <Badge className="bg-gray-100 text-gray-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        {method.lastFour && (
                          <div>
                            <span className="font-medium">Últimos dígitos:</span> {method.lastFour}
                          </div>
                        )}
                        {method.expiryDate && (
                          <div>
                            <span className="font-medium">Vence:</span> {method.expiryDate}
                          </div>
                        )}
                        {method.bankName && (
                          <div>
                            <span className="font-medium">Banco:</span> {method.bankName}
                          </div>
                        )}
                        {method.accountNumber && (
                          <div>
                            <span className="font-medium">Cuenta:</span> {method.accountNumber}
                          </div>
                        )}
                        {method.walletType && (
                          <div>
                            <span className="font-medium">Billetera:</span> {method.walletType}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        Agregado el {new Date(method.createdAt).toLocaleDateString('es-CL')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!method.isDefault && method.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Establecer como Predeterminado
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(method.id)}
                    >
                      {method.isActive ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Activar
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteMethod(method.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {paymentMethods.length === 0 && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes métodos de pago</h3>
              <p className="text-gray-600 mb-4">
                Agrega un método de pago para poder realizar pagos automáticos de alquiler.
              </p>
              <Button onClick={handleAddMethod}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Método de Pago
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Seguridad de Pagos</h4>
                <p className="text-sm text-blue-800">
                  Tus datos de pago están encriptados y seguros. Nunca almacenamos información
                  completa de tarjetas de crédito. Todos los pagos se procesan a través de gateways
                  certificados PCI DSS.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
