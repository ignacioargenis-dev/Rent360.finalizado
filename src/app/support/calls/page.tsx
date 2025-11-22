'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  User,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';

interface Call {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  type: 'incoming' | 'outgoing';
  status: 'ringing' | 'active' | 'ended' | 'missed';
  duration?: number;
  startTime: string;
  endTime?: string;
  notes?: string;
  ticketId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'support' | 'billing' | 'technical' | 'general';
}

interface CallStats {
  totalCalls: number;
  activeCalls: number;
  missedCalls: number;
  averageDuration: number;
  totalDuration: number;
}

export default function SupportCallsPage() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState<CallStats>({
    totalCalls: 0,
    activeCalls: 0,
    missedCalls: 0,
    averageDuration: 0,
    totalDuration: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  useEffect(() => {
    loadCallsData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive && currentCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive, currentCall]);

  const loadCallsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Intentar obtener datos reales de la API
      try {
        const params = new URLSearchParams();
        if (filterStatus !== 'all') {
          params.append('status', filterStatus);
        }
        if (filterType !== 'all') {
          params.append('type', filterType);
        }

        const response = await fetch(`/api/support/calls?${params}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Error al cargar llamadas: ${response.status}`);
        }

        const data = await response.json();

        setCalls(data.calls || []);
        setStats(
          data.stats || {
            totalCalls: 0,
            activeCalls: 0,
            missedCalls: 0,
            answeredCalls: 0,
            totalDuration: 0,
            averageDuration: 0,
          }
        );

        logger.info('Llamadas cargadas desde API:', { count: data.calls?.length || 0 });
        return;
      } catch (apiError) {
        console.warn('API no disponible, usando datos simulados:', apiError);
      }

      // Fallback a datos simulados si la API no está disponible
      const mockCalls: Call[] = [
        {
          id: '1',
          clientName: 'María González',
          clientPhone: '+56 9 1234 5678',
          type: 'incoming',
          status: 'ended',
          duration: 180,
          startTime: '2024-01-15T11:15:00Z',
          endTime: '2024-01-15T11:18:00Z',
          notes: 'Seguimiento de ticket técnico',
          ticketId: 'TKT-002',
          priority: 'high',
          category: 'technical',
        },
        {
          id: '3',
          clientName: 'Ana Silva',
          clientPhone: '+56 9 5555 1234',
          clientEmail: 'ana@example.com',
          type: 'incoming',
          status: 'missed',
          startTime: '2024-01-15T12:00:00Z',
          priority: 'low',
          category: 'general',
        },
        {
          id: '4',
          clientName: 'Roberto Torres',
          clientPhone: '+56 9 9999 8888',
          clientEmail: 'roberto@example.com',
          type: 'incoming',
          status: 'active',
          startTime: '2024-01-15T14:30:00Z',
          priority: 'urgent',
          category: 'support',
        },
      ];

      setCalls(mockCalls);

      // Calcular estadísticas
      const totalCalls = mockCalls.length;
      const activeCalls = mockCalls.filter(c => c.status === 'active').length;
      const missedCalls = mockCalls.filter(c => c.status === 'missed').length;
      const totalDuration = mockCalls
        .filter(c => c.duration)
        .reduce((sum, c) => sum + (c.duration || 0), 0);
      const averageDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

      setStats({
        totalCalls,
        activeCalls,
        missedCalls,
        averageDuration,
        totalDuration,
      });

      logger.debug('Datos de llamadas cargados', {
        totalCalls,
        activeCalls,
        missedCalls,
      });
    } catch (error) {
      logger.error('Error loading calls data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos de llamadas');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = (call: Call) => {
    setCurrentCall(call);
    setIsCallActive(true);
    setCallDuration(0);
    logger.info('Llamada iniciada', { callId: call.id, clientName: call.clientName });
  };

  const handleEndCall = () => {
    if (currentCall) {
      logger.info('Llamada finalizada', {
        callId: currentCall.id,
        duration: callDuration,
        clientName: currentCall.clientName,
      });
    }
    setIsCallActive(false);
    setCurrentCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeakerOn(false);
  };

  const handleAnswerCall = (call: Call) => {
    setCurrentCall(call);
    setIsCallActive(true);
    setCallDuration(0);
    logger.info('Llamada contestada', { callId: call.id, clientName: call.clientName });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ringing: { label: 'Sonando', color: 'bg-yellow-100 text-yellow-800' },
      active: { label: 'Activa', color: 'bg-green-100 text-green-800' },
      ended: { label: 'Finalizada', color: 'bg-gray-100 text-gray-800' },
      missed: { label: 'Perdida', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ended;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-blue-100 text-blue-800' },
      medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredCalls = calls.filter(call => {
    const matchesSearch =
      call.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.clientPhone.includes(searchTerm) ||
      call.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || call.status === filterStatus;
    const matchesType = filterType === 'all' || call.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <UnifiedDashboardLayout
        user={user}
        title="Centro de Llamadas"
        subtitle="Sistema de atención telefónica"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando sistema de llamadas...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Centro de Llamadas"
      subtitle="Sistema de atención telefónica"
    >
      <div className="h-full flex flex-col p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Llamadas</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalls}</div>
              <p className="text-xs text-muted-foreground">Hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Llamadas Activas</CardTitle>
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCalls}</div>
              <p className="text-xs text-muted-foreground">En curso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Llamadas Perdidas</CardTitle>
              <PhoneOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.missedCalls}</div>
              <p className="text-xs text-muted-foreground">Sin contestar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(Math.round(stats.averageDuration))}
              </div>
              <p className="text-xs text-muted-foreground">Por llamada</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Call Panel */}
        {isCallActive && currentCall && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <PhoneCall className="w-5 h-5" />
                Llamada Activa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-900">{currentCall.clientName}</h3>
                  <p className="text-green-700">{currentCall.clientPhone}</p>
                  <p className="text-sm text-green-600">Duración: {formatDuration(callDuration)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className={isMuted ? 'bg-red-100 border-red-300' : ''}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={isSpeakerOn ? 'bg-blue-100 border-blue-300' : ''}
                  >
                    {isSpeakerOn ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="destructive" size="icon" onClick={handleEndCall}>
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="ended">Finalizadas</SelectItem>
              <SelectItem value="missed">Perdidas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="incoming">Entrantes</SelectItem>
              <SelectItem value="outgoing">Salientes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calls List */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Llamadas ({filteredCalls.length})</CardTitle>
              <CardDescription>Gestiona todas las llamadas del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCalls.map(call => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{call.clientName}</h3>
                        <p className="text-sm text-gray-600">{call.clientPhone}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(call.startTime)} •{' '}
                          {call.type === 'incoming' ? 'Entrante' : 'Saliente'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {getStatusBadge(call.status)}
                        {getPriorityBadge(call.priority)}
                        {call.duration && (
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDuration(call.duration)}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {call.status === 'ringing' && (
                          <Button
                            size="sm"
                            onClick={() => handleAnswerCall(call)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <PhoneCall className="w-4 h-4 mr-1" />
                            Contestar
                          </Button>
                        )}
                        {call.status === 'ended' && (
                          <Button size="sm" variant="outline" onClick={() => handleStartCall(call)}>
                            <Phone className="w-4 h-4 mr-1" />
                            Llamar
                          </Button>
                        )}
                        {call.status === 'missed' && (
                          <Button size="sm" variant="outline" onClick={() => handleStartCall(call)}>
                            <Phone className="w-4 h-4 mr-1" />
                            Devolver
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredCalls.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Phone className="w-12 h-12 mx-auto mb-4" />
                    <p>No hay llamadas que coincidan con los filtros.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
