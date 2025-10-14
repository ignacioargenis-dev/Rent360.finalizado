'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DebugRolePage() {
  const { user, loading } = useAuth();
  const [serverData, setServerData] = useState<any>(null);
  const [serverLoading, setServerLoading] = useState(false);

  const checkServerRole = async () => {
    setServerLoading(true);
    try {
      const response = await fetch('/api/debug-role', {
        credentials: 'include',
      });
      const data = await response.json();
      setServerData(data);
    } catch (error) {
      setServerData({
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setServerLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      checkServerRole();
    }
  }, [loading, user]);

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Debug Role" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando información...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout title="Debug Role" subtitle="Diagnóstico de Roles">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>👤 Cliente (AuthProvider)</span>
              <Badge variant={user ? 'default' : 'destructive'}>
                {user ? 'Autenticado' : 'No autenticado'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-mono text-sm">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-mono text-sm">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rol</p>
                    <p className="font-mono text-lg font-bold text-blue-600">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Rol</p>
                    <p className="font-mono text-sm">{typeof user.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-mono text-sm">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">LocalStorage</p>
                    <p className="font-mono text-sm">
                      {typeof window !== 'undefined' && localStorage.getItem('user')
                        ? 'Presente'
                        : 'Ausente'}
                    </p>
                  </div>
                </div>

                {typeof window !== 'undefined' && localStorage.getItem('user') && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">LocalStorage Data</p>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(JSON.parse(localStorage.getItem('user') || '{}'), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-600">No hay usuario autenticado en el cliente</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🔧 Servidor (API)</span>
              <Button onClick={checkServerRole} disabled={serverLoading} size="sm">
                {serverLoading ? 'Verificando...' : 'Recargar'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serverLoading ? (
              <p className="text-gray-500">Consultando servidor...</p>
            ) : serverData?.success ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-mono text-sm">
                      {serverData.debug.userFromRequireAuth.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-mono text-sm">{serverData.debug.userFromRequireAuth.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rol (Servidor)</p>
                    <p className="font-mono text-lg font-bold text-green-600">
                      {serverData.debug.userFromRequireAuth.role}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Rol</p>
                    <p className="font-mono text-sm">
                      {serverData.debug.userFromRequireAuth.roleType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cookie de Auth</p>
                    <p className="font-mono text-sm">
                      {serverData.debug.cookies.hasAuthToken ? '✅ Presente' : '❌ Ausente'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Timestamp</p>
                    <p className="font-mono text-xs">{serverData.debug.timestamp}</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-green-50 rounded">
                  <p className="text-sm font-semibold text-green-800">✅ Comparación de Roles</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      Cliente: <span className="font-mono font-bold">{user?.role}</span>
                    </p>
                    <p className="text-sm">
                      Servidor:{' '}
                      <span className="font-mono font-bold">
                        {serverData.debug.userFromRequireAuth.role}
                      </span>
                    </p>
                    <p className="text-sm">
                      Coinciden:{' '}
                      <span className="font-bold">
                        {user?.role === serverData.debug.userFromRequireAuth.role
                          ? '✅ SÍ'
                          : '❌ NO'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                <p className="font-semibold">❌ Error del Servidor</p>
                <p className="text-sm mt-2">{serverData?.error || 'Error desconocido'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 Instrucciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              1. <strong>Cliente (AuthProvider):</strong> Muestra el rol que tiene el usuario en el
              navegador
            </p>
            <p>
              2. <strong>Servidor (API):</strong> Muestra el rol que recibe el servidor desde
              requireAuth()
            </p>
            <p>
              3. <strong>Ambos deben ser MAYÚSCULAS:</strong> ADMIN, OWNER, TENANT, etc.
            </p>
            <p>4. Si no coinciden, hay un problema de sincronización</p>
            <p className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              ⚠️ <strong>Importante:</strong> Los cambios recientes requieren un nuevo deploy en
              DigitalOcean para que tomen efecto en producción.
            </p>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
