'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Badge } from '@/components/ui/badge';

export default function DebugAuthPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Debug Auth" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando información de autenticación...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!user) {
    return (
      <UnifiedDashboardLayout title="Debug Auth" subtitle="Usuario no autenticado">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 text-lg">❌ Usuario no autenticado</p>
            <p className="text-gray-600 mt-2">Debes iniciar sesión para ver esta información.</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout title="Debug Auth" subtitle="Información de autenticación">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Información del Usuario Autenticado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">ID:</label>
                <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded">{user.id || 'N/A'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Email:</label>
                <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded">{user.email || 'N/A'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Nombre:</label>
                <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded">{user.name || 'N/A'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Rol:</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded flex-1">{user.role || 'N/A'}</p>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? '✅ Admin' : '❌ No Admin'}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono:</label>
                <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded">{user.phone || 'N/A'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Activo:</label>
                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                  {user.isActive ? '✅ Activo' : '❌ Inactivo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧪 Verificación de Permisos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Rol es exactamente 'admin'?</span>
                <Badge variant={user.role === 'admin' ? 'default' : 'destructive'}>
                  {user.role === 'admin' ? '✅ Sí' : '❌ No'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Rol es exactamente 'ADMIN'?</span>
                <Badge variant={user.role === 'ADMIN' ? 'default' : 'destructive'}>
                  {user.role === 'ADMIN' ? '✅ Sí' : '❌ No'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Rol incluye 'admin' (case insensitive)?</span>
                <Badge variant={user.role?.toLowerCase().includes('admin') ? 'default' : 'destructive'}>
                  {user.role?.toLowerCase().includes('admin') ? '✅ Sí' : '❌ No'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Usuario está activo?</span>
                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                  {user.isActive ? '✅ Sí' : '❌ No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔧 Información Técnica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>User object completo:</strong>
              </p>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
