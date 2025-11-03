'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Trophy,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Gift,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Target,
  BarChart3,
  Info,
} from 'lucide-react';

interface IncentiveRule {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'rating' | 'volume' | 'loyalty' | 'seasonal';
  category: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  criteria: {
    minVisits?: number;
    minRating?: number;
    minEarnings?: number;
    minCompletionRate?: number;
    consecutivePeriods?: number;
    rankingPosition?: number;
  };
  rewards: {
    bonusAmount?: number;
    bonusPercentage?: number;
    priorityBonus?: number;
    badge?: string;
    title?: string;
    features?: string[];
  };
  isActive: boolean;
  autoGrant: boolean;
  maxRecipients?: number;
  cooldownPeriod: number;
  validFrom: string;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalGranted: number;
    totalClaimed: number;
    totalExpired: number;
    recentGrants: number;
  };
}

export default function AdminIncentivesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<IncentiveRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<IncentiveRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<IncentiveRule | null>(null);
  const [editingRule, setEditingRule] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'performance' as 'performance' | 'rating' | 'volume' | 'loyalty' | 'seasonal',
    category: 'bronze' as 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond',
    criteria: {
      minVisits: undefined as number | undefined,
      minRating: undefined as number | undefined,
      minEarnings: undefined as number | undefined,
      minCompletionRate: undefined as number | undefined,
      consecutivePeriods: undefined as number | undefined,
      rankingPosition: undefined as number | undefined,
    },
    rewards: {
      bonusAmount: undefined as number | undefined,
      bonusPercentage: undefined as number | undefined,
      priorityBonus: undefined as number | undefined,
      badge: '',
      title: '',
      features: [] as string[],
    },
    isActive: true,
    autoGrant: true,
    maxRecipients: undefined as number | undefined,
    cooldownPeriod: 7,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: undefined as string | undefined,
  });

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    filterRules();
  }, [rules, searchQuery, typeFilter, categoryFilter, statusFilter]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/incentives', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar reglas de incentivos');
      }

      const result = await response.json();
      if (result.success) {
        setRules(result.rules || []);
        logger.info('Reglas de incentivos cargadas', { count: result.rules?.length || 0 });
      }
    } catch (error) {
      logger.error('Error cargando reglas de incentivos:', error);
      setErrorMessage('Error al cargar las reglas de incentivos');
    } finally {
      setLoading(false);
    }
  };

  const filterRules = () => {
    let filtered = [...rules];

    // Filtro por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        rule =>
          rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rule.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(rule => rule.type === typeFilter);
    }

    // Filtro por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(rule => rule.category === categoryFilter);
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rule => {
        if (statusFilter === 'active') {
          return rule.isActive;
        }
        if (statusFilter === 'inactive') {
          return !rule.isActive;
        }
        return true;
      });
    }

    setFilteredRules(filtered);
  };

  const handleCreateRule = async () => {
    try {
      setEditingRule(true);
      setErrorMessage('');

      // Validar datos mínimos
      if (!formData.name || !formData.description) {
        setErrorMessage('El nombre y la descripción son requeridos');
        setEditingRule(false);
        return;
      }

      // Preparar datos para enviar
      const payload = {
        ...formData,
        criteria: Object.fromEntries(
          Object.entries(formData.criteria).filter(([_, v]) => v !== undefined && v !== '')
        ),
        rewards: Object.fromEntries(
          Object.entries(formData.rewards).filter(([_, v]) => {
            if (Array.isArray(v)) {
              return v.length > 0;
            }
            return v !== undefined && v !== '';
          })
        ),
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
      };

      const response = await fetch('/api/admin/incentives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage('Regla de incentivo creada exitosamente');
        setShowCreateModal(false);
        resetForm();
        await loadRules();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Error al crear la regla de incentivo');
      }
    } catch (error) {
      logger.error('Error creando regla de incentivo:', error);
      setErrorMessage('Error al crear la regla de incentivo');
    } finally {
      setEditingRule(false);
    }
  };

  const handleUpdateRule = async () => {
    if (!selectedRule) {
      return;
    }

    try {
      setEditingRule(true);
      setErrorMessage('');

      const payload: any = {};
      if (formData.name) {
        payload.name = formData.name;
      }
      if (formData.description) {
        payload.description = formData.description;
      }
      if (formData.type) {
        payload.type = formData.type;
      }
      if (formData.category) {
        payload.category = formData.category;
      }
      if (formData.criteria) {
        payload.criteria = formData.criteria;
      }
      if (formData.rewards) {
        payload.rewards = formData.rewards;
      }
      payload.isActive = formData.isActive;
      payload.autoGrant = formData.autoGrant;
      if (formData.maxRecipients !== undefined) {
        payload.maxRecipients = formData.maxRecipients;
      }
      if (formData.cooldownPeriod) {
        payload.cooldownPeriod = formData.cooldownPeriod;
      }
      if (formData.validFrom) {
        payload.validFrom = new Date(formData.validFrom).toISOString();
      }
      payload.validUntil = formData.validUntil ? new Date(formData.validUntil).toISOString() : null;

      const response = await fetch(`/api/admin/incentives/${selectedRule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage('Regla de incentivo actualizada exitosamente');
        setShowEditModal(false);
        setSelectedRule(null);
        resetForm();
        await loadRules();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Error al actualizar la regla de incentivo');
      }
    } catch (error) {
      logger.error('Error actualizando regla de incentivo:', error);
      setErrorMessage('Error al actualizar la regla de incentivo');
    } finally {
      setEditingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('¿Estás seguro de que deseas desactivar esta regla de incentivo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/incentives/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage('Regla de incentivo desactivada exitosamente');
        await loadRules();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Error al desactivar la regla de incentivo');
      }
    } catch (error) {
      logger.error('Error desactivando regla de incentivo:', error);
      setErrorMessage('Error al desactivar la regla de incentivo');
    }
  };

  const handleViewDetails = async (rule: IncentiveRule) => {
    try {
      const response = await fetch(`/api/admin/incentives/${rule.id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSelectedRule(result.rule);
          setShowDetailModal(true);
        }
      }
    } catch (error) {
      logger.error('Error cargando detalles de regla:', error);
      setErrorMessage('Error al cargar los detalles de la regla');
    }
  };

  const handleEditRule = (rule: IncentiveRule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      category: rule.category,
      criteria: rule.criteria,
      rewards: rule.rewards,
      isActive: rule.isActive,
      autoGrant: rule.autoGrant,
      maxRecipients: rule.maxRecipients,
      cooldownPeriod: rule.cooldownPeriod,
      validFrom: rule.validFrom.split('T')[0],
      validUntil: rule.validUntil ? rule.validUntil.split('T')[0] : undefined,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'performance',
      category: 'bronze',
      criteria: {
        minVisits: undefined,
        minRating: undefined,
        minEarnings: undefined,
        minCompletionRate: undefined,
        consecutivePeriods: undefined,
        rankingPosition: undefined,
      },
      rewards: {
        bonusAmount: undefined,
        bonusPercentage: undefined,
        priorityBonus: undefined,
        badge: '',
        title: '',
        features: [],
      },
      isActive: true,
      autoGrant: true,
      maxRecipients: undefined,
      cooldownPeriod: 7,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: undefined,
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      performance: 'Rendimiento',
      rating: 'Calificación',
      volume: 'Volumen',
      loyalty: 'Lealtad',
      seasonal: 'Estacional',
    };
    return labels[type] || type;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-amber-100 text-amber-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-blue-100 text-blue-800',
      diamond: 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout
        title="Incentivos de Runners"
        subtitle="Gestiona las reglas de incentivos"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Cargando reglas de incentivos...</p>
            </div>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Incentivos de Runners"
      subtitle="Gestiona las reglas de incentivos para runners"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Mensajes de éxito/error */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSuccessMessage('')}
                  className="ml-auto text-green-600 hover:text-green-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Reglas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rules.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {rules.filter(r => r.isActive).length} activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Incentivos Otorgados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rules.reduce((sum, r) => sum + r.stats.totalGranted, 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {rules.reduce((sum, r) => sum + r.stats.recentGrants, 0)} este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Reclamados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {rules.reduce((sum, r) => sum + r.stats.totalClaimed, 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total reclamado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Expirados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {rules.reduce((sum, r) => sum + r.stats.totalExpired, 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Sin reclamar</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y acciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reglas de Incentivos</CardTitle>
              <Button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Regla
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="performance">Rendimiento</SelectItem>
                  <SelectItem value="rating">Calificación</SelectItem>
                  <SelectItem value="volume">Volumen</SelectItem>
                  <SelectItem value="loyalty">Lealtad</SelectItem>
                  <SelectItem value="seasonal">Estacional</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="inactive">Inactivas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lista de reglas */}
            <div className="space-y-4">
              {filteredRules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No se encontraron reglas de incentivos</p>
                </div>
              ) : (
                filteredRules.map(rule => (
                  <Card key={rule.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{rule.name}</h3>
                            <Badge className={getCategoryColor(rule.category)}>
                              {rule.category}
                            </Badge>
                            <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                              {rule.isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                            {rule.autoGrant && <Badge variant="outline">Auto-otorgar</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {getTypeLabel(rule.type)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Gift className="w-3 h-3" />
                              {rule.rewards.bonusAmount
                                ? `$${rule.rewards.bonusAmount.toLocaleString()}`
                                : rule.rewards.bonusPercentage
                                  ? `${rule.rewards.bonusPercentage}%`
                                  : 'Sin bono'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {rule.stats.totalGranted} otorgados
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {rule.stats.totalClaimed} reclamados
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(rule)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditRule(rule)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal de creación/edición */}
        <Dialog
          open={showCreateModal || showEditModal}
          onOpenChange={open => {
            if (!open) {
              setShowCreateModal(false);
              setShowEditModal(false);
              resetForm();
              setSelectedRule(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {showCreateModal ? 'Nueva Regla de Incentivo' : 'Editar Regla de Incentivo'}
              </DialogTitle>
              <DialogDescription>
                {showCreateModal
                  ? 'Crea una nueva regla de incentivo para runners'
                  : 'Edita los detalles de la regla de incentivo'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="criteria">Criterios</TabsTrigger>
                  <TabsTrigger value="rewards">Recompensas</TabsTrigger>
                  <TabsTrigger value="settings">Configuración</TabsTrigger>
                </TabsList>

                {/* Pestaña Básico */}
                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Super Runner"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ej: Completar 20+ visitas en una semana"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Tipo</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="performance">Rendimiento</SelectItem>
                          <SelectItem value="rating">Calificación</SelectItem>
                          <SelectItem value="volume">Volumen</SelectItem>
                          <SelectItem value="loyalty">Lealtad</SelectItem>
                          <SelectItem value="seasonal">Estacional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="category">Categoría</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bronze">Bronze</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                          <SelectItem value="diamond">Diamond</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Pestaña Criterios */}
                <TabsContent value="criteria" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minVisits">Visitas Mínimas</Label>
                      <Input
                        id="minVisits"
                        type="number"
                        value={formData.criteria.minVisits || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            criteria: {
                              ...formData.criteria,
                              minVisits: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder="Ej: 20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="minRating">Calificación Mínima</Label>
                      <Input
                        id="minRating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.criteria.minRating || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            criteria: {
                              ...formData.criteria,
                              minRating: e.target.value ? parseFloat(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder="Ej: 4.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="minEarnings">Ganancias Mínimas</Label>
                      <Input
                        id="minEarnings"
                        type="number"
                        value={formData.criteria.minEarnings || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            criteria: {
                              ...formData.criteria,
                              minEarnings: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder="Ej: 100000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="minCompletionRate">Tasa de Completitud (%)</Label>
                      <Input
                        id="minCompletionRate"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.criteria.minCompletionRate || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            criteria: {
                              ...formData.criteria,
                              minCompletionRate: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        placeholder="Ej: 80"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rankingPosition">Posición en Ranking</Label>
                      <Input
                        id="rankingPosition"
                        type="number"
                        value={formData.criteria.rankingPosition || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            criteria: {
                              ...formData.criteria,
                              rankingPosition: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        placeholder="Ej: 10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="consecutivePeriods">Períodos Consecutivos</Label>
                      <Input
                        id="consecutivePeriods"
                        type="number"
                        value={formData.criteria.consecutivePeriods || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            criteria: {
                              ...formData.criteria,
                              consecutivePeriods: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        placeholder="Ej: 3"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Pestaña Recompensas */}
                <TabsContent value="rewards" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bonusAmount">Bono Fijo (CLP)</Label>
                      <Input
                        id="bonusAmount"
                        type="number"
                        value={formData.rewards.bonusAmount || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            rewards: {
                              ...formData.rewards,
                              bonusAmount: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder="Ej: 5000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bonusPercentage">Bono Porcentaje (%)</Label>
                      <Input
                        id="bonusPercentage"
                        type="number"
                        step="0.1"
                        value={formData.rewards.bonusPercentage || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            rewards: {
                              ...formData.rewards,
                              bonusPercentage: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        placeholder="Ej: 2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="priorityBonus">Multiplicador de Prioridad</Label>
                      <Input
                        id="priorityBonus"
                        type="number"
                        step="0.1"
                        value={formData.rewards.priorityBonus || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            rewards: {
                              ...formData.rewards,
                              priorityBonus: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        placeholder="Ej: 1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="badge">Badge (Emoji)</Label>
                      <Input
                        id="badge"
                        value={formData.rewards.badge || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            rewards: { ...formData.rewards, badge: e.target.value },
                          })
                        }
                        placeholder="Ej: 🏃‍♂️"
                      />
                    </div>

                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={formData.rewards.title || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            rewards: { ...formData.rewards, title: e.target.value },
                          })
                        }
                        placeholder="Ej: Super Runner"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Pestaña Configuración */}
                <TabsContent value="settings" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cooldownPeriod">Período de Cooldown (días)</Label>
                      <Input
                        id="cooldownPeriod"
                        type="number"
                        value={formData.cooldownPeriod}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            cooldownPeriod: parseInt(e.target.value) || 7,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxRecipients">Máximo de Destinatarios</Label>
                      <Input
                        id="maxRecipients"
                        type="number"
                        value={formData.maxRecipients || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            maxRecipients: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        placeholder="Dejar vacío para ilimitado"
                      />
                    </div>

                    <div>
                      <Label htmlFor="validFrom">Válido Desde</Label>
                      <Input
                        id="validFrom"
                        type="date"
                        value={formData.validFrom}
                        onChange={e => setFormData({ ...formData, validFrom: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="validUntil">Válido Hasta</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={formData.validUntil || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            validUntil: e.target.value || undefined,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isActive">Regla activa</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoGrant"
                        checked={formData.autoGrant}
                        onChange={e => setFormData({ ...formData, autoGrant: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="autoGrant">Otorgar automáticamente</Label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                    setSelectedRule(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={showCreateModal ? handleCreateRule : handleUpdateRule}
                  disabled={editingRule}
                >
                  {editingRule ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : showCreateModal ? (
                    'Crear Regla'
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de detalles */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRule?.name}</DialogTitle>
              <DialogDescription>
                Detalles y estadísticas de la regla de incentivo
              </DialogDescription>
            </DialogHeader>

            {selectedRule && (
              <div className="space-y-6">
                {/* Estadísticas */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Otorgados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedRule.stats.totalGranted}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Reclamados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {selectedRule.stats.totalClaimed}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Expirados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {selectedRule.stats.totalExpired}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedRule.stats.recentGrants}</div>
                      <p className="text-xs text-gray-500 mt-1">Últimos 30 días</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Información */}
                <Tabs defaultValue="info">
                  <TabsList>
                    <TabsTrigger value="info">Información</TabsTrigger>
                    <TabsTrigger value="criteria">Criterios</TabsTrigger>
                    <TabsTrigger value="rewards">Recompensas</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Descripción</Label>
                      <p className="mt-1">{selectedRule.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                        <p className="mt-1">{getTypeLabel(selectedRule.type)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Categoría</Label>
                        <p className="mt-1">
                          <Badge className={getCategoryColor(selectedRule.category)}>
                            {selectedRule.category}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Estado</Label>
                        <p className="mt-1">
                          <Badge variant={selectedRule.isActive ? 'default' : 'secondary'}>
                            {selectedRule.isActive ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Auto-otorgar</Label>
                        <p className="mt-1">
                          {selectedRule.autoGrant ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Cooldown</Label>
                        <p className="mt-1">{selectedRule.cooldownPeriod} días</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Máximo Destinatarios
                        </Label>
                        <p className="mt-1">{selectedRule.maxRecipients || 'Ilimitado'}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="criteria" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRule.criteria.minVisits && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Visitas Mínimas
                          </Label>
                          <p className="mt-1">{selectedRule.criteria.minVisits}</p>
                        </div>
                      )}
                      {selectedRule.criteria.minRating && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Calificación Mínima
                          </Label>
                          <p className="mt-1">{selectedRule.criteria.minRating}</p>
                        </div>
                      )}
                      {selectedRule.criteria.minEarnings && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Ganancias Mínimas
                          </Label>
                          <p className="mt-1">
                            ${selectedRule.criteria.minEarnings.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {selectedRule.criteria.minCompletionRate && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Tasa de Completitud
                          </Label>
                          <p className="mt-1">{selectedRule.criteria.minCompletionRate}%</p>
                        </div>
                      )}
                      {selectedRule.criteria.rankingPosition && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Posición en Ranking
                          </Label>
                          <p className="mt-1">Top {selectedRule.criteria.rankingPosition}</p>
                        </div>
                      )}
                      {selectedRule.criteria.consecutivePeriods && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Períodos Consecutivos
                          </Label>
                          <p className="mt-1">{selectedRule.criteria.consecutivePeriods}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="rewards" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRule.rewards.bonusAmount && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Bono Fijo</Label>
                          <p className="mt-1">
                            ${selectedRule.rewards.bonusAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {selectedRule.rewards.bonusPercentage && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Bono Porcentaje
                          </Label>
                          <p className="mt-1">{selectedRule.rewards.bonusPercentage}%</p>
                        </div>
                      )}
                      {selectedRule.rewards.priorityBonus && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Multiplicador de Prioridad
                          </Label>
                          <p className="mt-1">{selectedRule.rewards.priorityBonus}x</p>
                        </div>
                      )}
                      {selectedRule.rewards.badge && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Badge</Label>
                          <p className="mt-1 text-2xl">{selectedRule.rewards.badge}</p>
                        </div>
                      )}
                      {selectedRule.rewards.title && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Título</Label>
                          <p className="mt-1">{selectedRule.rewards.title}</p>
                        </div>
                      )}
                      {selectedRule.rewards.features &&
                        selectedRule.rewards.features.length > 0 && (
                          <div className="col-span-2">
                            <Label className="text-sm font-medium text-gray-500">
                              Características
                            </Label>
                            <ul className="mt-1 list-disc list-inside">
                              {selectedRule.rewards.features.map((feature, idx) => (
                                <li key={idx}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEditRule(selectedRule);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
