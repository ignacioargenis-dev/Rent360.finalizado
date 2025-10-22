'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Flag,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  MessageSquare,
  Eye,
  Shield,
} from 'lucide-react';
import { logger } from '@/lib/logger-minimal';

interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description: string;
  status: string;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  };
  reportedUser: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
    createdAt: string;
  };
  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminUserReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');

  const router = useRouter();

  useEffect(() => {
    loadUserData();
    loadReports();
  }, [statusFilter, reasonFilter]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        router.push('/auth/login');
        return;
      }

      const data = await response.json();

      if (data.success && data.user) {
        // Verificar que el usuario sea admin o support
        const userRole = data.user.role;

        if (userRole !== 'ADMIN' && userRole !== 'SUPPORT') {
          logger.warn('User without proper role tried to access admin user reports', {
            userId: data.user.id,
            role: userRole,
          });
          alert(`Acceso denegado. Tu rol actual es: ${userRole}. Se requiere ADMIN o SUPPORT.`);
          router.push('/');
          return;
        }
        setUser(data.user);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      logger.error('Error loading user data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      router.push('/auth/login');
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (reasonFilter) {
        params.append('reason', reasonFilter);
      }

      const response = await fetch(`/api/admin/user-reports?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar reportes');
      }

      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      logger.error('Error loading reports:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      setUpdatingReportId(reportId);
      const response = await fetch('/api/admin/user-reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reportId,
          status: newStatus,
          adminNotes: adminNotes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar reporte');
      }

      const data = await response.json();
      if (data.success) {
        // Actualizar la lista de reportes
        await loadReports();
        setShowDetailModal(false);
        setAdminNotes('');
      }
    } catch (error) {
      logger.error('Error updating report status:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al actualizar el reporte');
    } finally {
      setUpdatingReportId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendiente', variant: 'secondary' as const, icon: Clock },
      REVIEWED: { label: 'Revisado', variant: 'default' as const, icon: Eye },
      RESOLVED: { label: 'Resuelto', variant: 'default' as const, icon: CheckCircle },
      DISMISSED: { label: 'Desestimado', variant: 'outline' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getReasonLabel = (reason: string) => {
    const reasons: { [key: string]: string } = {
      spam: 'Spam',
      harassment: 'Acoso',
      inappropriate_content: 'Contenido inapropiado',
      scam: 'Estafa',
      fake_profile: 'Perfil falso',
      other: 'Otro',
    };
    return reasons[reason] || reason;
  };

  const openDetailModal = (report: UserReport) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || '');
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes de usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Reportes de Conducta de Usuarios"
      subtitle="Gestiona reportes de spam, acoso y otras conductas inapropiadas"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <Flag className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reportes de Conducta</h1>
              <p className="text-gray-600">
                {reports.length} reporte{reports.length !== 1 ? 's' : ''} en total
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filtrar por estado
                </label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900"
                >
                  <option value="">Todos los estados</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="REVIEWED">Revisado</option>
                  <option value="RESOLVED">Resuelto</option>
                  <option value="DISMISSED">Desestimado</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filtrar por motivo
                </label>
                <select
                  value={reasonFilter}
                  onChange={e => setReasonFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900"
                >
                  <option value="">Todos los motivos</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Acoso</option>
                  <option value="inappropriate_content">Contenido inapropiado</option>
                  <option value="scam">Estafa</option>
                  <option value="fake_profile">Perfil falso</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No hay reportes disponibles</p>
              <p className="text-gray-500 text-sm">
                Los reportes de conducta aparecerán aquí cuando los usuarios reporten a otros
                usuarios
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map(report => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Reported User */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={report.reportedUser.avatar || undefined} />
                          <AvatarFallback className="bg-red-100 text-red-600">
                            {report.reportedUser.name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">
                              {report.reportedUser.name}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {report.reportedUser.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {report.reportedUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-md p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-gray-900">
                            {getReasonLabel(report.reason)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{report.description}</p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Reportado por: {report.reporter.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.createdAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 md:w-48">
                      <div className="mb-2">{getStatusBadge(report.status)}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailModal(report)}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                      {report.status === 'PENDING' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleUpdateStatus(report.id, 'REVIEWED')}
                            disabled={updatingReportId === report.id}
                            className="w-full"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar Revisado
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
                            disabled={updatingReportId === report.id}
                            className="w-full"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Desestimar
                          </Button>
                        </>
                      )}
                      {report.status === 'REVIEWED' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
                          disabled={updatingReportId === report.id}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setShowDetailModal(false)}
        >
          <Card
            className="w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-600" />
                Detalle del Reporte
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Usuario Reportado */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Usuario Reportado</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedReport.reportedUser.avatar || undefined} />
                        <AvatarFallback className="bg-red-100 text-red-600">
                          {selectedReport.reportedUser.name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {selectedReport.reportedUser.name}
                        </p>
                        <p className="text-sm text-gray-600">{selectedReport.reportedUser.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{selectedReport.reportedUser.role}</Badge>
                      <Badge variant="secondary">
                        Usuario desde{' '}
                        {new Date(selectedReport.reportedUser.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Motivo y Descripción */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Motivo del Reporte</h3>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-gray-900">
                        {getReasonLabel(selectedReport.reason)}
                      </span>
                    </div>
                    <p className="text-gray-700">{selectedReport.description}</p>
                  </div>
                </div>

                {/* Reportador */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Reportado Por</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedReport.reporter.avatar || undefined} />
                        <AvatarFallback>
                          {selectedReport.reporter.name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{selectedReport.reporter.name}</p>
                        <p className="text-sm text-gray-600">{selectedReport.reporter.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Reportado el{' '}
                      {new Date(selectedReport.createdAt).toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {/* Estado y Revisor */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Estado</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="mb-2">{getStatusBadge(selectedReport.status)}</div>
                    {selectedReport.reviewer && (
                      <p className="text-sm text-gray-600">
                        Revisado por {selectedReport.reviewer.name} el{' '}
                        {selectedReport.reviewedAt &&
                          new Date(selectedReport.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notas del Admin */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Notas del Admin</h3>
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Agrega notas sobre la revisión de este reporte..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[100px] bg-white text-gray-900"
                  />
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1"
                  >
                    Cerrar
                  </Button>
                  {selectedReport.status === 'PENDING' && (
                    <>
                      <Button
                        variant="default"
                        onClick={() => handleUpdateStatus(selectedReport.id, 'REVIEWED')}
                        disabled={updatingReportId === selectedReport.id}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marcar Revisado
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedReport.id, 'DISMISSED')}
                        disabled={updatingReportId === selectedReport.id}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Desestimar
                      </Button>
                    </>
                  )}
                  {selectedReport.status === 'REVIEWED' && (
                    <Button
                      variant="default"
                      onClick={() => handleUpdateStatus(selectedReport.id, 'RESOLVED')}
                      disabled={updatingReportId === selectedReport.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </UnifiedDashboardLayout>
  );
}
