'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  Star,
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
  clientId?: string; // ID del usuario cliente
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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showClientRatingModal, setShowClientRatingModal] = useState(false);
  const [clientRatingData, setClientRatingData] = useState({
    overallRating: 5,
    communicationRating: 5,
    reliabilityRating: 5,
    professionalismRating: 5,
    comment: '',
  });

  useEffect(() => {
    loadJob();
  }, [jobId]);

  // Función para guardar cambios silenciosamente (sin mensajes ni recargas)
  const saveChangesSilently = async () => {
    if (job && !loading && initialLoadComplete) {
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

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al guardar cambios');
        }

        // Actualizar el estado local del job sin recargar
        setJob(prev =>
          prev
            ? {
                ...prev,
                status: status || prev.status,
                progress: progress,
                notes: notes || prev.notes || '',
              }
            : null
        );
      } catch (error) {
        logger.error('Error guardando cambios silenciosamente:', { error });
        // Solo mostrar error en consola, no en UI para mantenerlo silencioso
      }
    }
  };

  // Función para actualizar con mensajes y recarga (para el botón manual)
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
        setInitialLoadComplete(true);
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

  const startJob = async () => {
    setStatus('IN_PROGRESS');
    setProgress(10); // Iniciar con 10% de progreso
    // Guardar automáticamente después de cambiar el estado
    setTimeout(() => saveChangesSilently(), 100);
  };

  const pauseJob = async () => {
    setStatus('ACTIVE'); // Cambiar a activo pero no en progreso
    // Guardar automáticamente después de cambiar el estado
    setTimeout(() => saveChangesSilently(), 100);
  };

  const completeJob = async () => {
    setStatus('COMPLETED');
    setProgress(100);
    // Guardar automáticamente después de cambiar el estado
    setTimeout(() => saveChangesSilently(), 100);
  };

  const handleClientRating = async () => {
    if (!job || !user) {
      setErrorMessage('Información del trabajo o usuario no disponible');
      return;
    }

    if (!clientRatingData.comment.trim()) {
      setErrorMessage('Por favor escribe un comentario para la calificación');
      return;
    }

    setUpdating(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          contextType: 'MAINTENANCE',
          contextId: jobId,
          toUserId: job.clientId, // Cliente siendo calificado
          overallRating: clientRatingData.overallRating,
          communicationRating: clientRatingData.communicationRating,
          reliabilityRating: clientRatingData.reliabilityRating,
          professionalismRating: clientRatingData.professionalismRating,
          comment: clientRatingData.comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si es un error de calificación duplicada, mostrar mensaje más claro
        const errorMessage = data.error?.message || data.error || 'Error al enviar la calificación';
        if (typeof errorMessage === 'string' && errorMessage.includes('Ya has calificado')) {
          throw new Error('Ya has calificado a este cliente por este trabajo anteriormente.');
        }
        throw new Error(
          typeof errorMessage === 'string' ? errorMessage : 'Error al enviar la calificación'
        );
      }

      logger.info('Calificación del cliente enviada exitosamente:', {
        jobId,
        fromUserId: user.id,
        toUserId: job.clientId,
        overallRating: clientRatingData.overallRating,
      });

      setSuccessMessage(
        '¡Gracias por calificar a tu cliente! Tu feedback ayuda a mejorar la plataforma.'
      );
      setShowClientRatingModal(false);

      // Resetear el formulario
      setClientRatingData({
        overallRating: 5,
        communicationRating: 5,
        reliabilityRating: 5,
        professionalismRating: 5,
        comment: '',
      });

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      logger.error('Error enviando calificación del cliente:', { error, jobId });
      setErrorMessage(
        error instanceof Error ? error.message : 'Error inesperado al enviar la calificación'
      );
    } finally {
      setUpdating(false);
    }
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
                {/* Controles de progreso */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={startJob}
                    disabled={status === 'IN_PROGRESS' || status === 'COMPLETED'}
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
                    disabled={status === 'COMPLETED'}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completar
                  </Button>
                </div>

                {/* Estado */}
                <div>
                  <Label htmlFor="status">Estado del Trabajo</Label>
                  <Select
                    value={status}
                    onValueChange={newStatus => {
                      setStatus(newStatus);
                      // Si se completa, establecer progreso a 100
                      if (newStatus === 'COMPLETED') {
                        setProgress(100);
                      }
                      // Guardar automáticamente cuando cambia el estado
                      setTimeout(() => saveChangesSilently(), 100);
                    }}
                  >
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

                {/* Progreso - Solo una barra de progreso */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="progress">Progreso del Trabajo</Label>
                    <span className="text-sm text-gray-600 font-medium">{progress}%</span>
                  </div>
                  <Slider
                    id="progress"
                    min={0}
                    max={100}
                    step={5}
                    value={[progress]}
                    onValueChange={value => {
                      const newProgress = value[0] ?? 0;
                      setProgress(newProgress);
                      // Si llega a 100%, cambiar estado a COMPLETED
                      if (newProgress === 100 && status !== 'COMPLETED') {
                        setStatus('COMPLETED');
                      }
                      // Guardar automáticamente cuando cambia el progreso
                      setTimeout(() => saveChangesSilently(), 300);
                    }}
                    className="w-full"
                    disabled={status === 'COMPLETED'}
                  />
                  <Progress value={progress} className="w-full h-2 mt-2" />
                </div>

                {/* Notas */}
                <div>
                  <Label htmlFor="notes">Notas del Trabajo</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onBlur={() => saveChangesSilently()} // Guardar cuando pierde el foco
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

                {/* Botón para calificar cliente (solo cuando trabajo completado) */}
                {(job.status === 'COMPLETED' || job.status === 'completed') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    onClick={() => setShowClientRatingModal(true)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Calificar Cliente
                  </Button>
                )}
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

      {/* Modal de Calificación del Cliente */}
      <Dialog open={showClientRatingModal} onOpenChange={setShowClientRatingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Calificar Cliente
            </DialogTitle>
            <DialogDescription>
              Tu opinión sobre {job?.clientName} nos ayuda a mejorar la calidad de nuestros
              servicios. ¿Cómo calificarías la experiencia trabajando con este cliente?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Calificación General */}
            <div>
              <Label>Calificación General</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setClientRatingData(prev => ({ ...prev, overallRating: star }))}
                    className="text-2xl focus:outline-none hover:scale-110 transition-transform"
                  >
                    {star <= clientRatingData.overallRating ? '⭐' : '☆'}
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {clientRatingData.overallRating} de 5 estrellas
                </span>
              </div>
            </div>

            {/* Comunicación */}
            <div>
              <Label>Comunicación</Label>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setClientRatingData(prev => ({ ...prev, communicationRating: star }))
                    }
                    className="text-xl focus:outline-none hover:scale-110 transition-transform"
                  >
                    {star <= clientRatingData.communicationRating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            {/* Confiabilidad */}
            <div>
              <Label>Confiabilidad (pagos, puntualidad)</Label>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setClientRatingData(prev => ({ ...prev, reliabilityRating: star }))
                    }
                    className="text-xl focus:outline-none hover:scale-110 transition-transform"
                  >
                    {star <= clientRatingData.reliabilityRating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            {/* Profesionalismo */}
            <div>
              <Label>Profesionalismo</Label>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setClientRatingData(prev => ({ ...prev, professionalismRating: star }))
                    }
                    className="text-xl focus:outline-none hover:scale-110 transition-transform"
                  >
                    {star <= clientRatingData.professionalismRating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            {/* Comentario */}
            <div>
              <Label htmlFor="client-rating-comment">Comentario</Label>
              <Textarea
                id="client-rating-comment"
                className="mt-1"
                rows={4}
                placeholder="Comparte tu experiencia trabajando con este cliente..."
                value={clientRatingData.comment}
                onChange={e => setClientRatingData(prev => ({ ...prev, comment: e.target.value }))}
              />
            </div>

            {/* Mensajes de error */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowClientRatingModal(false)}
                disabled={updating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleClientRating}
                disabled={updating || !clientRatingData.comment.trim()}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Star className="w-4 h-4 mr-2" />
                )}
                {updating ? 'Enviando...' : 'Enviar Calificación'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}
