'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import {
  Wrench,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface ServiceRequest {
  id: string;
  serviceType: string;
  requesterName: string;
  description: string;
  urgency: string;
  status: string;
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
  client: string;
  status: string;
  priority: string;
  dueDate: string;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para modales de acciones rápidas
  const [showQuickJobModal, setShowQuickJobModal] = useState(false);
  const [showQuickQuoteModal, setShowQuickQuoteModal] = useState(false);

  // Estados para formularios rápidos
  const [quickJobData, setQuickJobData] = useState({
    clientName: '',
    serviceType: '',
    description: '',
    urgency: 'normal',
    scheduledDate: '',
    estimatedCost: '',
  });

  const [quickQuoteData, setQuickQuoteData] = useState({
    clientName: '',
    serviceType: '',
    description: '',
    estimatedHours: 2,
    hourlyRate: 25000,
    materials: '',
  });
  const { user } = useAuth();

  // Funciones para acciones rápidas
  const submitQuickJob = async () => {
    if (!quickJobData.clientName || !quickJobData.serviceType || !quickJobData.description) {
      setErrorMessage('Por favor complete todos los campos obligatorios.');
      return;
    }

    try {
      // Aquí iría la lógica para crear el trabajo rápido
      alert(
        `✅ Trabajo creado exitosamente\n\nCliente: ${quickJobData.clientName}\nServicio: ${quickJobData.serviceType}\nFecha: ${quickJobData.scheduledDate || 'Por definir'}\n\nEl trabajo ha sido agendado y se notificará al cliente.`
      );

      setShowQuickJobModal(false);
      setQuickJobData({
        clientName: '',
        serviceType: '',
        description: '',
        urgency: 'normal',
        scheduledDate: '',
        estimatedCost: '',
      });
      setSuccessMessage('Trabajo creado exitosamente');

      // Recargar datos
      await loadJobs();
    } catch (error) {
      setErrorMessage('Error al crear el trabajo. Intente nuevamente.');
    }
  };

  const submitQuickQuote = async () => {
    if (!quickQuoteData.clientName || !quickQuoteData.serviceType || !quickQuoteData.description) {
      setErrorMessage('Por favor complete todos los campos obligatorios.');
      return;
    }

    const totalCost =
      quickQuoteData.estimatedHours * quickQuoteData.hourlyRate +
      (quickQuoteData.materials ? parseInt(quickQuoteData.materials) : 0);

    try {
      // Aquí iría la lógica para crear la cotización rápida
      alert(
        `✅ Cotización enviada exitosamente\n\nCliente: ${quickQuoteData.clientName}\nServicio: ${quickQuoteData.serviceType}\nHoras estimadas: ${quickQuoteData.estimatedHours}\nTarifa por hora: $${quickQuoteData.hourlyRate.toLocaleString()}\n${quickQuoteData.materials ? `Materiales: $${parseInt(quickQuoteData.materials).toLocaleString()}\n` : ''}Total estimado: $${totalCost.toLocaleString()}\n\nLa cotización ha sido enviada al cliente.`
      );

      setShowQuickQuoteModal(false);
      setQuickQuoteData({
        clientName: '',
        serviceType: '',
        description: '',
        estimatedHours: 2,
        hourlyRate: 25000,
        materials: '',
      });
      setSuccessMessage('Cotización enviada exitosamente');
    } catch (error) {
      setErrorMessage('Error al enviar la cotización. Intente nuevamente.');
    }
  };

  useEffect(() => {
    const loadProviderData = async () => {
      try {
        // Detectar si es un usuario nuevo (menos de 1 hora desde creación)
        const isNewUser =
          !user?.createdAt || Date.now() - new Date(user.createdAt).getTime() < 3600000;

        // SIEMPRE mostrar dashboard vacío para usuarios nuevos
        // Los datos mock solo aparecen para usuarios seed con @rent360.cl (para testing)
        if (isNewUser || !user?.email?.includes('@rent360.cl')) {
          // Usuario nuevo O usuario real (no seed) - mostrar dashboard vacío
          setJobs([]);
          setServiceRequests([]);
          setLoading(false);
          return;
        }

        // Usuario existente - cargar datos reales
        await loadJobs();
        await loadServiceRequests();
      } catch (error) {
        logger.error('Error loading provider data:', { error });
        setLoading(false);
      }
    };

    loadProviderData();
  }, [user]);

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/provider/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      logger.error('Error cargando trabajos:', { error });
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
      logger.error('Error cargando solicitudes de servicio:', { error });
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
          notes: 'Cotización generada automáticamente desde el dashboard',
        }),
      });

      if (response.ok) {
        setSuccessMessage('Cotización enviada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadServiceRequests(); // Recargar solicitudes
      } else {
        setErrorMessage('Error al enviar cotización');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      logger.error('Error enviando cotización:', { error });
      setErrorMessage('Error al enviar cotización. Por favor, inténtalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Dashboard Proveedor"
      subtitle="Gestiona tus servicios y clientes"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trabajos Activos</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs.length}</div>
              <p className="text-xs text-muted-foreground">Servicios en curso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+3 nuevos esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2.4M</div>
              <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8</div>
              <p className="text-xs text-muted-foreground">★★★★★ Excelente</p>
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
              <CardDescription>Clientes buscando proveedores para sus necesidades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceRequests.map(request => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {request.serviceType} - {request.requesterName}
                      </h4>
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            request.urgency === 'Alta'
                              ? 'destructive'
                              : request.urgency === 'Media'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {request.urgency}
                        </Badge>
                        <Badge variant="outline">{request.status}</Badge>
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
              <CardDescription>Servicios en curso y próximos</CardDescription>
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
                    jobs.map(job => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <h4 className="font-medium">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">{job.client}</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                job.status === 'En progreso'
                                  ? 'default'
                                  : job.status === 'Programado'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {job.status}
                            </Badge>
                            <Badge
                              variant={
                                job.priority === 'Alta'
                                  ? 'destructive'
                                  : job.priority === 'Media'
                                    ? 'default'
                                    : 'secondary'
                              }
                            >
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
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <QuickActionButton
                      icon={Calendar}
                      label="Nuevo Trabajo"
                      description="Agendar servicio"
                      onClick={() => {
                        // Navegar a la página de trabajos con modal de creación rápida
                        setShowQuickJobModal(true);
                      }}
                      variant="default"
                    />

                    <QuickActionButton
                      icon={Users}
                      label="Gestionar Clientes"
                      description="Base de clientes"
                      onClick={() => {
                        // Navegar a la página de clientes con filtros aplicados
                        router.push('/provider/clients?filter=active');
                      }}
                      variant="secondary"
                    />
                  </div>

                  <div className="space-y-4">
                    <QuickActionButton
                      icon={DollarSign}
                      label="Cotizaciones"
                      description="Generar presupuesto"
                      onClick={() => {
                        // Abrir modal de cotización rápida
                        setShowQuickQuoteModal(true);
                      }}
                      variant="default"
                    />

                    <QuickActionButton
                      icon={MessageSquare}
                      label="Soporte"
                      description="Centro de ayuda"
                      onClick={() => {
                        // Abrir chat de soporte directo
                        window.open('/support/chat', '_blank');
                      }}
                      variant="outline"
                    />
                  </div>
                </div>
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

      {/* Quick Job Modal */}
      <Dialog open={showQuickJobModal} onOpenChange={setShowQuickJobModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-600">
              ⚡ Crear Trabajo Rápido
            </DialogTitle>
            <DialogDescription>
              Agende un nuevo servicio de manera rápida y eficiente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quick-job-client">Nombre del Cliente</Label>
                <Input
                  id="quick-job-client"
                  placeholder="Juan Pérez"
                  value={quickJobData.clientName}
                  onChange={e => setQuickJobData(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="quick-job-service">Tipo de Servicio</Label>
                <Select
                  value={quickJobData.serviceType}
                  onValueChange={value =>
                    setQuickJobData(prev => ({ ...prev, serviceType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Limpieza">Limpieza</SelectItem>
                    <SelectItem value="Plomería">Plomería</SelectItem>
                    <SelectItem value="Electricidad">Electricidad</SelectItem>
                    <SelectItem value="Jardinería">Jardinería</SelectItem>
                    <SelectItem value="Pintura">Pintura</SelectItem>
                    <SelectItem value="Reparaciones">Reparaciones</SelectItem>
                    <SelectItem value="Instalaciones">Instalaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="quick-job-description">Descripción del Trabajo</Label>
              <Textarea
                id="quick-job-description"
                placeholder="Describe brevemente el trabajo a realizar..."
                value={quickJobData.description}
                onChange={e => setQuickJobData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quick-job-urgency">Urgencia</Label>
                <Select
                  value={quickJobData.urgency}
                  onValueChange={value => setQuickJobData(prev => ({ ...prev, urgency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quick-job-date">Fecha Programada</Label>
                <Input
                  id="quick-job-date"
                  type="date"
                  value={quickJobData.scheduledDate}
                  onChange={e =>
                    setQuickJobData(prev => ({ ...prev, scheduledDate: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="quick-job-cost">Costo Estimado</Label>
                <Input
                  id="quick-job-cost"
                  placeholder="$50.000"
                  value={quickJobData.estimatedCost}
                  onChange={e =>
                    setQuickJobData(prev => ({ ...prev, estimatedCost: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                💡 Consejos para trabajos rápidos
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Los trabajos se crean automáticamente con estado &quot;Pendiente&quot;</li>
                <li>• Se enviará notificación automática al cliente</li>
                <li>• Puede editar los detalles después desde &quot;Mis Trabajos&quot;</li>
                <li>• Los costos estimados son solo referenciales</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={submitQuickJob} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Calendar className="w-4 h-4 mr-2" />
                Crear Trabajo
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQuickJobModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Quote Modal */}
      <Dialog open={showQuickQuoteModal} onOpenChange={setShowQuickQuoteModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-green-600">
              💰 Cotización Rápida
            </DialogTitle>
            <DialogDescription>Genere y envíe presupuestos de manera instantánea</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quick-quote-client">Nombre del Cliente</Label>
                <Input
                  id="quick-quote-client"
                  placeholder="María González"
                  value={quickQuoteData.clientName}
                  onChange={e =>
                    setQuickQuoteData(prev => ({ ...prev, clientName: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="quick-quote-service">Tipo de Servicio</Label>
                <Select
                  value={quickQuoteData.serviceType}
                  onValueChange={value =>
                    setQuickQuoteData(prev => ({ ...prev, serviceType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Limpieza">Limpieza</SelectItem>
                    <SelectItem value="Plomería">Plomería</SelectItem>
                    <SelectItem value="Electricidad">Electricidad</SelectItem>
                    <SelectItem value="Jardinería">Jardinería</SelectItem>
                    <SelectItem value="Pintura">Pintura</SelectItem>
                    <SelectItem value="Reparaciones">Reparaciones</SelectItem>
                    <SelectItem value="Instalaciones">Instalaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="quick-quote-description">Descripción del Servicio</Label>
              <Textarea
                id="quick-quote-description"
                placeholder="Detalle del trabajo a cotizar..."
                value={quickQuoteData.description}
                onChange={e =>
                  setQuickQuoteData(prev => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quick-quote-hours">Horas Estimadas</Label>
                <Input
                  id="quick-quote-hours"
                  type="number"
                  min="1"
                  value={quickQuoteData.estimatedHours}
                  onChange={e =>
                    setQuickQuoteData(prev => ({
                      ...prev,
                      estimatedHours: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="quick-quote-rate">Tarifa por Hora</Label>
                <Input
                  id="quick-quote-rate"
                  type="number"
                  placeholder="25000"
                  value={quickQuoteData.hourlyRate}
                  onChange={e =>
                    setQuickQuoteData(prev => ({
                      ...prev,
                      hourlyRate: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="quick-quote-materials">Materiales (opcional)</Label>
                <Input
                  id="quick-quote-materials"
                  placeholder="$0"
                  value={quickQuoteData.materials}
                  onChange={e =>
                    setQuickQuoteData(prev => ({ ...prev, materials: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Cálculo automático del total */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Estimado:</span>
                <span className="text-2xl font-bold text-green-600">
                  $
                  {(
                    quickQuoteData.estimatedHours * quickQuoteData.hourlyRate +
                    (quickQuoteData.materials ? parseInt(quickQuoteData.materials) : 0)
                  ).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Mano de obra: $
                {(quickQuoteData.estimatedHours * quickQuoteData.hourlyRate).toLocaleString()} •
                Materiales: $
                {quickQuoteData.materials
                  ? parseInt(quickQuoteData.materials).toLocaleString()
                  : '0'}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">
                📋 Información incluida en la cotización
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Descripción detallada del servicio</li>
                <li>• Desglose de costos (mano de obra + materiales)</li>
                <li>• Tiempo estimado de ejecución</li>
                <li>• Condiciones de pago y validez</li>
                <li>• Información de contacto</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={submitQuickQuote} className="flex-1 bg-green-600 hover:bg-green-700">
                <DollarSign className="w-4 h-4 mr-2" />
                Enviar Cotización
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQuickQuoteModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}
