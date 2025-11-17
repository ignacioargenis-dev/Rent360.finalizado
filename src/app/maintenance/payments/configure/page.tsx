'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Shield, ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

export default function MaintenanceConfigureBankAccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [bankAccount, setBankAccount] = useState({
    bankName: '',
    accountType: 'checking',
    accountNumber: '',
    accountHolderName: '',
    rut: '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    loadBankAccount();
  }, []);

  const loadBankAccount = async () => {
    try {
      setIsLoading(true);
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
            accountHolderName: data.bankAccount.accountHolderName || '',
            rut: data.bankAccount.rut || '',
            email: data.bankAccount.email || user?.email || '',
            phone: data.bankAccount.phone || user?.phone || '',
          });
        }
      }
    } catch (error) {
      logger.error('Error cargando cuenta bancaria', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

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
          setTimeout(() => {
            router.push('/maintenance/earnings');
          }, 2000);
        } else {
          setErrorMessage(data.error || 'Error al guardar la configuración');
        }
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Error al guardar la configuración');
      }
    } catch (error) {
      logger.error('Error guardando cuenta bancaria', { error });
      setErrorMessage('Error al guardar la configuración bancaria');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout title="Configuración Bancaria" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando configuración bancaria...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Configuración Bancaria"
      subtitle="Configura tu cuenta para recibir pagos de trabajos de mantenimiento"
    >
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/maintenance/earnings')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Ganancias
        </Button>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        <Card className="border-emerald-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-emerald-900">Información Bancaria</CardTitle>
                <CardDescription>
                  Configura los datos de tu cuenta bancaria para recibir pagos de forma segura
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Información Segura</p>
                <p className="text-sm text-blue-700">
                  Tus datos bancarios están encriptados y protegidos. Solo se usarán para procesar
                  tus pagos de trabajos de mantenimiento.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="bankName">Banco *</Label>
                <Input
                  id="bankName"
                  value={bankAccount.bankName}
                  onChange={e => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                  placeholder="Ej: Banco de Chile"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="accountType">Tipo de Cuenta *</Label>
                <Select
                  value={bankAccount.accountType}
                  onValueChange={value => setBankAccount({ ...bankAccount, accountType: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Cuenta Corriente</SelectItem>
                    <SelectItem value="savings">Cuenta de Ahorros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="accountNumber">Número de Cuenta *</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  value={bankAccount.accountNumber}
                  onChange={e => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                  placeholder="Ej: 1234567890"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="rut">RUT *</Label>
                <Input
                  id="rut"
                  value={bankAccount.rut}
                  onChange={e => setBankAccount({ ...bankAccount, rut: e.target.value })}
                  placeholder="Ej: 12.345.678-9"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="accountHolderName">Titular de la Cuenta *</Label>
                <Input
                  id="accountHolderName"
                  value={bankAccount.accountHolderName}
                  onChange={e =>
                    setBankAccount({ ...bankAccount, accountHolderName: e.target.value })
                  }
                  placeholder="Nombre completo del titular"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={bankAccount.email}
                  onChange={e => setBankAccount({ ...bankAccount, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={bankAccount.phone}
                  onChange={e => setBankAccount({ ...bankAccount, phone: e.target.value })}
                  placeholder="+56912345678"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => router.push('/maintenance/earnings')}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSaving ? (
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
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
