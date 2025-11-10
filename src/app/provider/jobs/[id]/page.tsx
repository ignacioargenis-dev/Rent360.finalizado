'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  User,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  AlertTriangle,
  Wrench,
  Play,
  Pause,
  Square,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface Job {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  progress: number;
  price: number;
  scheduledDate: string;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
  images?: string[];
}

export default function ProviderJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadJob();
  }, [jobId]);

  // Auto-save cuando cambien status o notes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (job && !loading) {
      timeoutId = setTimeout(() => {
        updateJobProgress();
      }, 1000); // Esperar 1 segundo después del último cambio
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [status, notes, job, loading]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/provider/jobs/${jobId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar el trabajo');
      }

      const data = await response.json();

      if (data.success && data.job) {
        setJob(data.job);
        setProgress(data.job.progress || 0);
        setStatus(data.job.status || '');
        setNotes(data.job.notes || '');
      } else {
        throw new Error('Trabajo no encontrado');
      }
    } catch (error) {
      logger.error('Error cargando trabajo:', { error, jobId });
      setErrorMessage('Error al cargar el trabajo. Por favor, inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const updateJobProgress = async () => {
    if (!job) {
      return;
    }

    setUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/provider/jobs/${jobId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: status || undefined,
          progress: progress,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar el trabajo');
      }

      setSuccessMessage('Trabajo actualizado exitosamente');

      // Recargar datos
      await loadJob();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error actualizando trabajo:', { error, jobId });
      setErrorMessage(error instanceof Error ? error.message : 'Error al actualizar el trabajo');
    } finally {
      setUpdating(false);
    }
  };

  const startJob = async () => {
    setStatus('IN_PROGRESS');
    setProgress(10); // Iniciar con 10% de progreso
    // La actualización automática se hará por el useEffect
  };

  const pauseJob = async () => {
    setStatus('ACTIVE'); // Cambiar a activo pero no en progreso
    // La actualización automática se hará por el useEffect
  };

  const completeJob = async () => {
    setStatus('COMPLETED');
    setProgress(100);
    // La actualización automática se hará por el useEffect
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      active: { label: 'Activo', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En Progreso', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completado', color: 'bg-purple-100 text-purple-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };

    const statusConfig = config[status.toLowerCase() as keyof typeof config] || config.pending;

    return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout user={user} title="Detalle del Trabajo">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!job) {
    return (
      <UnifiedDashboardLayout user={user} title="Detalle del Trabajo">
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Trabajo no encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">{errorMessage}</p>
          <div className="mt-6">
            <Button onClick={() => router.push('/provider/dashboard')}>Volver al Dashboard</Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout user={user} title="Detalle del Trabajo">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/provider/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-gray-600">{job.serviceType}</p>
          </div>
          {getStatusBadge(job.status)}
        </div>

        {/* Mensajes de éxito y error */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Detalles del trabajo */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Trabajo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Cliente</Label>
                    <p className="text-gray-900">{job.clientName}</p>
                    <p className="text-sm text-gray-500">{job.clientEmail}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Precio</Label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(job.price)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fecha Programada</Label>
                    <p className="text-gray-900">
                      {new Date(job.scheduledDate).toLocaleDateString('es-CL')}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Estado</Label>
                    <div className="mt-1">{getStatusBadge(job.status)}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Descripción</Label>
                  <p className="text-gray-900 mt-1">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Gestión de progreso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Gestión del Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Barra de progreso */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Progreso del Trabajo</Label>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>

                {/* Controles de progreso */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={startJob}
                    disabled={status === 'IN_PROGRESS'}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Iniciar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={pauseJob}
                    disabled={status !== 'IN_PROGRESS'}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pausar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={completeJob}
                    disabled={progress < 100}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completar
                  </Button>
                </div>

                {/* Estado */}
                <div>
                  <Label htmlFor="status">Estado del Trabajo</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                      <SelectItem value="COMPLETED">Completado</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notas */}
                <div>
                  <Label htmlFor="notes">Notas del Trabajo</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Agregar notas sobre el progreso del trabajo..."
                    rows={3}
                  />
                </div>

                {/* Botón de actualizar */}
                <Button onClick={updateJobProgress} disabled={updating} className="w-full">
                  {updating ? 'Actualizando...' : 'Actualizar Trabajo'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Información del cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{job.clientName}</p>
                  <p className="text-sm text-gray-600">{job.clientEmail}</p>
                  {job.clientPhone && <p className="text-sm text-gray-600">{job.clientPhone}</p>}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    // Aquí iría la lógica para contactar al cliente
                    alert('Función de contacto próximamente disponible');
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contactar Cliente
                </Button>
              </CardContent>
            </Card>

            {/* Acciones rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/provider/dashboard')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Todos los Trabajos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
