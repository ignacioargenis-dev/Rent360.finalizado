'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
  FileText,
  User,
  MapPin,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { User as UserType } from '@/types';
import { logger } from '@/lib/logger-minimal';

interface KYCVerification {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRut: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  level: 'basic' | 'intermediate' | 'advanced';
  progress: number;
  scores: {
    identityScore: number;
    trustScore: number;
    riskScore: number;
  };
  documents: Array<{
    type: string;
    uploaded: boolean;
    verified: boolean;
    url?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function AdminKYCPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<KYCVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    avgIdentityScore: 0,
  });

  useEffect(() => {
    loadUserData();
    loadVerifications();
  }, []);

  useEffect(() => {
    filterVerifications();
  }, [verifications, searchQuery, statusFilter]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      logger.error('Error loading user:', error);
    }
  };

  const loadVerifications = async () => {
    try {
      setLoading(true);

      // Mock data para demostración
      // En producción, esto vendría de: /api/admin/kyc/verifications
      const mockData: KYCVerification[] = [
        {
          id: 'ver_001',
          userId: 'user_001',
          userName: 'Juan Pérez',
          userEmail: 'juan.perez@example.com',
          userRut: '12.345.678-9',
          status: 'pending',
          level: 'intermediate',
          progress: 75,
          scores: {
            identityScore: 85,
            trustScore: 78,
            riskScore: 22,
          },
          documents: [
            { type: 'cedula_identidad', uploaded: true, verified: true },
            { type: 'selfie', uploaded: true, verified: false },
            { type: 'proof_of_address', uploaded: false, verified: false },
          ],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ver_002',
          userId: 'user_002',
          userName: 'María González',
          userEmail: 'maria.gonzalez@example.com',
          userRut: '98.765.432-1',
          status: 'in_review',
          level: 'advanced',
          progress: 100,
          scores: {
            identityScore: 92,
            trustScore: 88,
            riskScore: 12,
          },
          documents: [
            { type: 'cedula_identidad', uploaded: true, verified: true },
            { type: 'selfie', uploaded: true, verified: true },
            { type: 'proof_of_address', uploaded: true, verified: true },
            { type: 'video_verification', uploaded: true, verified: true },
          ],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ver_003',
          userId: 'user_003',
          userName: 'Pedro Silva',
          userEmail: 'pedro.silva@example.com',
          userRut: '11.222.333-4',
          status: 'approved',
          level: 'basic',
          progress: 100,
          scores: {
            identityScore: 88,
            trustScore: 82,
            riskScore: 18,
          },
          documents: [{ type: 'cedula_identidad', uploaded: true, verified: true }],
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      setVerifications(mockData);

      // Calcular estadísticas
      const newStats = {
        total: mockData.length,
        pending: mockData.filter(v => v.status === 'pending').length,
        approved: mockData.filter(v => v.status === 'approved').length,
        rejected: mockData.filter(v => v.status === 'rejected').length,
        avgIdentityScore:
          mockData.reduce((sum, v) => sum + v.scores.identityScore, 0) / mockData.length,
      };
      setStats(newStats);
    } catch (error) {
      logger.error('Error loading verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVerifications = () => {
    let filtered = [...verifications];

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        v =>
          v.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.userRut.includes(searchQuery)
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    setFilteredVerifications(filtered);
  };

  const handleApprove = async (verificationId: string) => {
    try {
      // En producción: POST /api/admin/kyc/verifications/${verificationId}/approve
      logger.info('Aprobando verificación:', { verificationId });

      // Actualizar localmente
      setVerifications(prev =>
        prev.map(v => (v.id === verificationId ? { ...v, status: 'approved' as const } : v))
      );

      setShowDetailsDialog(false);
    } catch (error) {
      logger.error('Error aprobando verificación:', error);
    }
  };

  const handleReject = async (verificationId: string) => {
    try {
      // En producción: POST /api/admin/kyc/verifications/${verificationId}/reject
      logger.info('Rechazando verificación:', { verificationId });

      // Actualizar localmente
      setVerifications(prev =>
        prev.map(v => (v.id === verificationId ? { ...v, status: 'rejected' as const } : v))
      );

      setShowDetailsDialog(false);
    } catch (error) {
      logger.error('Error rechazando verificación:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'outline', icon: Clock, color: 'text-yellow-600' },
      in_review: { variant: 'secondary', icon: Eye, color: 'text-blue-600' },
      approved: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      rejected: { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className={`mr-1 h-3 w-3 ${config.color}`} />
        {status === 'pending'
          ? 'Pendiente'
          : status === 'in_review'
            ? 'En Revisión'
            : status === 'approved'
              ? 'Aprobado'
              : 'Rechazado'}
      </Badge>
    );
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-gray-100 text-gray-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={colors[level] || colors.basic}>
        {level === 'basic' ? 'Básico' : level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
      </Badge>
    );
  };

  return (
    <UnifiedDashboardLayout user={user}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Verificaciones KYC</h1>
            <p className="text-gray-500 mt-1">Gestión de verificaciones de identidad</p>
          </div>
          <Button onClick={loadVerifications} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Aprobados</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Rechazados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Score Promedio</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.avgIdentityScore.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, email o RUT..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  size="sm"
                >
                  Pendientes
                </Button>
                <Button
                  variant={statusFilter === 'in_review' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('in_review')}
                  size="sm"
                >
                  En Revisión
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('approved')}
                  size="sm"
                >
                  Aprobados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Verificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Verificaciones</CardTitle>
            <CardDescription>
              {filteredVerifications.length} verificación(es) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Score Identidad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerifications.map(verification => (
                  <TableRow key={verification.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{verification.userName}</p>
                        <p className="text-sm text-gray-500">{verification.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{verification.userRut}</TableCell>
                    <TableCell>{getLevelBadge(verification.level)}</TableCell>
                    <TableCell>{getStatusBadge(verification.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${verification.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{verification.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{verification.scores.identityScore}%</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(verification.createdAt).toLocaleDateString('es-CL')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVerification(verification);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {loading && (
              <div className="text-center py-8 text-gray-500">Cargando verificaciones...</div>
            )}

            {!loading && filteredVerifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">No se encontraron verificaciones</div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Detalles */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedVerification && (
              <>
                <DialogHeader>
                  <DialogTitle>Detalles de Verificación</DialogTitle>
                  <DialogDescription>
                    ID: {selectedVerification.id} | Usuario: {selectedVerification.userName}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Información del Usuario */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Información del Usuario</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nombre</p>
                        <p className="font-medium">{selectedVerification.userName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedVerification.userEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">RUT</p>
                        <p className="font-medium">{selectedVerification.userRut}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Nivel</p>
                        {getLevelBadge(selectedVerification.level)}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scores */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Scores de Verificación</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Identidad</p>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedVerification.scores.identityScore}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Confianza</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedVerification.scores.trustScore}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Riesgo</p>
                        <p className="text-2xl font-bold text-red-600">
                          {selectedVerification.scores.riskScore}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Documentos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Documentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedVerification.documents.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium">
                                  {doc.type.replace(/_/g, ' ').toUpperCase()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {doc.uploaded ? 'Subido' : 'No subido'} |{' '}
                                  {doc.verified ? 'Verificado' : 'Sin verificar'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.verified ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : doc.uploaded ? (
                                <Clock className="h-5 w-5 text-yellow-600" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-gray-400" />
                              )}
                              {doc.url && (
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Acciones */}
                  {selectedVerification.status !== 'approved' &&
                    selectedVerification.status !== 'rejected' && (
                      <div className="flex gap-4">
                        <Button
                          className="flex-1"
                          onClick={() => handleApprove(selectedVerification.id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aprobar Verificación
                        </Button>
                        <Button
                          className="flex-1"
                          variant="destructive"
                          onClick={() => handleReject(selectedVerification.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Rechazar Verificación
                        </Button>
                      </div>
                    )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
