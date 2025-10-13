'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Save, FileText } from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function NewContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    propertyAddress: '',
    tenantName: '',
    tenantEmail: '',
    ownerName: '',
    ownerEmail: '',
    brokerName: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    currency: 'CLP',
    depositAmount: '',
    description: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validate required fields
      if (
        !formData.title ||
        !formData.propertyAddress ||
        !formData.tenantName ||
        !formData.ownerName ||
        !formData.startDate ||
        !formData.endDate ||
        !formData.monthlyRent
      ) {
        alert('Por favor complete todos los campos obligatorios');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success - redirect to contracts list
      alert('Contrato creado exitosamente');
      router.push('/admin/contracts');
    } catch (error) {
      logger.error('Error creating contract:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al crear el contrato. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnifiedDashboardLayout title="Nuevo Contrato" subtitle="Crear un nuevo contrato de arriendo">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nuevo Contrato</h1>
              <p className="text-gray-600">Complete la información del contrato</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información Básica del Contrato
              </CardTitle>
              <CardDescription>Detalles principales del contrato de arriendo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título del Contrato *</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Contrato departamento Las Condes"
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="propertyAddress">Dirección de la Propiedad *</Label>
                  <Input
                    id="propertyAddress"
                    placeholder="Ej: Av. Las Condes 1234, Las Condes"
                    value={formData.propertyAddress}
                    onChange={e => handleInputChange('propertyAddress', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción detallada del contrato..."
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Parties Information */}
          <Card>
            <CardHeader>
              <CardTitle>Partes Involucradas</CardTitle>
              <CardDescription>Información de inquilino, propietario y corredor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tenant Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenantName">Nombre del Inquilino *</Label>
                  <Input
                    id="tenantName"
                    placeholder="Ej: Juan Pérez"
                    value={formData.tenantName}
                    onChange={e => handleInputChange('tenantName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tenantEmail">Email del Inquilino</Label>
                  <Input
                    id="tenantEmail"
                    type="email"
                    placeholder="juan@email.com"
                    value={formData.tenantEmail}
                    onChange={e => handleInputChange('tenantEmail', e.target.value)}
                  />
                </div>
              </div>

              {/* Owner Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerName">Nombre del Propietario *</Label>
                  <Input
                    id="ownerName"
                    placeholder="Ej: María González"
                    value={formData.ownerName}
                    onChange={e => handleInputChange('ownerName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ownerEmail">Email del Propietario</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="maria@email.com"
                    value={formData.ownerEmail}
                    onChange={e => handleInputChange('ownerEmail', e.target.value)}
                  />
                </div>
              </div>

              {/* Broker Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brokerName">Nombre del Corredor</Label>
                  <Input
                    id="brokerName"
                    placeholder="Ej: Carlos Ramírez (opcional)"
                    value={formData.brokerName}
                    onChange={e => handleInputChange('brokerName', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Términos del Contrato</CardTitle>
              <CardDescription>Fechas, montos y condiciones del contrato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Fecha de Inicio *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={e => handleInputChange('startDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Fecha de Término *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={e => handleInputChange('endDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="monthlyRent">Renta Mensual *</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    placeholder="Ej: 500000"
                    value={formData.monthlyRent}
                    onChange={e => handleInputChange('monthlyRent', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={value => handleInputChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="depositAmount">Monto Garantía</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    placeholder="Ej: 1000000"
                    value={formData.depositAmount}
                    onChange={e => handleInputChange('depositAmount', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Contrato
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
