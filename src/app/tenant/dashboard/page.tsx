'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building,
  FileText,
  CreditCard,
  Wrench,
  Activity,
  Plus,
  AlertTriangle
} from 'lucide-react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';


interface DashboardStats {
  totalProperties: number;
  activeContracts: number;
  pendingPayments: number;
  maintenanceRequests: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'payment' | 'maintenance' | 'contract' | 'message';
  title: string;
  description: string;
  timestamp: Date;
  user: {
    name: string;
    avatar?: string;
  };
}

export default function TenantDashboard() {
  const { user } = useUserState();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeContracts: 0,
    pendingPayments: 0,
    maintenanceRequests: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funciones para acciones rápidas
  const handleNewProperty = () => {
    console.log('Navegando a nueva propiedad');
    alert('Funcionalidad para agregar nueva propiedad - próximamente');
    // TODO: Implementar navegación o modal
  };

  const handleCreateContract = () => {
    console.log('Creando nuevo contrato');
    alert('Funcionalidad para crear contrato - próximamente');
    // TODO: Implementar navegación o modal
  };

  const handleRegisterPayment = () => {
    console.log('Registrando pago');
    alert('Funcionalidad para registrar pago - próximamente');
    // TODO: Implementar navegación o modal
  };

  const handleRequestMaintenance = () => {
    console.log('Solicitando mantenimiento');
    alert('Funcionalidad para solicitar mantenimiento - próximamente');
    // TODO: Implementar navegación o modal
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular llamada a API
      const response = await fetch('/api/tenant/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data.stats);
      setRecentActivity(data.recentActivity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Dashboard Inquilino"
      subtitle="Gestiona tus contratos y pagos"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.monthlyGrowth}% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeContracts}</div>
            <p className="text-xs text-muted-foreground">
              Contratos vigentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mantenimiento</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceRequests}</div>
            <p className="text-xs text-muted-foreground">
              Solicitudes abiertas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimas actividades en tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{activity.title}</h4>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={handleNewProperty}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Propiedad
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleCreateContract}>
                  <FileText className="w-4 h-4 mr-2" />
                  Crear Contrato
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleRegisterPayment}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Registrar Pago
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleRequestMaintenance}>
                  <Wrench className="w-4 h-4 mr-2" />
                  Solicitar Mantenimiento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </EnhancedDashboardLayout>
  );
}
