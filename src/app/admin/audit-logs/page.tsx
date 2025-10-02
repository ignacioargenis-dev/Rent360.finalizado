'use client';


import React from 'react';
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  UserIcon,
  Shield,
  Database,
  Settings,
  AlertTriangle,
  CheckCircle,
  Eye,
  Activity,
  Clock,
  MapPin,
  Smartphone, Building, DollarSign, Info
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';


interface AuditLog {
  id: string;
  action: string;
  category: 'user' | 'property' | 'contract' | 'payment' | 'system' | 'security';
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  description: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  location: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'success' | 'failed' | 'pending';
  details?: any;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  failedAttempts: number;
  securityEvents: number;
  userActions: number;
  systemActions: number;
}

export default function AdminAuditLogs() {

  const [user, setUser] = useState<User | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    todayLogs: 0,
    failedAttempts: 0,
    securityEvents: 0,
    userActions: 0,
    systemActions: 0,
  });

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('all');

  const [searchTerm, setSearchTerm] = useState('');

  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    const loadAuditLogs = async () => {
      try {
        // Obtener logs reales de la API
        const response = await fetch(`/api/audit-logs?page=1&limit=50&startDate=${dateRange === '7d' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10) : ''}`);
        if (!response.ok) {
          throw new Error('Error al obtener logs de auditoría');
        }

        const data = await response.json();

        // Convertir formato de API al formato esperado por el componente
        const formattedLogs: AuditLog[] = data.data.map((log: any) => ({
          id: log.id,
          action: log.action,
          category: log.category,
          userId: log.userId,
          userName: log.userName,
          userEmail: log.userEmail,
          userRole: log.userRole,
          description: log.description,
          timestamp: log.timestamp,
          ipAddress: log.ipAddress,
          device: log.device,
          location: log.location,
          severity: log.severity,
          status: log.status,
        }));

        setAuditLogs(formattedLogs);

        // Calcular estadísticas de los logs reales
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const auditStats = formattedLogs.reduce((acc, log) => {
          acc.totalLogs++;

          const logDate = new Date(log.timestamp);
          if (logDate >= today) {
            acc.todayLogs++;
          }

          if (log.status === 'failed') {
            acc.failedAttempts++;
          }

          if (log.category === 'security') {
            acc.securityEvents++;
          }

          if (log.category === 'user' || log.category === 'property' || log.category === 'payment' || log.category === 'contract') {
            acc.userActions++;
          }

          if (log.category === 'system') {
            acc.systemActions++;
          }

          return acc;
        }, {
          totalLogs: 0,
          todayLogs: 0,
          failedAttempts: 0,
          securityEvents: 0,
          userActions: 0,
          systemActions: 0,
        } as AuditStats);

        setStats(auditStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading audit logs:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadAuditLogs();
  }, [dateRange]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user':
        return <UserIcon className="w-5 h-5" />;
      case 'property':
        return <Building className="w-5 h-5" />;
      case 'contract':
        return <FileText className="w-5 h-5" />;
      case 'payment':
        return <DollarSign className="w-5 h-5" />;
      case 'system':
        return <Database className="w-5 h-5" />;
      case 'security':
        return <Shield className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className={getStatusColor(status)}>Éxito</Badge>;
      case 'failed':
        return <Badge className={getStatusColor(status)}>Fallido</Badge>;
      case 'pending':
        return <Badge className={getStatusColor(status)}>Pendiente</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>;
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
return `Hace ${diffMins} minutos`;
}
    if (diffHours < 24) {
return `Hace ${diffHours} horas`;
}
    if (diffDays < 7) {
return `Hace ${diffDays} días`;
}
    
    return date.toLocaleDateString('es-CL');
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesFilter = filter === 'all' || log.category === filter || log.severity === filter || log.status === filter;
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando registros de auditoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Rent360 Admin</h2>
          </div>
        </div>
        <div className="flex-1">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Registros de Auditoría</h1>
            <p className="text-gray-600 mt-1">Monitorea todas las actividades del sistema</p>
            <div className="container mx-auto px-4 py-6">
              {/* Header with stats */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Registros de Auditoría</h1>
                  <p className="text-gray-600">Monitorea y analiza todas las actividades del sistema</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="24h">Últimas 24 horas</option>
                    <option value="7d">Últimos 7 días</option>
                    <option value="30d">Últimos 30 días</option>
                    <option value="90d">Últimos 90 días</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats.totalLogs}</p>
                      <p className="text-xs text-gray-600">Total Registros</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.todayLogs}</p>
                      <p className="text-xs text-gray-600">Hoy</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{stats.failedAttempts}</p>
                      <p className="text-xs text-gray-600">Intentos Fallidos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{stats.securityEvents}</p>
                      <p className="text-xs text-gray-600">Eventos Seguridad</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.userActions}</p>
                      <p className="text-xs text-gray-600">Acciones Usuario</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats.systemActions}</p>
                      <p className="text-xs text-gray-600">Acciones Sistema</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar registros..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">Todas las categorías</option>
                    <option value="user">Usuario</option>
                    <option value="property">Propiedad</option>
                    <option value="contract">Contrato</option>
                    <option value="payment">Pago</option>
                    <option value="system">Sistema</option>
                    <option value="security">Seguridad</option>
                  </select>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">Todas las severidades</option>
                    <option value="critical">Crítico</option>
                    <option value="error">Error</option>
                    <option value="warning">Advertencia</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>

              {/* Audit Logs List */}
              <div className="space-y-4">
                {filteredAuditLogs.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No se encontraron registros de auditoría</p>
                        <p className="text-sm text-gray-400">Intenta ajustar tus filtros de búsqueda</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <Card
                      key={log.id}
                      className={`border-l-4 ${getSeverityColor(log.severity)}`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${getSeverityColor(log.severity)}`}>
                              {getCategoryIcon(log.category)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{log.action}</h3>
                                {getStatusBadge(log.status)}
                                {getSeverityBadge(log.severity)}
                              </div>
                              <p className="text-gray-600 text-sm mb-2">{log.description}</p>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <UserIcon className="w-3 h-3" />
                                  <span>{log.userName} ({log.userRole})</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatRelativeTime(log.timestamp)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{log.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Smartphone className="w-3 h-3" />
                                  <span>{log.device}</span>
                                </div>
                              </div>

                              <div className="mt-2 text-xs text-gray-400">
                                <span>IP: {log.ipAddress}</span>
                                <span className="mx-2">•</span>
                                <span>{formatDateTime(log.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


