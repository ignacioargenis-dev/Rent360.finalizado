'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calculator,
  MapPin,
  Home,
  Bath,
  Bed,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/notifications/NotificationSystem';

interface PredictionResult {
  predictedPrice: number;
  confidence: number;
  priceRange: {
    min: number;
    max: number;
  };
  factors: {
    location: number;
    size: number;
    amenities: number;
    marketDemand: number;
  };
  recommendations: string[];
}

interface PropertyData {
  area: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  commune: string;
  type: string;
  furnished: boolean;
  petsAllowed: boolean;
  yearBuilt?: number;
}

export default function PropertyPricePredictor() {
  const [propertyData, setPropertyData] = useState<PropertyData>({
    area: 0,
    bedrooms: 1,
    bathrooms: 1,
    city: '',
    commune: '',
    type: '',
    furnished: false,
    petsAllowed: false
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  const handleInputChange = (field: keyof PropertyData, value: any) => {
    setPropertyData(prev => {
      if (value === null) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handlePredict = async () => {
    if (!propertyData.area || !propertyData.city || !propertyData.type) {
      showError('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        area: propertyData.area.toString(),
        bedrooms: propertyData.bedrooms.toString(),
        bathrooms: propertyData.bathrooms.toString(),
        city: propertyData.city,
        commune: propertyData.commune,
        type: propertyData.type,
        furnished: propertyData.furnished.toString(),
        petsAllowed: propertyData.petsAllowed.toString(),
        ...(propertyData.yearBuilt && { yearBuilt: propertyData.yearBuilt.toString() })
      });

      const response = await fetch(`/api/ml?${params}`);

      if (!response.ok) {
        throw new Error('Error obteniendo predicción');
      }

      const data = await response.json();

      if (data.success) {
        setPrediction(data.data.prediction);
        success('Éxito', 'Predicción generada exitosamente');
      } else {
        throw new Error(data.error || 'Error en la predicción');
      }

    } catch (err) {
      showError('Error', 'Error generando predicción: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getFactorIcon = (factor: number) => {
    if (factor > 1.05) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (factor < 0.95) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getFactorColor = (factor: number) => {
    if (factor > 1.05) return 'text-green-600';
    if (factor < 0.95) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Predicción de Precios</h1>
        <p className="text-gray-600 mt-2">
          Utiliza inteligencia artificial para estimar el precio óptimo de tu propiedad
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de entrada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Datos de la Propiedad
            </CardTitle>
            <CardDescription>
              Complete la información para obtener una predicción precisa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Área */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area">Área (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="80"
                  value={propertyData.area || ''}
                  onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="yearBuilt">Año de Construcción</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  placeholder="2020"
                  value={propertyData.yearBuilt || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    handleInputChange('yearBuilt', isNaN(value) ? null : value);
                  }}
                />
              </div>
            </div>

            {/* Dormitorios y Baños */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms">Dormitorios</Label>
                <Select
                  value={propertyData.bedrooms.toString()}
                  onValueChange={(value) => handleInputChange('bedrooms', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'dormitorio' : 'dormitorios'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bathrooms">Baños</Label>
                <Select
                  value={propertyData.bathrooms.toString()}
                  onValueChange={(value) => handleInputChange('bathrooms', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'baño' : 'baños'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ubicación */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Select
                  value={propertyData.city}
                  onValueChange={(value) => handleInputChange('city', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Santiago">Santiago</SelectItem>
                    <SelectItem value="Viña del Mar">Viña del Mar</SelectItem>
                    <SelectItem value="Concepción">Concepción</SelectItem>
                    <SelectItem value="La Serena">La Serena</SelectItem>
                    <SelectItem value="Temuco">Temuco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="commune">Comuna</Label>
                <Input
                  id="commune"
                  placeholder="Providencia"
                  value={propertyData.commune}
                  onChange={(e) => handleInputChange('commune', e.target.value)}
                />
              </div>
            </div>

            {/* Tipo de propiedad */}
            <div>
              <Label htmlFor="type">Tipo de Propiedad</Label>
              <Select
                value={propertyData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOUSE">Casa</SelectItem>
                  <SelectItem value="APARTMENT">Departamento</SelectItem>
                  <SelectItem value="OFFICE">Oficina</SelectItem>
                  <SelectItem value="WAREHOUSE">Bodega</SelectItem>
                  <SelectItem value="LAND">Terreno</SelectItem>
                  <SelectItem value="COMMERCIAL">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amenidades */}
            <div className="space-y-2">
              <Label>Características</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={propertyData.furnished}
                    onChange={(e) => handleInputChange('furnished', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Amueblado</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={propertyData.petsAllowed}
                    onChange={(e) => handleInputChange('petsAllowed', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Mascotas permitidas</span>
                </label>
              </div>
            </div>

            {/* Botón de predicción */}
            <Button
              onClick={handlePredict}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando Predicción...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Predecir Precio
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados de predicción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resultado de Predicción
            </CardTitle>
            <CardDescription>
              Estimación basada en datos de mercado e inteligencia artificial
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prediction ? (
              <div className="space-y-6">
                {/* Precio principal */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(prediction.predictedPrice)}
                  </div>
                  <Badge variant="outline" className="mb-4">
                    Confianza: {Math.round(prediction.confidence * 100)}%
                  </Badge>
                  <div className="text-sm text-gray-600">
                    Rango estimado: {formatCurrency(prediction.priceRange.min)} - {formatCurrency(prediction.priceRange.max)}
                  </div>
                </div>

                {/* Factores que influyen */}
                <div>
                  <h4 className="font-medium mb-3">Factores que influyen:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ubicación</span>
                      <div className="flex items-center gap-2">
                        {getFactorIcon(prediction.factors.location)}
                        <span className={`text-sm ${getFactorColor(prediction.factors.location)}`}>
                          {(prediction.factors.location * 100 - 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tamaño</span>
                      <div className="flex items-center gap-2">
                        {getFactorIcon(prediction.factors.size)}
                        <span className={`text-sm ${getFactorColor(prediction.factors.size)}`}>
                          {(prediction.factors.size * 100 - 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Amenidades</span>
                      <div className="flex items-center gap-2">
                        {getFactorIcon(prediction.factors.amenities)}
                        <span className={`text-sm ${getFactorColor(prediction.factors.amenities)}`}>
                          {(prediction.factors.amenities * 100 - 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Demanda del mercado</span>
                      <div className="flex items-center gap-2">
                        {getFactorIcon(prediction.factors.marketDemand)}
                        <span className={`text-sm ${getFactorColor(prediction.factors.marketDemand)}`}>
                          {(prediction.factors.marketDemand * 100 - 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recomendaciones */}
                {prediction.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Recomendaciones:
                    </h4>
                    <ul className="space-y-2">
                      {prediction.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Información adicional */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-medium mb-1">¿Cómo funciona?</p>
                      <p>
                        Esta predicción se basa en datos históricos de propiedades similares
                        en la misma zona, utilizando algoritmos de machine learning para
                        proporcionar una estimación precisa del precio de mercado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Complete el formulario y haga clic en "Predecir Precio" para obtener una estimación
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
