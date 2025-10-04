'use client';

// Build fix - force update

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
import {
  Building,
  Users,
  FileText,
  CreditCard,
  Star,
  Settings,
  Bell,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Ticket,
  Database,
  Shield,
  Clock,
  Search,
  Calendar,
  MapPin,
  Wrench,
  Camera,
  Target,
  Activity,
  PieChart,
  LineChart,
  Info,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function ProveedoresPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar datos de la p�gina
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock providers data for admin
      const mockProviders = {
        overview: {
          totalProviders: 45,
          activeProviders: 38,
          pendingProviders: 7,
          topServices: ['Mantenimiento', 'Limpieza', 'Seguridad', 'Jardinería']
        },
        providers: [
          {
            id: '1',
            name: 'Servicios Integrales Ltda.',
            contactName: 'María González',
            email: 'contacto@serviciosintegrales.cl',
            phone: '+56 9 1234 5678',
            services: ['Mantenimiento', 'Reparaciones'],
            status: 'active',
            rating: 4.5,
            completedJobs: 127,
            location: 'Santiago Centro',
            registrationDate: '2023-01-15'
          },
          {
            id: '2',
            name: 'Limpieza Profesional SpA',
            contactName: 'Carlos Rodríguez',
            email: 'info@limpiezaprofesional.cl',
            phone: '+56 9 8765 4321',
            services: ['Limpieza', 'Sanitización'],
            status: 'active',
            rating: 4.2,
            completedJobs: 89,
            location: 'Providencia',
            registrationDate: '2023-03-20'
          },
          {
            id: '3',
            name: 'Seguridad Total',
            contactName: 'Ana Silva',
            email: 'ventas@seguridadtotal.cl',
            phone: '+56 9 5555 6666',
            services: ['Seguridad', 'Vigilancia'],
            status: 'pending',
            rating: 0,
            completedJobs: 0,
            location: 'Las Condes',
            registrationDate: '2024-01-10'
          },
          {
            id: '4',
            name: 'Jardines Verdes',
            contactName: 'Pedro Morales',
            email: 'contacto@jardinesverdes.cl',
            phone: '+56 9 7777 8888',
            services: ['Jardinería', 'Paisajismo'],
            status: 'active',
            rating: 4.7,
            completedJobs: 156,
            location: 'Vitacura',
            registrationDate: '2022-11-05'
          },
          {
            id: '5',
            name: 'Técnicos Eléctricos Express',
            contactName: 'Sofía Vargas',
            email: 'servicio@tecnicosexpress.cl',
            phone: '+56 9 9999 0000',
            services: ['Electricidad', 'Instalaciones'],
            status: 'active',
            rating: 4.8,
            completedJobs: 203,
            location: 'Ñuñoa',
            registrationDate: '2022-08-12'
          }
        ]
      };

      setData(mockProviders);
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = () => {
    router.push('/admin/providers/new');
  };

  const handleExportProviders = () => {
    if (!data?.providers || data.providers.length === 0) {
      return; // No providers to export
    }

    const csvContent = [
      ['Nombre', 'Contacto', 'Email', 'Teléfono', 'Servicios', 'Estado', 'Calificación', 'Trabajos Completados']
    ];

    data.providers.forEach((provider: any) => {
      csvContent.push([
        provider.name,
        provider.contactName,
        provider.email,
        provider.phone,
        provider.services.join('; '),
        provider.status === 'active' ? 'Activo' : 'Pendiente',
        provider.rating > 0 ? provider.rating.toString() : 'Sin calificar',
        provider.completedJobs.toString()
      ]);
    });

    const csvString = csvContent.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `proveedores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Proveedores" subtitle="Cargando informaci�n...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Proveedores" subtitle="Error al cargar la p�gina">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPageData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Proveedores"
      subtitle="Gestiona y visualiza la informaci�n de proveedores"
    >
      <div className="space-y-6">
        {/* Header con estad�sticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.totalProviders || 0}</div>
              <p className="text-xs text-muted-foreground">
                {data?.overview.activeProviders || 0} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.activeProviders || 0}</div>
              <p className="text-xs text-muted-foreground">
                {data?.overview.pendingProviders || 0} pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes de Aprobación</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.pendingProviders || 0}</div>
              <p className="text-xs text-muted-foreground">
                Requieren revisión
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de proveedores */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Proveedores</CardTitle>
            <CardDescription>
              Administra todos los proveedores registrados en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.providers.map((provider: any) => (
                <Card key={provider.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{provider.name}</h3>
                          <Badge className={provider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {provider.status === 'active' ? 'Activo' : 'Pendiente'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Contacto:</span> {provider.contactName}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {provider.email}
                          </div>
                          <div>
                            <span className="font-medium">Teléfono:</span> {provider.phone}
                          </div>
                          <div>
                            <span className="font-medium">Ubicación:</span> {provider.location}
                          </div>
                          <div>
                            <span className="font-medium">Trabajos completados:</span> {provider.completedJobs}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Calificación:</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{provider.rating > 0 ? provider.rating : 'Sin calificar'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <span className="font-medium text-sm text-gray-700">Servicios:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {provider.services.map((service: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Registrado: {new Date(provider.registrationDate).toLocaleDateString('es-CL')}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/providers/${provider.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => router.push(`/admin/providers/${provider.id}/edit`)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>

                        {provider.status === 'pending' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aprobar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones r�pidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones R�pidas</CardTitle>
            <CardDescription>Accede r�pidamente a las funciones m�s utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Plus}
                label="Agregar Nuevo"
                description="Registrar proveedor"
                onClick={handleAddProvider}
              />

              <QuickActionButton
                icon={Filter}
                label="Filtrar"
                description="Buscar y filtrar proveedores"
                onClick={() => {
                  // Focus on search input or open filters
                  const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                  }
                }}
              />

              <QuickActionButton
                icon={Download}
                label="Exportar"
                description="Descargar lista en CSV"
                onClick={handleExportProviders}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Reportes"
                description="Ver estad�sticas detalladas"
                onClick={() => router.push('/admin/reports/providers')}
              />

              <QuickActionButton
                icon={Settings}
                label="Configuraci�n"
                description="Ajustes del sistema"
                onClick={() => router.push('/admin/settings')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar datos"
                onClick={() => loadPageData()}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
