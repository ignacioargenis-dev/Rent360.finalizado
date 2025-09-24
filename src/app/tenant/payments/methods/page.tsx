'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, 
  Plus, 
  Trash2, 
  Edit, 
  Shield, 
  CheckCircle, Building, AlertTriangle, Info } from 'lucide-react';
interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_transfer';
  brand?: string;
  last4?: string;
  bank?: string;
  accountType?: string;
  accountNumber?: string;
  isDefault: boolean;
  isActive: boolean;
  addedAt: Date;
}

export default function TenantPaymentMethodsPage() {

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [loading, setLoading] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);

  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'credit_card' as const,
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    bank: '',
    accountType: 'cuenta_corriente' as const,
    accountNumber: '',
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      // Simular métodos de pago existentes
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: '1',
          type: 'credit_card',
          brand: 'Visa',
          last4: '4242',
          isDefault: true,
          isActive: true,
          addedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          type: 'bank_transfer',
          bank: 'Banco de Chile',
          accountType: 'cuenta_corriente',
          accountNumber: '****1234',
          isDefault: false,
          isActive: true,
          addedAt: new Date('2024-02-20'),
        },
      ];
      setPaymentMethods(mockPaymentMethods);
    } catch (error) {
      logger.error('Error fetching payment methods:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      // Validar datos
      if (newPaymentMethod.type === 'credit_card') {
        if (!newPaymentMethod.cardNumber || !newPaymentMethod.expiryDate || !newPaymentMethod.cvv || !newPaymentMethod.cardholderName) {
          alert('Por favor completa todos los campos de la tarjeta');
          return;
        }
      } else {
        if (!newPaymentMethod.bank || !newPaymentMethod.accountNumber) {
          alert('Por favor completa todos los campos bancarios');
          return;
        }
      }

      // Simular agregar método de pago
      const newMethod: PaymentMethod = {
        id: Date.now().toString(),
        type: newPaymentMethod.type,
        ...(newPaymentMethod.type === 'credit_card' && {
          brand: getCardBrand(newPaymentMethod.cardNumber),
          last4: newPaymentMethod.cardNumber.slice(-4),
        }),
        ...((newPaymentMethod.type as string) === 'bank_transfer' && {
          bank: newPaymentMethod.bank,
          accountType: newPaymentMethod.accountType,
          accountNumber: `****${newPaymentMethod.accountNumber.slice(-4)}`,
        }),
        isDefault: paymentMethods.length === 0,
        isActive: true,
        addedAt: new Date(),
      };

      setPaymentMethods([...paymentMethods, newMethod]);
      setShowAddDialog(false);
      resetForm();
      alert('Método de pago agregado exitosamente');
    } catch (error) {
      logger.error('Error adding payment method:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      setPaymentMethods(paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === methodId,
      })));
      alert('Método de pago predeterminado actualizado');
    } catch (error) {
      logger.error('Error setting default payment method:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    try {
      if (paymentMethods.find(m => m.id === methodId)?.isDefault && paymentMethods.length > 1) {
        alert('No puedes eliminar el método de pago predeterminado. Primero establece otro como predeterminado.');
        return;
      }
      
      setPaymentMethods(paymentMethods.filter(method => method.id !== methodId));
      alert('Método de pago eliminado');
    } catch (error) {
      logger.error('Error deleting payment method:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const getCardBrand = (cardNumber: string): string => {
    const firstDigit = cardNumber.charAt(0);
    if (firstDigit === '4') {
return 'Visa';
}
    if (firstDigit === '5') {
return 'Mastercard';
}
    if (firstDigit === '3') {
return 'Amex';
}
    return 'Otra';
  };

  const resetForm = () => {
    setNewPaymentMethod({
      type: 'credit_card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      bank: '',
      accountType: 'cuenta_corriente',
      accountNumber: '',
    });
  };

  if (loading) {
    return (
      <EnhancedDashboardLayout title="Métodos de Pago" subtitle="Gestiona tus métodos de pago">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Métodos de Pago" subtitle="Gestiona tus métodos de pago">
      <div className="space-y-6">
        {/* Información de Seguridad */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Seguridad garantizada:</strong> Tus datos de pago están encriptados y protegidos. 
            Nunca almacenamos el CVV de tus tarjetas y cumplimos con los estándares de seguridad PCI DSS.
          </AlertDescription>
        </Alert>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Métodos Activos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentMethods.filter(m => m.isActive).length}</div>
              <p className="text-xs text-muted-foreground">Disponibles para usar</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarjetas Guardadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paymentMethods.filter(m => m.type === 'credit_card').length}
              </div>
              <p className="text-xs text-muted-foreground">Tarjetas de crédito/débito</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuentas Bancarias</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paymentMethods.filter(m => m.type === 'bank_transfer').length}
              </div>
              <p className="text-xs text-muted-foreground">Transferencias bancarias</p>
            </CardContent>
          </Card>
        </div>

        {/* Agregar Nuevo Método */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Métodos de Pago Guardados
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Método
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Método de Pago</DialogTitle>
                    <DialogDescription>
                      Agrega un nuevo método de pago para realizar transacciones rápidas y seguras.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="payment-type">Tipo de Método</Label>
                      <Select 
                        value={newPaymentMethod.type} 
                        onValueChange={(value: any) => setNewPaymentMethod({...newPaymentMethod, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit_card">Tarjeta de Crédito/Débito</SelectItem>
                          <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newPaymentMethod.type === 'credit_card' ? (
                      <>
                        <div>
                          <Label htmlFor="card-number">Número de Tarjeta</Label>
                          <Input
                            id="card-number"
                            placeholder="1234 5678 9012 3456"
                            value={newPaymentMethod.cardNumber}
                            onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cardNumber: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry-date">Fecha Expiración</Label>
                            <Input
                              id="expiry-date"
                              placeholder="MM/YY"
                              value={newPaymentMethod.expiryDate}
                              onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiryDate: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              placeholder="123"
                              value={newPaymentMethod.cvv}
                              onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cvv: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="cardholder-name">Nombre del Titular</Label>
                          <Input
                            id="cardholder-name"
                            placeholder="JUAN PÉREZ"
                            value={newPaymentMethod.cardholderName}
                            onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cardholderName: e.target.value})}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="bank">Banco</Label>
                          <Select 
                            value={newPaymentMethod.bank} 
                            onValueChange={(value) => setNewPaymentMethod({...newPaymentMethod, bank: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el banco" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Banco de Chile">Banco de Chile</SelectItem>
                              <SelectItem value="Banco Santander">Banco Santander</SelectItem>
                              <SelectItem value="Banco Estado">Banco Estado</SelectItem>
                              <SelectItem value="BCI">BCI</SelectItem>
                              <SelectItem value="Itaú">Itaú</SelectItem>
                              <SelectItem value="Falabella">Falabella</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="account-type">Tipo de Cuenta</Label>
                          <Select 
                            value={newPaymentMethod.accountType} 
                            onValueChange={(value: any) => setNewPaymentMethod({...newPaymentMethod, accountType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cuenta_corriente">Cuenta Corriente</SelectItem>
                              <SelectItem value="cuenta_ahorro">Cuenta Ahorro</SelectItem>
                              <SelectItem value="cuenta_vista">Cuenta Vista</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="account-number">Número de Cuenta</Label>
                          <Input
                            id="account-number"
                            placeholder="123456789"
                            value={newPaymentMethod.accountNumber}
                            onChange={(e) => setNewPaymentMethod({...newPaymentMethod, accountNumber: e.target.value})}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddPaymentMethod}>
                      Agregar Método
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>
              Administra tus métodos de pago para transacciones rápidas y seguras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {method.type === 'credit_card' ? (
                        <CreditCard className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Building className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {method.type === 'credit_card' ? (
                          <>
                            {method.brand} ****{method.last4}
                            {method.isDefault && <Badge variant="default">Predeterminado</Badge>}
                          </>
                        ) : (
                          <>
                            {method.bank} - {method.accountType === 'cuenta_corriente' ? 'Cta. Cte.' : method.accountType === 'cuenta_ahorro' ? 'Cta. Ahorro' : 'Cta. Vista'}
                            {method.isDefault && <Badge variant="default">Predeterminado</Badge>}
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {method.type === 'credit_card' ? 'Tarjeta de crédito/débito' : 'Transferencia bancaria'}
                        {method.type === 'bank_transfer' && ` - ${method.accountNumber}`}
                      </div>
                      <div className="text-xs text-gray-400">
                        Agregado el {new Date(method.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Establecer predeterminado
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePaymentMethod(method.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {paymentMethods.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <div className="font-medium mb-2">No tienes métodos de pago guardados</div>
                  <div className="text-sm mb-4">Agrega un método de pago para realizar transacciones rápidas</div>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Método de Pago
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recomendaciones de Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Recomendaciones de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Usa contraseñas seguras</div>
                  <div className="text-sm text-gray-600">Crea contraseñas únicas y complejas para tus cuentas</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Habilita autenticación de dos factores</div>
                  <div className="text-sm text-gray-600">Añade una capa extra de seguridad a tu cuenta</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Revisa tus estados de cuenta</div>
                  <div className="text-sm text-gray-600">Monitorea regularmente tus transacciones</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium">Nunca compartas tus datos</div>
                  <div className="text-sm text-gray-600">Rent360 nunca te pedirá tu contraseña completa</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EnhancedDashboardLayout>
  );
}
