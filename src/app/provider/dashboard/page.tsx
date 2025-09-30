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
  MessageSquare
} from 'lucide-react';
import { useUserState } from '@/hooks/useUserState';
import DashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

export default function ProviderDashboard() {
  const [jobs, setJobs] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserState();

  useEffect(() => {
    loadJobs();
    loadServiceRequests();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/provider/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error cargando trabajos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceRequests = async () => {
    try {
      const response = await fetch('/api/services/request');
      if (response.ok) {
        const data = await response.json();
        setServiceRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error cargando solicitudes de servicio:', error);
    }
  };

  const sendQuote = async (requestId: string, price: number) => {
    try {
      const response = await fetch('/api/services/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          price,
          estimatedTime: '2-4 horas',
          availabilityDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Cotización generada automáticamente desde el dashboard'
        })
      });

      if (response.ok) {
        alert('Cotización enviada exitosamente');
        loadServiceRequests(); // Recargar solicitudes
      } else {
        alert('Error al enviar cotización');
      }
    } catch (error) {
      console.error('Error enviando cotización:', error);
      alert('Error al enviar cotización');
    }
  };

  return (
    <DashboardLayout
      user={user}
      title="Dashboard Proveedor"
      subtitle="Gestiona tus servicios y clientes"
    >
      <div className="space-y-6">

        {/* Estadísticas principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trabajos Activos</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs.length}</div>
              <p className="text-xs text-muted-foreground">
                Servicios en curso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +3 nuevos esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2.4M</div>
              <p className="text-xs text-muted-foreground">
                +12% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8</div>
              <p className="text-xs text-muted-foreground">
                ★★★★★ Excelente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Solicitudes de servicio disponibles */}
        {serviceRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Solicitudes de Servicio Disponibles
              </CardTitle>
              <CardDescription>
                Clientes buscando proveedores para sus necesidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{request.serviceType} - {request.requesterName}</h4>
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          request.urgency === 'Alta' ? 'destructive' :
                          request.urgency === 'Media' ? 'default' : 'secondary'
                        }>
                          {request.urgency}
                        </Badge>
                        <Badge variant="outline">
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(request.createdAt).toLocaleDateString('es-CL')}
                      </p>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => sendQuote(request.id, 50000)}
                      >
                        Enviar Cotización
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenido principal */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Trabajos activos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Trabajos Activos
              </CardTitle>
              <CardDescription>
                Servicios en curso y próximos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Cargando trabajos...</div>
              ) : (
                <div className="space-y-4">
                  {jobs.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No hay trabajos activos
                    </div>
                  ) : (
                    jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.client}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          job.status === 'En progreso' ? 'default' :
                          job.status === 'Programado' ? 'secondary' : 'outline'
                        }>
                          {job.status}
                        </Badge>
                        <Badge variant={
                          job.priority === 'Alta' ? 'destructive' :
                          job.priority === 'Media' ? 'default' : 'secondary'
                        }>
                          {job.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(job.dueDate).toLocaleDateString('es-CL')}
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
            </CardContent>
          </Card>

          {/* Acciones rápidas y notificaciones */}
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
                  Nuevo Trabajo
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Agregar Cliente
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Generar Cotización
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contactar Soporte
                </Button>
              </CardContent>
            </Card>

            {/* Notificaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Trabajo completado</p>
                      <p className="text-xs text-muted-foreground">Reparación baño finalizada</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Recordatorio</p>
                      <p className="text-xs text-muted-foreground">Cita mañana a las 9:00 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Nuevo mensaje</p>
                      <p className="text-xs text-muted-foreground">Cliente solicita presupuesto</p>
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
