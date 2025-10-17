'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  Percent,
  Calendar,
  Settings,
  Info,
  TrendingUp,
  BarChart3,
  Save,
  RefreshCw,
} from 'lucide-react';
import { logger } from '@/lib/logger-minimal';

interface PlatformRetentionConfig {
  // Configuración general
  enabled: boolean;
  autoProcess: boolean;
  schedule: 'immediate' | 'weekly' | 'monthly';
  cutoffDay: number;

  // Tasas de retención
  platformFeePercentage: number; // Porcentaje retenido por la plataforma
  paymentProviderFeePercentage: number; // Costo del proveedor de pagos
  minimumRetentionAmount: number; // Monto mínimo de retención
  maximumRetentionAmount: number; // Monto máximo de retención

  // Configuración de pagos
  defaultPaymentMethod: string;
  supportedPaymentMethods: string[];

  // Límites y validaciones
  minimumPayout: number;
  maximumDailyPayout: number;
  requireApproval: boolean;
  approvalThreshold: number;

  // Configuración de seguridad
  requireKYC: boolean;
  requireBankVerification: boolean;
  fraudDetection: boolean;
}

interface RetentionStats {
  totalRetainedThisMonth: number;
  totalRetainedLastMonth: number;
  averageRetentionRate: number;
  totalContracts: number;
  activeContracts: number;
}

export default function PlatformRetentionSettings() {
  const [config, setConfig] = useState<PlatformRetentionConfig>({
    enabled: true,
    autoProcess: true,
    schedule: 'monthly',
    cutoffDay: 1,
    platformFeePercentage: 5.0, // 5% por defecto
    paymentProviderFeePercentage: 1.0, // 1% por defecto
    minimumRetentionAmount: 5000, // $5.000 CLP
    maximumRetentionAmount: 1000000, // $1M CLP
    defaultPaymentMethod: 'bank_transfer',
    supportedPaymentMethods: ['bank_transfer', 'paypal'],
    minimumPayout: 50000, // $50.000 CLP
    maximumDailyPayout: 10000000, // $10M CLP
    requireApproval: false,
    approvalThreshold: 1000000, // $1M CLP
    requireKYC: true,
    requireBankVerification: true,
    fraudDetection: true,
  });

  const [stats, setStats] = useState<RetentionStats>({
    totalRetainedThisMonth: 0,
    totalRetainedLastMonth: 0,
    averageRetentionRate: 0,
    totalContracts: 0,
    activeContracts: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/platform-retention-config', {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar la configuración');
      }

      const data = await response.json();
      setConfig(data.config);
    } catch (error) {
      logger.error('Error cargando configuración de retención:', { error });
      setError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/platform-retention-stats', {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar las estadísticas');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      logger.error('Error cargando estadísticas de retención:', { error });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/admin/platform-retention-config', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la configuración');
      }

      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      logger.error('Error guardando configuración de retención:', { error });
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotalRetentionRate = () => {
    return config.platformFeePercentage + config.paymentProviderFeePercentage;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando configuración...</span>
      </div>
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retención Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRetainedThisMonth)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retención Mes Pasado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRetainedLastMonth)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageRetentionRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Percent className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeContracts} / {stats.totalContracts}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tasas de Retención */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Tasas de Retención
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="platformFee">Retención de Plataforma (%)</Label>
              <Input
                id="platformFee"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={config.platformFeePercentage}
                onChange={e =>
                  setConfig({ ...config, platformFeePercentage: parseFloat(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-gray-600 mt-1">
                Porcentaje retenido por la plataforma sobre cada pago de arriendo
              </p>
            </div>

            <div>
              <Label htmlFor="paymentProviderFee">Costo Proveedor de Pagos (%)</Label>
              <Input
                id="paymentProviderFee"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={config.paymentProviderFeePercentage}
                onChange={e =>
                  setConfig({
                    ...config,
                    paymentProviderFeePercentage: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-gray-600 mt-1">
                Costo del proveedor de pagos (Khipu, Stripe, etc.)
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Retención Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {calculateTotalRetentionRate().toFixed(1)}%
              </p>
              <p className="text-sm text-blue-700">
                Por cada $100.000 de arriendo se retienen $
                {(calculateTotalRetentionRate() * 1000).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Procesamiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled">Sistema Habilitado</Label>
                <p className="text-sm text-gray-600">Activar/desactivar retención automática</p>
              </div>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={checked => setConfig({ ...config, enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoProcess">Procesamiento Automático</Label>
                <p className="text-sm text-gray-600">Procesar retenciones automáticamente</p>
              </div>
              <Switch
                id="autoProcess"
                checked={config.autoProcess}
                onCheckedChange={checked => setConfig({ ...config, autoProcess: checked })}
              />
            </div>

            <div>
              <Label htmlFor="schedule">Frecuencia de Procesamiento</Label>
              <Select
                value={config.schedule}
                onValueChange={(value: 'immediate' | 'weekly' | 'monthly') =>
                  setConfig({ ...config, schedule: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Inmediato</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.schedule === 'monthly' && (
              <div>
                <Label htmlFor="cutoffDay">Día de Corte Mensual</Label>
                <Input
                  id="cutoffDay"
                  type="number"
                  min="1"
                  max="31"
                  value={config.cutoffDay}
                  onChange={e => setConfig({ ...config, cutoffDay: parseInt(e.target.value) || 1 })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Límites y Validaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Límites y Validaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="minimumRetention">Retención Mínima (CLP)</Label>
              <Input
                id="minimumRetention"
                type="number"
                value={config.minimumRetentionAmount}
                onChange={e =>
                  setConfig({ ...config, minimumRetentionAmount: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label htmlFor="maximumRetention">Retención Máxima (CLP)</Label>
              <Input
                id="maximumRetention"
                type="number"
                value={config.maximumRetentionAmount}
                onChange={e =>
                  setConfig({ ...config, maximumRetentionAmount: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label htmlFor="minimumPayout">Payout Mínimo (CLP)</Label>
              <Input
                id="minimumPayout"
                type="number"
                value={config.minimumPayout}
                onChange={e =>
                  setConfig({ ...config, minimumPayout: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label htmlFor="approvalThreshold">Umbral de Aprobación (CLP)</Label>
              <Input
                id="approvalThreshold"
                type="number"
                value={config.approvalThreshold}
                onChange={e =>
                  setConfig({ ...config, approvalThreshold: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireKYC">Requerir KYC</Label>
                <p className="text-sm text-gray-600">Verificación de identidad</p>
              </div>
              <Switch
                id="requireKYC"
                checked={config.requireKYC}
                onCheckedChange={checked => setConfig({ ...config, requireKYC: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireBankVerification">Verificación Bancaria</Label>
                <p className="text-sm text-gray-600">Verificar cuentas bancarias</p>
              </div>
              <Switch
                id="requireBankVerification"
                checked={config.requireBankVerification}
                onCheckedChange={checked =>
                  setConfig({ ...config, requireBankVerification: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="fraudDetection">Detección de Fraude</Label>
                <p className="text-sm text-gray-600">Sistema anti-fraude activo</p>
              </div>
              <Switch
                id="fraudDetection"
                checked={config.fraudDetection}
                onCheckedChange={checked => setConfig({ ...config, fraudDetection: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireApproval">Aprobación Manual</Label>
                <p className="text-sm text-gray-600">Requerir aprobación para montos altos</p>
              </div>
              <Switch
                id="requireApproval"
                checked={config.requireApproval}
                onCheckedChange={checked => setConfig({ ...config, requireApproval: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={loadConfig}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Recargar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}
