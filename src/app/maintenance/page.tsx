'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wrench,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Home,
  Settings
} from 'lucide-react';
import { useUserState } from '@/hooks/useUserState';
import DashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

export default function MaintenanceDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserState();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/maintenance/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error cargando trabajos de mantenimiento:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      user={user}
      title="Dashboard Mantenimiento"
      subtitle="Gestiona mantenimientos preventivos y correctivos"
    >
      <div className="space-y-6">

        {/* Estadísticas principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mantenimientos Activos</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                +1 desde ayer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                +12 nuevas esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$3.1M</div>
              <p className="text-xs text-muted-foreground">
                +18% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.9</div>
              <p className="text-xs text-muted-foreground">
                ★★★★★ Excelente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Mantenimientos activos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Mantenimientos Activos
              </CardTitle>
              <CardDescription>
                Trabajos de mantenimiento en curso y programados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Cargando trabajos de mantenimiento...</div>
              ) : (
                <div className="space-y-4">
                  {jobs.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No hay trabajos de mantenimiento activos
                    </div>
                  ) : (
                    jobs.map((maintenance) => (
                  <div key={maintenance.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-medium">{maintenance.title}</h4>
                      <p className="text-sm text-muted-foreground">{maintenance.property}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          maintenance.type === 'Preventivo' ? 'default' : 'secondary'
                        }>
                          {maintenance.type}
                        </Badge>
                        <Badge variant={
                          maintenance.status === 'En progreso' ? 'default' :
                          maintenance.status === 'Programado' ? 'secondary' :
                          maintenance.status === 'Pendiente' ? 'outline' : 'default'
                        }>
                          {maintenance.status}
                        </Badge>
                        <Badge variant={
                          maintenance.urgency === 'Alta' ? 'destructive' :
                          maintenance.urgency === 'Media' ? 'default' : 'secondary'
                        }>
                          {maintenance.urgency}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Técnico: {maintenance.technician}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium">
                        {new Date(maintenance.dueDate).toLocaleDateString('es-CL')}
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Acciones rápidas y estadísticas */}
          <div className="space-y-6">
            {/* Acciones rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Programar Mantenimiento
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Reportar Emergencia
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Agregar Propiedad
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Generar Reporte
                </Button>
              </CardContent>
            </Card>

            {/* Estadísticas rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estadísticas del Mes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mantenimientos completados</span>
                  <span className="font-medium">47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tiempo promedio</span>
                  <span className="font-medium">2.3h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Satisfacción promedio</span>
                  <span className="font-medium">4.9/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Propiedades atendidas</span>
                  <span className="font-medium">89</span>
                </div>
              </CardContent>
            </Card>

            {/* Notificaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Emergencia</p>
                      <p className="text-xs text-muted-foreground">Fuga de agua en edificio Las Condes</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Recordatorio</p>
                      <p className="text-xs text-muted-foreground">Inspección mensual vence mañana</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Completado</p>
                      <p className="text-xs text-muted-foreground">Mantenimiento ascensor finalizado</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
