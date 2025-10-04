'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  FileText,
  Users,
  Calendar,
  DollarSign,
  MapPin,
  Edit,
  Download,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface ContractDetail {
  id: string;
  title: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  ownerName: string;
  ownerEmail: string;
  brokerName?: string;
  brokerEmail?: string;
  status: 'active' | 'pending' | 'expired' | 'terminated' | 'draft';
  startDate: string;
  endDate: string;
  monthlyRent: number;
  currency: string;
  depositAmount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContractDetailPage() {
  const { contractId } = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractId) {
      loadContractDetail(contractId as string);
    }
  }, [contractId]);

  const loadContractDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration
      const mockContract: ContractDetail = {
        id: id,
        title: 'Contrato Departamento Las Condes',
        propertyAddress: 'Av. Las Condes 1234, Las Condes, Santiago',
        tenantName: 'Juan Pérez González',
        tenantEmail: 'juan.perez@email.com',
        ownerName: 'María González Rodríguez',
        ownerEmail: 'maria.gonzalez@email.com',
        brokerName: 'Carlos Ramírez Silva',
        brokerEmail: 'carlos.ramirez@broker.cl',
        status: 'active',
        startDate: '2024-01-15',
        endDate: '2025-01-14',
        monthlyRent: 450000,
        currency: 'CLP',
        depositAmount: 900000,
        description:
          'Contrato de arriendo por 12 meses para departamento de 2 dormitorios en Las Condes. Incluye gastos comunes y estacionamiento.',
        createdAt: '2024-01-10T10:30:00Z',
        updatedAt: '2024-01-15T14:20:00Z',
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setContract(mockContract);
    } catch (error) {
      logger.error('Error loading contract detail:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los detalles del contrato');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      expired: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
      terminated: { label: 'Terminado', color: 'bg-gray-100 text-gray-800' },
      draft: { label: 'Borrador', color: 'bg-blue-100 text-blue-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleEditContract = () => {
    router.push(`/admin/contracts/${contractId}/edit`);
  };

  const handleDownloadContract = () => {
    // Simulate PDF download
    alert(`Descargando contrato ${contract?.title} en formato PDF`);
  };

  const handleViewProperty = () => {
    // Since we don't have a propertyId, we'll search for properties by address
    if (contract?.propertyAddress) {
      const searchQuery = encodeURIComponent(contract.propertyAddress);
      router.push(`/admin/properties?search=${searchQuery}`);
    } else {
      alert('No se encontró información de la dirección de la propiedad');
    }
  };

  const handleContactTenant = () => {
    if (contract?.tenantEmail) {
      const subject = encodeURIComponent(`Contrato: ${contract?.title}`);
      const body = encodeURIComponent(
        `Hola ${contract?.tenantName},\n\nTe contacto respecto al contrato: ${contract?.title}\n\nAtentamente,\nEquipo Rent360`
      );
      window.open(`mailto:${contract.tenantEmail}?subject=${subject}&body=${body}`);
    } else {
      alert('No se encontró información de contacto del inquilino');
    }
  };

  const handleContactOwner = () => {
    if (contract?.ownerEmail) {
      const subject = encodeURIComponent(`Contrato: ${contract?.title}`);
      const body = encodeURIComponent(
        `Hola ${contract?.ownerName},\n\nTe contacto respecto al contrato: ${contract?.title}\n\nAtentamente,\nEquipo Rent360`
      );
      window.open(`mailto:${contract.ownerEmail}?subject=${subject}&body=${body}`);
    } else {
      alert('No se encontró información de contacto del propietario');
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Detalle de Contrato" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando detalles del contrato...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error || !contract) {
    return (
      <UnifiedDashboardLayout title="Detalle de Contrato" subtitle="Error al cargar">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error || 'Contrato no encontrado'}</p>
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
    <UnifiedDashboardLayout title={`Contrato - ${contract.title}`} subtitle={`ID: ${contract.id}`}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Contratos
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadContract}>
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button onClick={handleEditContract}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Contrato
            </Button>
          </div>
        </div>

        {/* Contract Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Estado del Contrato</h3>
                <p className="text-sm text-gray-600">Información general del contrato</p>
              </div>
              {getStatusBadge(contract.status)}
            </div>
          </CardContent>
        </Card>

        {/* Contract Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Detalles del Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Título</label>
                <p className="text-lg text-gray-900">{contract.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Descripción</label>
                <p className="text-gray-700">{contract.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Fechas</label>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Inicio: {formatDate(contract.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Fin: {formatDate(contract.endDate)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Renta Mensual</label>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(contract.monthlyRent, contract.currency)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Garantía</label>
                <p className="text-lg text-gray-900">
                  {formatCurrency(contract.depositAmount, contract.currency)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Moneda</label>
                <p className="text-gray-700">{contract.currency}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Property Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Información de la Propiedad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Dirección</label>
                <p className="text-lg text-gray-900">{contract.propertyAddress}</p>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleViewProperty}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Propiedad
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parties Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tenant */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Inquilino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{contract.tenantName}</p>
                <p className="text-sm text-gray-600">{contract.tenantEmail}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleContactTenant}>
                Contactar Inquilino
              </Button>
            </CardContent>
          </Card>

          {/* Owner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Propietario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{contract.ownerName}</p>
                <p className="text-sm text-gray-600">{contract.ownerEmail}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleContactOwner}>
                Contactar Propietario
              </Button>
            </CardContent>
          </Card>

          {/* Broker */}
          {contract.brokerName && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Corredor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">{contract.brokerName}</p>
                  <p className="text-sm text-gray-600">{contract.brokerEmail}</p>
                </div>
                <Button variant="outline" size="sm">
                  Contactar Corredor
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contract Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Línea de Tiempo</CardTitle>
            <CardDescription>Historial del contrato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Contrato creado</p>
                  <p className="text-sm text-gray-600">{formatDateTime(contract.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Contrato firmado</p>
                  <p className="text-sm text-gray-600">{formatDateTime(contract.updatedAt)}</p>
                </div>
              </div>

              {contract.status === 'active' && (
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Contrato activo</p>
                    <p className="text-sm text-gray-600">
                      El contrato está actualmente en vigencia
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
