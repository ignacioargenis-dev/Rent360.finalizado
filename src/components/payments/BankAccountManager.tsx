'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Edit, Trash2, CheckCircle, AlertCircle, Building } from 'lucide-react';
import { logger } from '@/lib/logger-minimal';

interface BankAccount {
  id: string;
  userId: string;
  bankCode: string;
  bankName: string;
  country: string;
  accountType: 'checking' | 'savings' | 'business' | 'rut';
  accountNumber: string;
  accountHolder: string;
  rut?: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

interface BankAccountManagerProps {
  userId: string;
}

const CHILEAN_BANKS = [
  { code: '001', name: 'Banco de Chile' },
  { code: '009', name: 'Banco Internacional' },
  { code: '012', name: 'Banco del Estado de Chile' },
  { code: '014', name: 'Scotiabank Chile' },
  { code: '016', name: 'Banco de Crédito e Inversiones' },
  { code: '028', name: 'Banco Bice' },
  { code: '031', name: 'HSBC Bank Chile' },
  { code: '037', name: 'Banco Santander Chile' },
  { code: '039', name: 'Banco Itaú Chile' },
  { code: '049', name: 'Banco Security' },
  { code: '051', name: 'Banco Falabella' },
  { code: '053', name: 'Banco Ripley' },
  { code: '055', name: 'Banco Consorcio' },
  { code: '504', name: 'Banco BTG Pactual Chile' },
];

export default function BankAccountManager({ userId }: BankAccountManagerProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    bankCode: '',
    accountType: 'checking' as 'checking' | 'savings' | 'business' | 'rut',
    accountNumber: '',
    accountHolder: '',
    rut: '',
    isPrimary: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBankAccounts();
  }, [userId]);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/bank-accounts', {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar cuentas bancarias');
      }

      const data = await response.json();
      setAccounts(data.data || []);
    } catch (error) {
      logger.error('Error cargando cuentas bancarias:', { error });
      setError('Error al cargar las cuentas bancarias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bankCode || !formData.accountNumber || !formData.accountHolder) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/user/bank-accounts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la cuenta bancaria');
      }

      setSuccess('Cuenta bancaria registrada exitosamente');
      setShowAddDialog(false);
      setFormData({
        bankCode: '',
        accountType: 'checking',
        accountNumber: '',
        accountHolder: '',
        rut: '',
        isPrimary: false,
      });

      await loadBankAccounts();

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      logger.error('Error guardando cuenta bancaria:', { error });
      setError(error instanceof Error ? error.message : 'Error al guardar la cuenta bancaria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cuenta bancaria?')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/bank-accounts/${accountId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la cuenta bancaria');
      }

      setSuccess('Cuenta bancaria eliminada exitosamente');
      await loadBankAccounts();

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      logger.error('Error eliminando cuenta bancaria:', { error });
      setError(error instanceof Error ? error.message : 'Error al eliminar la cuenta bancaria');
    }
  };

  const getVerificationBadge = (status: string, isVerified: boolean) => {
    if (isVerified && status === 'verified') {
      return <Badge className="bg-green-100 text-green-800">Verificada</Badge>;
    } else if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
    } else if (status === 'failed') {
      return <Badge className="bg-red-100 text-red-800">Fallida</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">No verificada</Badge>;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'checking':
        return 'Cuenta Corriente';
      case 'savings':
        return 'Cuenta de Ahorro';
      case 'business':
        return 'Cuenta Empresarial';
      case 'rut':
        return 'Cuenta RUT';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando cuentas bancarias...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cuentas Bancarias</h3>
          <p className="text-sm text-gray-600">
            Configura tus cuentas bancarias para recibir pagos de arriendo
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Las cuentas se verifican automáticamente. El proceso puede tardar 1-2 días hábiles.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Cuenta
        </Button>
      </div>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes cuentas bancarias registradas
            </h3>
            <p className="text-gray-600 mb-4">
              Agrega una cuenta bancaria para recibir pagos de arriendo automáticamente.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primera Cuenta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map(account => (
            <Card
              key={account.id}
              className={account.isPrimary ? 'border-blue-200 bg-blue-50' : ''}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building className="w-5 h-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">{account.bankName}</h4>
                      {account.isPrimary && (
                        <Badge className="bg-blue-100 text-blue-800">Principal</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Tipo de Cuenta:</span>
                        <p className="font-medium">{getAccountTypeLabel(account.accountType)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Número de Cuenta:</span>
                        <p className="font-medium font-mono">{account.accountNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Titular:</span>
                        <p className="font-medium">{account.accountHolder}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      {getVerificationBadge(account.verificationStatus, account.isVerified)}
                      <span className="text-xs text-gray-500">
                        Registrada el {new Date(account.createdAt).toLocaleDateString('es-CL')}
                      </span>
                      {account.verificationStatus === 'pending' && !account.isVerified && (
                        <span className="text-xs text-blue-600 italic">
                          (Verificación en proceso automático)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAccount(account);
                        setFormData({
                          bankCode: account.bankCode,
                          accountType: account.accountType,
                          accountNumber: account.accountNumber.replace('****', ''),
                          accountHolder: account.accountHolder,
                          rut: account.rut || '',
                          isPrimary: account.isPrimary,
                        });
                        setShowAddDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Editar Cuenta Bancaria' : 'Agregar Cuenta Bancaria'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? 'Modifica los datos de tu cuenta bancaria'
                : 'Registra una nueva cuenta bancaria para recibir pagos'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="bankCode">Banco *</Label>
              <Select
                value={formData.bankCode}
                onValueChange={value => setFormData({ ...formData, bankCode: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un banco" />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {CHILEAN_BANKS.map(bank => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accountType">Tipo de Cuenta *</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value: 'checking' | 'savings' | 'business') =>
                  setFormData({ ...formData, accountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Cuenta Corriente</SelectItem>
                  <SelectItem value="savings">Cuenta de Ahorro</SelectItem>
                  <SelectItem value="rut">Cuenta RUT</SelectItem>
                  <SelectItem value="business">Cuenta Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accountNumber">Número de Cuenta *</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="1234567890"
                className="font-mono"
              />
            </div>

            <div>
              <Label htmlFor="accountHolder">Titular de la Cuenta *</Label>
              <Input
                id="accountHolder"
                value={formData.accountHolder}
                onChange={e => setFormData({ ...formData, accountHolder: e.target.value })}
                placeholder="Nombre completo del titular"
              />
            </div>

            <div>
              <Label htmlFor="rut">RUT del Titular</Label>
              <Input
                id="rut"
                value={formData.rut}
                onChange={e => setFormData({ ...formData, rut: e.target.value })}
                placeholder="12.345.678-9"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={e => setFormData({ ...formData, isPrimary: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPrimary">Marcar como cuenta principal</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingAccount(null);
                  setFormData({
                    bankCode: '',
                    accountType: 'checking',
                    accountNumber: '',
                    accountHolder: '',
                    rut: '',
                    isPrimary: false,
                  });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingAccount ? 'Actualizar' : 'Agregar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
