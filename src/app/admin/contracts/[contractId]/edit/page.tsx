'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { ArrowLeft, Save, FileText, AlertTriangle } from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface ContractData {
  id: string;
  title: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  ownerName: string;
  ownerEmail: string;
  brokerName?: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  currency: string;
  depositAmount: number;
  description: string;
  status: string;
}

export default function EditContractPage() {
  const { contractId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [formData, setFormData] = useState<Partial<ContractData>>({});

  useEffect(() => {
    if (contractId) {
      loadContractData(contractId as string);
    }
  }, [contractId]);

  const loadContractData = async (id: string) => {
    try {
      setLoading(true);

      // Mock data for demonstration
      const mockContract: ContractData = {
        id: id,
        title: 'Contrato Departamento Las Condes',
        propertyAddress: 'Av. Las Condes 1234, Las Condes, Santiago',
        tenantName: 'Juan Pérez González',
        tenantEmail: 'juan.perez@email.com',
        ownerName: 'María González Rodríguez',
        ownerEmail: 'maria.gonzalez@email.com',
        brokerName: 'Carlos Ramírez Silva',
        startDate: '2024-01-15',
        endDate: '2025-01-14',
        monthlyRent: 450000,
        currency: 'CLP',
        depositAmount: 900000,
        description:
          'Contrato de arriendo por 12 meses para departamento de 2 dormitorios en Las Condes. Incluye gastos comunes y estacionamiento.',
        status: 'active',
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setContract(mockContract);
      setFormData(mockContract);
    } catch (error) {
      logger.error('Error loading contract:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    try {
      setSaving(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success - redirect to contract detail
      alert('Contrato actualizado exitosamente');
      router.push(`/admin/contracts/${contractId}`);
    } catch (error) {
      logger.error('Error updating contract:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al actualizar el contrato. Por favor intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Editar Contrato" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando datos del contrato...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!contract) {
    return (
      <UnifiedDashboardLayout title="Editar Contrato" subtitle="Error al cargar">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contrato no encontrado</h3>
              <p className="text-gray-600 mb-4">
                El contrato solicitado no existe o no está disponible.
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Editar Contrato"
      subtitle={`Modificar contrato: ${contract.title}`}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Contrato</h1>
              <p className="text-gray-600">Modifique la información del contrato</p>
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
                    value={formData.title || ''}
                    onChange={e => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="propertyAddress">Dirección de la Propiedad *</Label>
                  <Input
                    id="propertyAddress"
                    value={formData.propertyAddress || ''}
                    onChange={e => handleInputChange('propertyAddress', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="status">Estado del Contrato</Label>
                <Select
                  value={formData.status || ''}
                  onValueChange={value => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="expired">Vencido</SelectItem>
                    <SelectItem value="terminated">Terminado</SelectItem>
                  </SelectContent>
                </Select>
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
                    value={formData.tenantName || ''}
                    onChange={e => handleInputChange('tenantName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tenantEmail">Email del Inquilino</Label>
                  <Input
                    id="tenantEmail"
                    type="email"
                    value={formData.tenantEmail || ''}
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
                    value={formData.ownerName || ''}
                    onChange={e => handleInputChange('ownerName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ownerEmail">Email del Propietario</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={formData.ownerEmail || ''}
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
                    value={formData.brokerName || ''}
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
                    value={formData.startDate || ''}
                    onChange={e => handleInputChange('startDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Fecha de Término *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate || ''}
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
                    value={formData.monthlyRent || ''}
                    onChange={e => handleInputChange('monthlyRent', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={formData.currency || 'CLP'}
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
                    value={formData.depositAmount || ''}
                    onChange={e => handleInputChange('depositAmount', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
