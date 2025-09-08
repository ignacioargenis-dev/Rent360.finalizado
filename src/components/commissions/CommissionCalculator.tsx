'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, 
  DollarSign, 
  TrendingUp, 
  Target,
  Home,
  Building,
  Store,
  Copy,
  Download,
  Info } from 'lucide-react';
interface CommissionRule {
  propertyType: string;
  minAmount: number;
  maxAmount: number;
  percentage: number;
  fixedFee?: number;
}

interface CommissionResult {
  totalCommission: number;
  percentage: number;
  breakdown: {
    baseCommission: number;
    bonus: number;
    deductions: number;
  };
  monthlyProjection: number;
  yearlyProjection: number;
}

interface CommissionCalculatorProps {
  onCalculate?: (result: CommissionResult) => void;
}

export default function CommissionCalculator({ onCalculate }: CommissionCalculatorProps) {

  const [formData, setFormData] = useState({
    propertyType: '',
    propertyValue: '',
    rentalType: 'rent',
    contractDuration: 12,
    hasAdditionalServices: false,
    isExclusive: false,
    clientType: 'standard',
  });


  const [result, setResult] = useState<CommissionResult | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Commission rules based on property type and value
  const commissionRules: CommissionRule[] = [
    // Residential properties
    {
      propertyType: 'apartment',
      minAmount: 0,
      maxAmount: 10000000,
      percentage: 5,
    },
    {
      propertyType: 'apartment',
      minAmount: 10000001,
      maxAmount: 30000000,
      percentage: 4,
    },
    {
      propertyType: 'apartment',
      minAmount: 30000001,
      maxAmount: Infinity,
      percentage: 3,
    },
    {
      propertyType: 'house',
      minAmount: 0,
      maxAmount: 20000000,
      percentage: 4.5,
    },
    {
      propertyType: 'house',
      minAmount: 20000001,
      maxAmount: 50000000,
      percentage: 3.5,
    },
    {
      propertyType: 'house',
      minAmount: 50000001,
      maxAmount: Infinity,
      percentage: 2.5,
    },
    // Commercial properties
    {
      propertyType: 'office',
      minAmount: 0,
      maxAmount: 50000000,
      percentage: 4,
    },
    {
      propertyType: 'office',
      minAmount: 50000001,
      maxAmount: Infinity,
      percentage: 3,
    },
    {
      propertyType: 'commercial',
      minAmount: 0,
      maxAmount: 30000000,
      percentage: 3.5,
    },
    {
      propertyType: 'commercial',
      minAmount: 30000001,
      maxAmount: Infinity,
      percentage: 2.5,
    },
  ];

  const propertyTypes = [
    { value: 'apartment', label: 'Departamento', icon: Home },
    { value: 'house', label: 'Casa', icon: Home },
    { value: 'office', label: 'Oficina', icon: Building },
    { value: 'commercial', label: 'Local Comercial', icon: Store },
  ];

  const rentalTypes = [
    { value: 'rent', label: 'Arriendo' },
    { value: 'sale', label: 'Venta' },
  ];

  const clientTypes = [
    { value: 'standard', label: 'Estándar' },
    { value: 'premium', label: 'Premium' },
    { value: 'corporate', label: 'Corporativo' },
  ];

  const getCommissionRule = (propertyType: string, value: number) => {
    return commissionRules.find(rule => 
      rule.propertyType === propertyType &&
      value >= rule.minAmount &&
      value <= rule.maxAmount,
    );
  };

  const calculateCommission = () => {
    const propertyValue = parseFloat(formData.propertyValue) || 0;
    const rule = getCommissionRule(formData.propertyType, propertyValue);
    
    if (!rule) {
      return;
    }

    // Base commission calculation
    let baseCommission = (propertyValue * rule.percentage) / 100;
    
    // Adjust for rental type
    if (formData.rentalType === 'rent') {
      baseCommission = baseCommission * (formData.contractDuration / 12);
    }

    // Apply modifiers
    let bonus = 0;
    const deductions = 0;

    // Exclusive contract bonus
    if (formData.isExclusive) {
      bonus += baseCommission * 0.1; // 10% bonus
    }

    // Additional services bonus
    if (formData.hasAdditionalServices) {
      bonus += baseCommission * 0.05; // 5% bonus
    }

    // Client type modifier
    if (formData.clientType === 'premium') {
      bonus += baseCommission * 0.15; // 15% bonus
    } else if (formData.clientType === 'corporate') {
      bonus += baseCommission * 0.2; // 20% bonus
    }

    // High-value bonus
    if (propertyValue > 100000000) {
      bonus += baseCommission * 0.05; // 5% bonus for high-value properties
    }

    // Calculate total commission
    const totalCommission = baseCommission + bonus - deductions;
    const effectivePercentage = (totalCommission / propertyValue) * 100;

    // Projections
    const monthlyProjection = totalCommission / formData.contractDuration;
    const yearlyProjection = totalCommission * (12 / formData.contractDuration);

    const calculationResult: CommissionResult = {
      totalCommission,
      percentage: effectivePercentage,
      breakdown: {
        baseCommission,
        bonus,
        deductions,
      },
      monthlyProjection,
      yearlyProjection,
    };

    setResult(calculationResult);
    onCalculate?.(calculationResult);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setResult(null); // Reset result when form changes
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Calculadora de Comisiones
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="propertyType">Tipo de Propiedad</Label>
            <Select value={formData.propertyType} onValueChange={(value) => handleInputChange('propertyType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="propertyValue">Valor de la Propiedad (CLP)</Label>
            <Input
              id="propertyValue"
              type="number"
              value={formData.propertyValue}
              onChange={(e) => handleInputChange('propertyValue', e.target.value)}
              placeholder="100000000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rentalType">Tipo de Operación</Label>
            <Select value={formData.rentalType} onValueChange={(value) => handleInputChange('rentalType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rentalTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contractDuration">Duración del Contrato (meses)</Label>
            <Input
              id="contractDuration"
              type="number"
              value={formData.contractDuration}
              onChange={(e) => handleInputChange('contractDuration', parseInt(e.target.value))}
              min={1}
              max={60}
            />
          </div>
        </div>

        {/* Advanced Options */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mb-4"
          >
            <Info className="w-4 h-4 mr-2" />
            {showAdvanced ? 'Ocultar' : 'Mostrar'} opciones avanzadas
          </Button>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientType">Tipo de Cliente</Label>
                  <Select value={formData.clientType} onValueChange={(value) => handleInputChange('clientType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isExclusive"
                      checked={formData.isExclusive}
                      onChange={(e) => handleInputChange('isExclusive', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="isExclusive">Contrato Exclusivo</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasAdditionalServices"
                      checked={formData.hasAdditionalServices}
                      onChange={(e) => handleInputChange('hasAdditionalServices', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="hasAdditionalServices">Servicios Adicionales</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Calculate Button */}
        <Button 
          onClick={calculateCommission}
          className="w-full"
          disabled={!formData.propertyType || !formData.propertyValue}
        >
          <Calculator className="w-4 h-4 mr-2" />
          Calcular Comisión
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Resultados del Cálculo
              </h3>

              {/* Main Result */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-emerald-800">
                    Comisión Total
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(formatPrice(result.totalCommission))}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Badge className="bg-emerald-100 text-emerald-800 text-lg">
                      {formatPrice(result.totalCommission)}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-emerald-600">
                  Porcentaje efectivo: {formatPercentage(result.percentage)}
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Comisión Base</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(result.breakdown.baseCommission)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Bonificaciones</p>
                      <p className="text-lg font-semibold text-green-600">
                        +{formatPrice(result.breakdown.bonus)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Deducciones</p>
                      <p className="text-lg font-semibold text-red-600">
                        -{formatPrice(result.breakdown.deductions)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Projections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Proyección Mensual</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatPrice(result.monthlyProjection)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Proyección Anual</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatPrice(result.yearlyProjection)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Options */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Resultados
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
