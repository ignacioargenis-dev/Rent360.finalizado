'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Building,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Wrench,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';

interface PropertyDetail {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  reportedIssues: Array<{
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    reportedDate: string;
    resolvedDate?: string;
    assignedTo?: string;
  }>;
  status: 'active' | 'inactive' | 'reported' | 'maintenance';
  lastReportedDate?: string;
  tenantCount: number;
  monthlyRent?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
}

export default function SupportPropertyDetailPage() {
  const { propertyId } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useAuth();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      loadPropertyDetail(propertyId as string);
    }
  }, [propertyId]);

  const loadPropertyDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for property detail
      const mockProperty: PropertyDetail = {
        id: id,
        propertyTitle: 'Casa en Las Condes',
        propertyAddress: 'Av. Las Condes 1234, Las Condes, Santiago',
        ownerName: 'María González',
        ownerEmail: 'maria@example.com',
        ownerPhone: '+56 9 1234 5678',
        status: 'reported',
        tenantCount: 1,
        monthlyRent: 850000,
        contractStartDate: '2023-01-01',
        contractEndDate: '2024-12-31',
        propertyType: 'Casa',
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        reportedIssues: [
          {
            id: '1',
            title: 'Fuga de agua en cocina',
            description:
              'Se detectó una fuga de agua bajo el lavaplatos de la cocina. Necesita reparación urgente.',
            status: 'in_progress',
            priority: 'high',
            reportedDate: '2024-01-15',
            assignedTo: 'Juan Pérez (Plomero)',
          },
          {
            id: '2',
            title: 'Puerta dañada',
            description: 'La puerta principal tiene daños en el marco y no cierra correctamente.',
            status: 'open',
            priority: 'medium',
            reportedDate: '2024-01-10',
          },
          {
            id: '3',
            title: 'Sistema eléctrico defectuoso',
            description: 'Los interruptores del dormitorio principal no funcionan correctamente.',
            status: 'resolved',
            priority: 'urgent',
            reportedDate: '2024-01-05',
            resolvedDate: '2024-01-08',
            assignedTo: 'Carlos Rodríguez (Electricista)',
          },
        ],
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProperty(mockProperty);
    } catch (error) {
      logger.error('Error loading property detail:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los detalles de la propiedad');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activa', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactiva', color: 'bg-gray-100 text-gray-800' },
      reported: { label: 'Reportada', color: 'bg-red-100 text-red-800' },
      maintenance: { label: 'Mantenimiento', color: 'bg-yellow-100 text-yellow-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getIssueStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Abierto', color: 'bg-red-100 text-red-800' },
      in_progress: { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-800' },
      resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-800' },
      closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-blue-100 text-blue-800' },
      medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleContactOwner = () => {
    if (property?.ownerEmail) {
      const subject = encodeURIComponent(`Soporte - Propiedad: ${property.propertyTitle}`);
      const body = encodeURIComponent(
        `Hola ${property.ownerName},\n\nMe comunico respecto a la propiedad: ${property.propertyTitle}\n\nAtentamente,\nEquipo de Soporte Rent360`
      );
      window.open(`mailto:${property.ownerEmail}?subject=${subject}&body=${body}`);
    }
  };

  const handleAssignIssue = async (issueId: string) => {
    try {
      const assignedTo = prompt('Asignar problema a:', 'tecnico@rent360.cl');
      if (!assignedTo) {
        return;
      }

      const response = await fetch(`/api/properties/${propertyId}/issues/${issueId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedTo }),
      });

      if (response.ok) {
        alert(`Problema asignado exitosamente a: ${assignedTo}`);
        // Refresh property data
        if (propertyId) {
          await loadPropertyDetail(propertyId as string);
        }
      } else {
        throw new Error('Error al asignar el problema');
      }
    } catch (error) {
      logger.error('Error assigning issue:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al asignar el problema. Por favor intenta nuevamente.');
    }
  };

  const handleUpdateIssueStatus = async (issueId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/issues/${issueId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert(`Estado del problema actualizado exitosamente a: ${newStatus}`);
        // Refresh property data
        if (propertyId) {
          await loadPropertyDetail(propertyId as string);
        }
      } else {
        throw new Error('Error al actualizar el estado');
      }
    } catch (error) {
      logger.error('Error updating issue status:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al actualizar el estado. Por favor intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Detalle de Propiedad" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando detalles de la propiedad...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error || !property) {
    return (
      <UnifiedDashboardLayout title="Detalle de Propiedad" subtitle="Error al cargar">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error || 'Propiedad no encontrada'}</p>
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
      title={`Propiedad - ${property.propertyTitle}`}
      subtitle={`ID: ${property.id}`}
    >
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Propiedades
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleContactOwner}>
              <Mail className="w-4 h-4 mr-2" />
              Contactar Propietario
            </Button>
          </div>
        </div>

        {/* Property Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Información General
                  </CardTitle>
                  {getStatusBadge(property.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Propiedad</label>
                    <div className="text-lg text-gray-900 mt-1">{property.propertyTitle}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Dirección</label>
                    <div className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {property.propertyAddress}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo</label>
                    <div className="text-lg text-gray-900 mt-1">{property.propertyType}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Especificaciones</label>
                    <div className="text-lg text-gray-900 mt-1">
                      {property.bedrooms} dorm. • {property.bathrooms} baños • {property.area} m²
                    </div>
                  </div>

                  {property.monthlyRent && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Arriendo Mensual</label>
                      <div className="text-lg text-gray-900 mt-1 font-semibold">
                        {formatCurrency(property.monthlyRent)}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Inquilinos</label>
                    <div className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {property.tenantCount} inquilino{property.tenantCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Owner Info */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Propietario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre</label>
                    <div className="text-lg text-gray-900 mt-1">{property.ownerName}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {property.ownerEmail}
                    </div>
                  </div>

                  {property.ownerPhone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Teléfono</label>
                      <div className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {property.ownerPhone}
                      </div>
                    </div>
                  )}

                  <Button onClick={handleContactOwner} className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Contactar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Issues and Details Tabs */}
        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Problemas Reportados ({property.reportedIssues.length})
            </TabsTrigger>
            <TabsTrigger value="contract" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contrato
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Historial de Mantenimiento
            </TabsTrigger>
          </TabsList>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Problemas Reportados</CardTitle>
                <CardDescription>Lista de problemas reportados para esta propiedad</CardDescription>
              </CardHeader>
              <CardContent>
                {property.reportedIssues.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sin problemas reportados
                    </h3>
                    <p className="text-gray-600">
                      Esta propiedad no tiene problemas reportados actualmente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {property.reportedIssues.map(issue => (
                      <div key={issue.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg text-gray-900">{issue.title}</h3>
                              <div className="flex gap-2">
                                {getIssueStatusBadge(issue.status)}
                                {getPriorityBadge(issue.priority)}
                              </div>
                            </div>

                            <p className="text-gray-700 mb-3">{issue.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>Reportado: {formatDate(issue.reportedDate)}</span>
                              </div>

                              {issue.resolvedDate && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span>Resuelto: {formatDate(issue.resolvedDate)}</span>
                                </div>
                              )}

                              {issue.assignedTo && (
                                <div className="flex items-center gap-2 md:col-span-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span>Asignado a: {issue.assignedTo}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {issue.status === 'open' && (
                              <Button size="sm" onClick={() => handleAssignIssue(issue.id)}>
                                Asignar
                              </Button>
                            )}

                            {issue.status === 'in_progress' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateIssueStatus(issue.id, 'resolved')}
                              >
                                Marcar Resuelto
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contract Tab */}
          <TabsContent value="contract" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                {property.contractStartDate && property.contractEndDate ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fecha de Inicio</label>
                      <div className="text-lg text-gray-900 mt-1">
                        {formatDate(property.contractStartDate)}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Fecha de Término</label>
                      <div className="text-lg text-gray-900 mt-1">
                        {formatDate(property.contractEndDate)}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex gap-2">
                        <Button variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Contrato Completo
                        </Button>
                        <Button variant="outline">
                          <Calendar className="w-4 h-4 mr-2" />
                          Ver Cronograma de Pagos
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Información no disponible
                    </h3>
                    <p className="text-gray-600">
                      No hay información de contrato disponible para esta propiedad.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Mantenimiento</CardTitle>
                <CardDescription>Registro de trabajos de mantenimiento realizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Historial de Mantenimiento
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Funcionalidad en desarrollo. Pronto podrás ver el historial completo de
                    mantenimiento.
                  </p>
                  <Button variant="outline">
                    <Wrench className="w-4 h-4 mr-2" />
                    Ver Historial Completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
