'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Wrench,
  Search,
  Filter,
  Plus,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building,
  FileText,
  TrendingUp,
  BarChart3,
  Settings,
  Users,
  Phone,
  Mail,
  Star,
  Eye,
  MessageSquare,
  Edit,
  Trash2,
  Shield,
  Activity,
  MapPin,
  Briefcase,
  Award,
} from 'lucide-react';

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  specialties: string[];
  rating: number;
  totalRatings: number;
  completedJobs: number;
  totalEarnings: number;
  status: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE' | 'SUSPENDED';
  verified: boolean;
  responseTime: number;
  hourlyRate?: number;
  address?: string;
  city?: string;
  region?: string;
  description?: string;
  profileImage?: string;
  documents: string[];
  joinDate: string;
  lastActive: string;
}

interface ContractorStats {
  total: number;
  averageRating: number;
  totalCompletedJobs: number;
  totalEarnings: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);

  const [stats, setStats] = useState<ContractorStats>({
    total: 0,
    averageRating: 0,
    totalCompletedJobs: 0,
    totalEarnings: 0,
  });

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('');

  const [specialtyFilter, setSpecialtyFilter] = useState('');

  const [verifiedFilter, setVerifiedFilter] = useState('');

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);

  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  // Form state for create/edit

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    specialties: [] as string[],
    hourlyRate: '',
    address: '',
    city: '',
    region: '',
    description: '',
    verified: false,
  });

  useEffect(() => {
    fetchContractors();
  }, [pagination.page, searchTerm, statusFilter, specialtyFilter, verifiedFilter]);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (specialtyFilter) {
        params.append('specialty', specialtyFilter);
      }
      if (verifiedFilter) {
        params.append('verified', verifiedFilter);
      }

      const response = await fetch(`/api/contractors?${params}`);
      const data = await response.json();

      if (response.ok) {
        setContractors(data.contractors);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      logger.error('Error fetching contractors:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContractor = async () => {
    try {
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        }),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        resetForm();
        fetchContractors();
      }
    } catch (error) {
      logger.error('Error creating contractor:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleUpdateContractor = async () => {
    if (!selectedContractor) {
      return;
    }

    try {
      const response = await fetch(`/api/contractors/${selectedContractor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        }),
      });

      if (response.ok) {
        setShowEditDialog(false);
        resetForm();
        fetchContractors();
      }
    } catch (error) {
      logger.error('Error updating contractor:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleDeleteContractor = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este prestador de servicios?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contractors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchContractors();
      }
    } catch (error) {
      logger.error('Error deleting contractor:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      specialties: [],
      hourlyRate: '',
      address: '',
      city: '',
      region: '',
      description: '',
      verified: false,
    });
    setSelectedContractor(null);
  };

  const openEditDialog = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setFormData({
      name: contractor.name,
      email: contractor.email,
      phone: contractor.phone,
      specialty: contractor.specialty,
      specialties: contractor.specialties,
      hourlyRate: contractor.hourlyRate?.toString() || '',
      address: contractor.address || '',
      city: contractor.city || '',
      region: contractor.region || '',
      description: contractor.description || '',
      verified: contractor.verified,
    });
    setShowEditDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'BUSY':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNAVAILABLE':
        return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  return (
    <UnifiedDashboardLayout
      title="Gestión de Contratistas"
      subtitle="Administra todos los contratistas del sistema"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Prestadores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Prestadores registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">De 5.0 estrellas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trabajos Completados</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCompletedJobs}</div>
                <p className="text-xs text-muted-foreground">Total de trabajos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalEarnings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">En ganancias</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Prestadores de Servicios</CardTitle>
                  <CardDescription>
                    Gestiona los prestadores de servicios de mantenimiento
                  </CardDescription>
                </div>

                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Prestador
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Prestador de Servicios</DialogTitle>
                      <DialogDescription>
                        Completa la información del prestador de servicios
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nombre *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Nombre completo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@ejemplo.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Teléfono *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+56 9 1234 5678"
                          />
                        </div>
                        <div>
                          <Label htmlFor="specialty">Especialidad Principal *</Label>
                          <Input
                            id="specialty"
                            value={formData.specialty}
                            onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                            placeholder="Ej: Plomería, Electricidad"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hourlyRate">Tarifa por Hora</Label>
                          <Input
                            id="hourlyRate"
                            type="number"
                            value={formData.hourlyRate}
                            onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })}
                            placeholder="25000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">Ciudad</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Santiago"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Descripción del prestador de servicios..."
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="verified"
                          checked={formData.verified}
                          onChange={e => setFormData({ ...formData, verified: e.target.checked })}
                        />
                        <Label htmlFor="verified">Verificado</Label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateContractor}>Crear Prestador</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por nombre, email o especialidad..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="AVAILABLE">Disponible</SelectItem>
                    <SelectItem value="BUSY">Ocupado</SelectItem>
                    <SelectItem value="UNAVAILABLE">No disponible</SelectItem>
                    <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="Plomería">Plomería</SelectItem>
                    <SelectItem value="Electricidad">Electricidad</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Carpintería">Carpintería</SelectItem>
                    <SelectItem value="Pintura">Pintura</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Verificación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="true">Verificados</SelectItem>
                    <SelectItem value="false">No verificados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contractors List */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {contractors.map(contractor => (
                    <Card key={contractor.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {contractor.name}
                                {contractor.verified && (
                                  <Shield className="h-4 w-4 text-green-600" />
                                )}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {contractor.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {contractor.phone}
                                </span>
                              </CardDescription>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(contractor.status)}>
                              {contractor.status === 'AVAILABLE' && 'Disponible'}
                              {contractor.status === 'BUSY' && 'Ocupado'}
                              {contractor.status === 'UNAVAILABLE' && 'No disponible'}
                              {contractor.status === 'SUSPENDED' && 'Suspendido'}
                            </Badge>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(contractor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteContractor(contractor.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <span className="text-sm font-medium">Especialidad:</span>
                            <p className="text-sm">{contractor.specialty}</p>
                          </div>

                          <div>
                            <span className="text-sm font-medium">Calificación:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-lg font-bold">
                                {contractor.rating.toFixed(1)}
                              </span>
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm text-muted-foreground">
                                ({contractor.totalRatings} reseñas)
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm font-medium">Trabajos Completados:</span>
                            <p className="text-lg font-bold">{contractor.completedJobs}</p>
                          </div>

                          <div>
                            <span className="text-sm font-medium">Ganancias Totales:</span>
                            <p className="text-lg font-bold">
                              ${contractor.totalEarnings.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <span className="text-sm font-medium">Especialidades:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contractor.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {contractor.description && (
                          <div className="mt-4">
                            <span className="text-sm font-medium">Descripción:</span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {contractor.description}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Miembro desde: {formatDate(contractor.joinDate)}</span>
                            <span>Última actividad: {formatDate(contractor.lastActive)}</span>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Perfil
                            </Button>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Contactar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    >
                      Anterior
                    </Button>

                    <span className="flex items-center px-4">
                      Página {pagination.page} de {pagination.pages}
                    </span>

                    <Button
                      variant="outline"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Prestador de Servicios</DialogTitle>
                <DialogDescription>
                  Modifica la información del prestador de servicios
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nombre *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Teléfono *</Label>
                    <Input
                      id="edit-phone"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-specialty">Especialidad Principal *</Label>
                    <Input
                      id="edit-specialty"
                      value={formData.specialty}
                      onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="Ej: Plomería, Electricidad"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-hourlyRate">Tarifa por Hora</Label>
                    <Input
                      id="edit-hourlyRate"
                      type="number"
                      value={formData.hourlyRate}
                      onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })}
                      placeholder="25000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-city">Ciudad</Label>
                    <Input
                      id="edit-city"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Santiago"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-region">Región</Label>
                    <Input
                      id="edit-region"
                      value={formData.region}
                      onChange={e => setFormData({ ...formData, region: e.target.value })}
                      placeholder="Metropolitana"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del prestador de servicios..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-verified"
                    checked={formData.verified}
                    onChange={e => setFormData({ ...formData, verified: e.target.checked })}
                  />
                  <Label htmlFor="edit-verified">Verificado</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateContractor}>Actualizar Prestador</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
