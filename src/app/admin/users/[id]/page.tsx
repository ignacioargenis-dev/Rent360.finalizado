'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, User, Building } from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { User as UserType } from '@/types';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/users/${params?.id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          throw new Error('Usuario no encontrado');
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar el usuario');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      loadUser();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Detalles del Usuario">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg mb-2">Cargando información del usuario...</div>
            <div className="text-sm text-gray-500">Por favor espera</div>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <UnifiedDashboardLayout title="Error">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-2">{error || 'Usuario no encontrado'}</div>
            <Button variant="outline" onClick={() => router.push('/admin/users')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la lista de usuarios
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ADMIN: { label: 'Administrador', className: 'bg-red-100 text-red-800' },
      OWNER: { label: 'Propietario', className: 'bg-blue-100 text-blue-800' },
      TENANT: { label: 'Arrendatario', className: 'bg-green-100 text-green-800' },
      BROKER: { label: 'Corredor', className: 'bg-purple-100 text-purple-800' },
      PROVIDER: { label: 'Proveedor', className: 'bg-orange-100 text-orange-800' },
      MAINTENANCE: { label: 'Mantenimiento', className: 'bg-yellow-100 text-yellow-800' },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.TENANT;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) {
      return 'No disponible';
    }
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      return dateObj.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getRoleBadge(user.role)}
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/users/${user.id}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* User Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    {getRoleBadge(user.role)}
                  </div>
                </div>

                {user.bio && (
                  <div>
                    <h4 className="font-medium mb-2">Biografía</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{user.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Email:</span>
                    <span>{user.email}</span>
                  </div>

                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Teléfono:</span>
                      <span>{user.phone}</span>
                    </div>
                  )}

                  {user.address && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span className="font-medium">Dirección:</span>
                      <span>{user.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">ID de Usuario:</span>
                  <span className="ml-2 font-mono text-sm">{user.id}</span>
                </div>

                <div>
                  <span className="font-medium">Rol:</span>
                  <div className="mt-1">{getRoleBadge(user.role)}</div>
                </div>

                <div>
                  <span className="font-medium">Estado:</span>
                  <span className="ml-2">
                    {user.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Activo</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Inactivo</Badge>
                    )}
                  </span>
                </div>

                <div>
                  <span className="font-medium">Verificado:</span>
                  <span className="ml-2">
                    {user.rutVerified ? (
                      <Badge className="bg-green-100 text-green-800">Sí</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">No</Badge>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.createdAt && (
                  <div>
                    <span className="font-medium">Registrado:</span>
                    <span className="ml-2">{formatDate(user.createdAt)}</span>
                  </div>
                )}
                {user.updatedAt && (
                  <div>
                    <span className="font-medium">Última actualización:</span>
                    <span className="ml-2">{formatDate(user.updatedAt)}</span>
                  </div>
                )}
                {user.lastLogin && (
                  <div>
                    <span className="font-medium">Último acceso:</span>
                    <span className="ml-2">{formatDate(user.lastLogin)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Information */}
            {(user as any).maintenanceProvider && (
              <Card>
                <CardHeader>
                  <CardTitle>Proveedor de Mantenimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Nombre del Negocio:</span>
                    <span className="ml-2">
                      {(user as any).maintenanceProvider.businessName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Especialidad:</span>
                    <span className="ml-2">
                      {(user as any).maintenanceProvider.specialty || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span>
                    <span className="ml-2">
                      <Badge
                        className={
                          (user as any).maintenanceProvider.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {(user as any).maintenanceProvider.isVerified ? 'Verificado' : 'Pendiente'}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Estado del Negocio:</span>
                    <span className="ml-2">
                      {(user as any).maintenanceProvider.status || 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {(user as any).serviceProvider && (
              <Card>
                <CardHeader>
                  <CardTitle>Proveedor de Servicios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Nombre del Negocio:</span>
                    <span className="ml-2">
                      {(user as any).serviceProvider.businessName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Tipo de Servicio:</span>
                    <span className="ml-2">
                      {(user as any).serviceProvider.serviceType || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span>
                    <span className="ml-2">
                      <Badge
                        className={
                          (user as any).serviceProvider.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {(user as any).serviceProvider.isVerified ? 'Verificado' : 'Pendiente'}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Estado del Negocio:</span>
                    <span className="ml-2">{(user as any).serviceProvider.status || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Properties (if owner) */}
            {user.role === 'OWNER' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Propiedades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/properties?owner=${user.id}`)}
                    className="w-full"
                  >
                    Ver Propiedades
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
