'use client';

// Build fix - force update

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  BarChart3,
  Clock,
  MessageSquare,
  TrendingUp,
  Users,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  Star,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

interface SupportStats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  avgResponseTime: string;
  avgResolutionTime: string;
  customerSatisfaction: number;
  ticketsByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  ticketsByStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
}

interface AgentPerformance {
  id: string;
  name: string;
  ticketsResolved: number;
  avgResponseTime: string;
  avgResolutionTime: string;
  satisfaction: number;
  status: 'online' | 'offline' | 'busy';
}

interface ReportFilters {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  agent: string;
  priority: string;
}

export default function SupportReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<SupportStats>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    avgResponseTime: '',
    avgResolutionTime: '',
    customerSatisfaction: 0,
    ticketsByPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    },
    ticketsByStatus: {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    },
  });
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    period: 'month',
    agent: 'all',
    priority: 'all',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const loadReportsData = async () => {
      try {
        // Mock support stats
        const mockStats: SupportStats = {
          totalTickets: 1247,
          openTickets: 89,
          closedTickets: 1158,
          avgResponseTime: '2h 15m',
          avgResolutionTime: '18h 30m',
          customerSatisfaction: 4.7,
          ticketsByPriority: {
            low: 312,
            medium: 587,
            high: 298,
            urgent: 50,
          },
          ticketsByStatus: {
            open: 89,
            inProgress: 156,
            resolved: 234,
            closed: 768,
          },
        };

        // Mock agents performance
        const mockAgents: AgentPerformance[] = [
          {
            id: '1',
            name: 'María González',
            ticketsResolved: 145,
            avgResponseTime: '1h 45m',
            avgResolutionTime: '16h 20m',
            satisfaction: 4.9,
            status: 'online',
          },
          {
            id: '2',
            name: 'Carlos Rodríguez',
            ticketsResolved: 132,
            avgResponseTime: '2h 10m',
            avgResolutionTime: '19h 15m',
            satisfaction: 4.6,
            status: 'busy',
          },
          {
            id: '3',
            name: 'Ana López',
            ticketsResolved: 98,
            avgResponseTime: '2h 30m',
            avgResolutionTime: '21h 45m',
            satisfaction: 4.4,
            status: 'online',
          },
          {
            id: '4',
            name: 'Pedro Martínez',
            ticketsResolved: 87,
            avgResponseTime: '3h 5m',
            avgResolutionTime: '24h 10m',
            satisfaction: 4.2,
            status: 'offline',
          },
        ];

        setStats(mockStats);
        setAgents(mockAgents);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading reports data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadReportsData();
  }, []);

  const handleExportReport = async () => {
    alert('Generando y descargando reporte...');
  };

  const handleRefreshData = async () => {
    setLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'busy':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'offline':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">En línea</Badge>;
      case 'busy':
        return <Badge className="bg-orange-100 text-orange-800">Ocupado</Badge>;
      case 'offline':
        return <Badge className="bg-gray-100 text-gray-800">Fuera de línea</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes de soporte...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Reportes de Soporte"
      subtitle="Análisis y estadísticas del equipo de soporte"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Soporte</h1>
            <p className="text-gray-600">Análisis y estadísticas del equipo de soporte</p>
          </div>
          <div className="flex gap-2">
            <Select
              value={filters.period}
              onValueChange={value =>
                setFilters(prev => ({ ...prev, period: value as ReportFilters['period'] }))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mes</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Año</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={handleRefreshData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button size="sm" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                  <p className="text-xs text-green-600">+12% vs mes anterior</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tickets Abiertos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                  <p className="text-xs text-orange-600">
                    {((stats.openTickets / stats.totalTickets) * 100).toFixed(1)}% del total
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo Respuesta</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}</p>
                  <p className="text-xs text-green-600">-15 min vs promedio</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfacción</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.customerSatisfaction}/5</p>
                  <p className="text-xs text-green-600">+0.2 vs mes anterior</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Tickets by Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets por Prioridad</CardTitle>
              <CardDescription>Distribución de tickets según urgencia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.ticketsByPriority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${priority === 'urgent' ? 'bg-red-500' : priority === 'high' ? 'bg-orange-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                      ></div>
                      <span className="capitalize text-sm font-medium">{priority}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${priority === 'urgent' ? 'bg-red-500' : priority === 'high' ? 'bg-orange-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${(count / stats.totalTickets) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tickets by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets por Estado</CardTitle>
              <CardDescription>Estado actual de todos los tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.ticketsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${status === 'open' ? 'bg-red-500' : status === 'inProgress' ? 'bg-yellow-500' : status === 'resolved' ? 'bg-blue-500' : 'bg-green-500'}`}
                      ></div>
                      <span className="text-sm font-medium">
                        {status === 'open'
                          ? 'Abiertos'
                          : status === 'inProgress'
                            ? 'En Progreso'
                            : status === 'resolved'
                              ? 'Resueltos'
                              : 'Cerrados'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${status === 'open' ? 'bg-red-500' : status === 'inProgress' ? 'bg-yellow-500' : status === 'resolved' ? 'bg-blue-500' : 'bg-green-500'}`}
                          style={{ width: `${(count / stats.totalTickets) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento de Agentes</CardTitle>
            <CardDescription>Métricas de rendimiento por agente de soporte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agents.map(agent => (
                <Card key={agent.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{agent.name}</h4>
                          {getStatusBadge(agent.status)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Tickets resueltos</p>
                        <p className="text-lg font-semibold">{agent.ticketsResolved}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-600">Tiempo Respuesta</p>
                        <p className="text-sm font-medium">{agent.avgResponseTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Tiempo Resolución</p>
                        <p className="text-sm font-medium">{agent.avgResolutionTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Satisfacción</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{agent.satisfaction}/5</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
