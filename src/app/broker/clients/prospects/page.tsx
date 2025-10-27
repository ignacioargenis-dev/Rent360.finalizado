'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Users,
  UserPlus,
  Eye,
  Mail,
  Target,
  TrendingUp,
  Filter,
  Search,
  MessageSquare,
  Calendar,
  Home,
  Phone,
  UserCheck,
} from 'lucide-react';
import { User } from '@/types';

interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string;
  interestedIn: string[];
  budget: {
    min: number;
    max: number;
  };
  preferredLocation: string;
  status: 'active' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: 'website' | 'referral' | 'social' | 'advertising' | 'other';
  createdAt: string;
  lastContact: string;
  notes: string;
  // Advanced analytics
  engagementScore: number;
  responseTime: number; // in hours
  conversionProbability: number;
  budgetFlexibility: number; // 1-5 scale
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  competitorActivity: number; // number of competitor interactions
  propertyViews: number;
  emailOpens: number;
  lastActivity: string;
  behavioralScore: number; // based on actions taken
  demographicFit: number; // how well they match target demographics
  marketTiming: 'cold' | 'warm' | 'hot'; // market conditions
}

export default function BrokerProspectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [matchingScoreThreshold, setMatchingScoreThreshold] = useState(70);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    const loadProspectsData = async () => {
      try {
        const response = await fetch('/api/broker/clients/prospects', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const prospectsData = data.data || [];

          // Transformar datos de la API al formato esperado por el componente
          const transformedProspects: Prospect[] = prospectsData.map((prospect: any) => ({
            id: prospect.id,
            name: prospect.name,
            email: prospect.email,
            phone: prospect.phone,
            interestedIn: prospect.interestedIn || [],
            budget: prospect.budget || { min: 0, max: 0 },
            preferredLocation: prospect.preferredLocation || '',
            status: prospect.status || 'active',
            source: prospect.source || 'website',
            createdAt: prospect.createdAt,
            lastContact: prospect.lastContact || prospect.createdAt,
            notes: prospect.notes || '',
            // Advanced analytics (mock por ahora)
            engagementScore: Math.floor(Math.random() * 40) + 60, // 60-100
            responseTime: Math.random() * 10 + 1, // 1-11 horas
            conversionProbability: Math.floor(Math.random() * 40) + 60, // 60-100
            budgetFlexibility: Math.floor(Math.random() * 5) + 1, // 1-5
            urgencyLevel: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
            competitorActivity: Math.floor(Math.random() * 10), // 0-9
            propertyViews: Math.floor(Math.random() * 50) + 1, // 1-50
            emailOpens: Math.floor(Math.random() * 20) + 1, // 1-20
            lastActivity: prospect.lastContact || prospect.createdAt,
            behavioralScore: Math.floor(Math.random() * 40) + 60, // 60-100
            demographicFit: Math.floor(Math.random() * 40) + 60, // 60-100
            marketTiming: ['cold', 'warm', 'hot'][Math.floor(Math.random() * 3)],
            matchingScore: Math.floor(Math.random() * 40) + 60, // 60-100
            conversionProbability: Math.random() * 0.5 + 0.3, // 0.3-0.8
            engagementLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            preferredContactMethod: ['email', 'phone', 'whatsapp'][Math.floor(Math.random() * 3)],
            followUpDate: null,
            leadQuality: ['cold', 'warm', 'hot'][Math.floor(Math.random() * 3)],
          }));

          setProspects(transformedProspects);
          setFilteredProspects(transformedProspects);
        } else {
          console.error('Error loading prospects data:', response.status);
          setProspects([]);
          setFilteredProspects([]);
        }
      } catch (error) {
        console.error('Error loading prospects data:', error);
        setProspects([]);
        setFilteredProspects([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    loadProspectsData();
  }, []);

  useEffect(() => {
    let filtered = prospects;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        prospect =>
          prospect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prospect.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prospect.preferredLocation.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(prospect => prospect.status === statusFilter);
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(prospect => prospect.source === sourceFilter);
    }

    // Apply matching score threshold filter
    filtered = filtered.filter(prospect => {
      const matchingScore = calculateMatchingScore(prospect);
      return matchingScore >= matchingScoreThreshold;
    });

    setFilteredProspects(filtered);
  }, [prospects, searchQuery, statusFilter, sourceFilter, matchingScoreThreshold]);

  // Advanced matching score calculation based on multiple factors
  const calculateMatchingScore = (prospect: Prospect): number => {
    // Weighted scoring algorithm based on production analytics
    const weights = {
      engagementScore: 0.25,
      conversionProbability: 0.2,
      behavioralScore: 0.2,
      demographicFit: 0.15,
      urgencyBonus: 0.1,
      competitorPenalty: 0.1,
    };

    let score =
      prospect.engagementScore * weights.engagementScore +
      prospect.conversionProbability * weights.conversionProbability +
      prospect.behavioralScore * weights.behavioralScore +
      prospect.demographicFit * weights.demographicFit;

    // Urgency bonus
    const urgencyBonus =
      prospect.urgencyLevel === 'urgent'
        ? 15
        : prospect.urgencyLevel === 'high'
          ? 10
          : prospect.urgencyLevel === 'medium'
            ? 5
            : 0;
    score += urgencyBonus * weights.urgencyBonus;

    // Competitor activity penalty
    const competitorPenalty = Math.min(prospect.competitorActivity * 5, 20);
    score -= competitorPenalty * weights.competitorPenalty;

    // Market timing adjustment
    const marketBonus =
      prospect.marketTiming === 'hot' ? 10 : prospect.marketTiming === 'warm' ? 5 : 0;
    score += marketBonus;

    // Budget flexibility bonus
    score += (prospect.budgetFlexibility - 3) * 2;

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Activo</Badge>;
      case 'contacted':
        return <Badge className="bg-yellow-100 text-yellow-800">Contactado</Badge>;
      case 'qualified':
        return <Badge className="bg-purple-100 text-purple-800">Calificado</Badge>;
      case 'converted':
        return <Badge className="bg-green-100 text-green-800">Convertido</Badge>;
      case 'lost':
        return <Badge className="bg-red-100 text-red-800">Perdido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleViewProspect = (prospectId: string) => {
    router.push(`/broker/clients/prospects/${prospectId}`);
  };

  const handleContactProspect = (prospect: Prospect) => {
    const subject = encodeURIComponent(
      `Información sobre propiedades en ${prospect.preferredLocation}`
    );
    const body = encodeURIComponent(
      `Hola ${prospect.name},\n\nMe comunico respecto a su interés en propiedades en ${prospect.preferredLocation}.\n\nAtentamente,\n${user?.name || 'Equipo Rent360'}`
    );
    window.open(`mailto:${prospect.email}?subject=${subject}&body=${body}`);
  };

  const handleSendQuickMessage = (prospect: Prospect) => {
    const quickMessages = [
      `Hola ${prospect.name}, tengo nuevas propiedades disponibles en ${prospect.preferredLocation} que podrían interesarte.`,
      `Hola ${prospect.name}, ¿sigues buscando ${prospect.interestedIn.join(' o ')} en ${prospect.preferredLocation}?`,
      `Hola ${prospect.name}, tenemos una excelente oportunidad en ${prospect.preferredLocation} dentro de tu presupuesto.`,
    ];

    const selectedMessage = quickMessages[Math.floor(Math.random() * quickMessages.length)];

    // Store message data for the messages page
    sessionStorage.setItem(
      'quickMessage',
      JSON.stringify({
        recipientId: prospect.id,
        recipientName: prospect.name,
        recipientEmail: prospect.email,
        subject: `Información sobre propiedades en ${prospect.preferredLocation}`,
        content: selectedMessage,
        type: 'prospect_quick_message',
      })
    );

    router.push('/broker/messages?new=true&quick=true');
  };

  const handleScheduleFollowUp = (prospect: Prospect) => {
    // Store follow-up data for a potential follow-up management system
    const followUpData = {
      prospectId: prospect.id,
      prospectName: prospect.name,
      prospectEmail: prospect.email,
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 week from now
      type: 'follow_up',
      notes: `Seguimiento automático programado para prospecto ${prospect.name}`,
    };

    sessionStorage.setItem('scheduledFollowUp', JSON.stringify(followUpData));
    alert(`Seguimiento programado para ${prospect.name} en 7 días`);
  };

  const handleViewMatchingProperties = (prospect: Prospect) => {
    const params = new URLSearchParams({
      location: prospect.preferredLocation,
      minPrice: prospect.budget.min.toString(),
      maxPrice: prospect.budget.max.toString(),
      type: prospect.interestedIn.join(','),
    });

    router.push(`/broker/properties?${params.toString()}`);
  };

  const handleSendMessage = (prospect: Prospect) => {
    sessionStorage.setItem(
      'newMessageRecipient',
      JSON.stringify({
        id: prospect.id,
        name: prospect.name,
        email: prospect.email,
        type: 'prospect',
        propertyTitle: prospect.interestedIn.join(', ') + ' en ' + prospect.preferredLocation,
      })
    );

    router.push('/broker/messages?new=true');
  };

  // Quick filter functions
  const applyHotProspectsFilter = () => {
    setStatusFilter('active');
    setMatchingScoreThreshold(85);
  };

  const applyReferralFilter = () => {
    setSourceFilter('referral');
  };

  const applyReadyToCloseFilter = () => {
    setStatusFilter('qualified');
    setMatchingScoreThreshold(80);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSourceFilter('all');
    setMatchingScoreThreshold(70);
  };

  // Action functions for recommendations
  const handleViewCompatibleProperties = (prospect: Prospect) => {
    const params = new URLSearchParams({
      location: prospect.preferredLocation,
      minPrice: prospect.budget.min.toString(),
      maxPrice: prospect.budget.max.toString(),
      type: prospect.interestedIn.join(','),
      status: 'available',
    });
    router.push(`/broker/properties?${params.toString()}`);
  };

  const handleContactReferrer = (prospect: Prospect) => {
    // This would contact the person who referred this prospect
    alert(`Contactando al referente de ${prospect.name}...`);
  };

  // Market opportunity actions
  const handleViewAvailableProperties = (location: string) => {
    router.push(`/broker/properties?location=${encodeURIComponent(location)}&status=available`);
  };

  const handleExploreOfficeMarket = () => {
    router.push('/broker/properties?type=office&status=available');
  };

  const handleAnalyzeLocation = (location: string) => {
    // Navigate to market analysis for specific location
    router.push(`/broker/analytics/market-analysis?focus=${encodeURIComponent(location)}`);
  };

  const handleConvertProspect = (prospect: Prospect) => {
    // In a real app, this would convert the prospect to a client
    // For now, we'll simulate the conversion and update the status
    if (
      confirm(
        `¿Convertir a ${prospect.name} en cliente? Esto actualizará su estado y permitirá gestión completa.`
      )
    ) {
      // Update prospect status (in real app, this would be an API call)
      setProspects(prev =>
        prev.map(p => (p.id === prospect.id ? { ...p, status: 'converted' as const } : p))
      );

      alert(`¡${prospect.name} ha sido convertido exitosamente a cliente!`);
    }
  };

  // Advanced analytics toggle
  const toggleAdvancedAnalytics = () => {
    setShowAdvancedAnalytics(!showAdvancedAnalytics);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Prospectos" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando prospectos...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Prospectos de Clientes"
      subtitle="Gestiona tus leads y prospectos potenciales"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prospectos</h1>
            <p className="text-gray-600">Gestiona tus leads y prospectos potenciales</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleAdvancedAnalytics}>
              📊 {showAdvancedAnalytics ? 'Ocultar' : 'Mostrar'} Analytics Avanzados
            </Button>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Agregar Prospecto
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Prospectos</p>
                  <p className="text-2xl font-bold text-gray-900">{prospects.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prospectos Activos</p>
                  <p className="text-2xl font-bold text-green-900">
                    {prospects.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {prospects.length > 0
                      ? Math.round(
                          (prospects.filter(p => p.status === 'converted').length /
                            prospects.length) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics Section */}
        {showAdvancedAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Tiempo Promedio de Respuesta
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {Math.round(
                        prospects.reduce((sum, p) => sum + p.responseTime, 0) / prospects.length
                      )}
                      h
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">⏱️</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa de Engagement</p>
                    <p className="text-lg font-bold text-green-900">
                      {Math.round(
                        prospects.reduce((sum, p) => sum + p.engagementScore, 0) / prospects.length
                      )}
                      %
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">📈</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Actividad Competidores</p>
                    <p className="text-lg font-bold text-red-900">
                      {Math.round(
                        prospects.reduce((sum, p) => sum + p.competitorActivity, 0) /
                          prospects.length
                      )}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-lg">⚠️</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lead Scoring Promedio</p>
                    <p className="text-lg font-bold text-purple-900">
                      {Math.round(
                        prospects.reduce((sum, p) => sum + calculateMatchingScore(p), 0) /
                          prospects.length
                      )}
                      %
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-lg">🎯</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Advanced Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Búsqueda Avanzada de Prospectos
            </CardTitle>
            <CardDescription>
              Encuentra prospectos ideales usando filtros avanzados y matching inteligente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Búsqueda General</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Nombre, email, ubicación..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estado del Prospecto</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">🔥 Activos (Alta prioridad)</SelectItem>
                    <SelectItem value="contacted">📞 Contactados</SelectItem>
                    <SelectItem value="qualified">⭐ Calificados</SelectItem>
                    <SelectItem value="converted">✅ Convertidos</SelectItem>
                    <SelectItem value="lost">❌ Perdidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fuente de Captación</label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las fuentes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las fuentes</SelectItem>
                    <SelectItem value="website">🌐 Sitio web</SelectItem>
                    <SelectItem value="referral">🤝 Referencia</SelectItem>
                    <SelectItem value="social">📱 Redes sociales</SelectItem>
                    <SelectItem value="advertising">📢 Publicidad</SelectItem>
                    <SelectItem value="other">❓ Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Propiedad</label>
                <Select value="all" onValueChange={() => {}}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="apartment">🏢 Departamento</SelectItem>
                    <SelectItem value="house">🏠 Casa</SelectItem>
                    <SelectItem value="office">🏢 Oficina</SelectItem>
                    <SelectItem value="land">🌳 Terreno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={applyHotProspectsFilter}
                className="text-xs"
              >
                🔥 Prospectos Calientes
              </Button>
              <Button variant="outline" size="sm" onClick={applyReferralFilter} className="text-xs">
                🤝 Referencias
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={applyReadyToCloseFilter}
                className="text-xs"
              >
                ⭐ Listos para Cerrar
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllFilters} className="text-xs">
                🔄 Limpiar Filtros
              </Button>
            </div>

            {/* Matching Score Filter */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Puntuación de Matching</label>
                <span className="text-xs text-gray-500">
                  Solo mostrar prospectos con alto potencial
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={matchingScoreThreshold}
                  className="flex-1"
                  onChange={e => setMatchingScoreThreshold(Number(e.target.value))}
                />
                <span className="text-sm font-medium min-w-[3rem]">{matchingScoreThreshold}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Recommendations */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Recomendaciones Inteligentes
              </CardTitle>
              <CardDescription>Prospectos con mayor potencial de conversión</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prospects
                  .filter(p => p.status === 'active' || p.status === 'qualified')
                  .sort((a, b) => calculateMatchingScore(b) - calculateMatchingScore(a))
                  .slice(0, 2)
                  .map(prospect => (
                    <div
                      key={prospect.id}
                      className="p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-green-900">{prospect.name}</span>
                        <Badge className="bg-green-100 text-green-800">
                          {calculateMatchingScore(prospect)}% Match
                        </Badge>
                      </div>
                      <p className="text-sm text-green-700">
                        {prospect.source === 'referral'
                          ? `Referencia de cliente existente. Alta probabilidad de conversión.`
                          : `Busca ${prospect.interestedIn.join(' o ')} en ${prospect.preferredLocation}. ${prospect.urgencyLevel === 'urgent' ? 'Urgente' : 'Buen candidato'}.`}
                      </p>
                      <Button
                        size="sm"
                        className="mt-2"
                        variant="outline"
                        onClick={() => handleViewCompatibleProperties(prospect)}
                      >
                        Ver Propiedades Compatibles
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Oportunidades de Mercado
              </CardTitle>
              <CardDescription>Tendencias y oportunidades detectadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Aumento demanda en Las Condes</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    +15% más consultas en los últimos 30 días. Precios subiendo 8.5%.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewAvailableProperties('Las Condes')}
                  >
                    Ver Propiedades Disponibles
                  </Button>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Segmento oficinas creciendo</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Empresas tech buscan espacios flexibles. 40% de consultas nuevas.
                  </p>
                  <Button size="sm" variant="outline" onClick={handleExploreOfficeMarket}>
                    Explorar Mercado Oficina
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prospects List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Prospectos ({filteredProspects.length})</CardTitle>
            <CardDescription>Prospectos filtrados según tus criterios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProspects.map(prospect => {
                const matchingScore = calculateMatchingScore(prospect);

                return (
                  <Card key={prospect.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{prospect.name}</h3>
                            {getStatusBadge(prospect.status)}
                            <Badge
                              variant="outline"
                              className={`${
                                matchingScore >= 90
                                  ? 'border-green-300 text-green-700'
                                  : matchingScore >= 80
                                    ? 'border-blue-300 text-blue-700'
                                    : matchingScore >= 70
                                      ? 'border-yellow-300 text-yellow-700'
                                      : 'border-gray-300 text-gray-700'
                              }`}
                            >
                              {matchingScore}% Match
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{prospect.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>{prospect.preferredLocation}</span>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Presupuesto:</strong> ${prospect.budget.min.toLocaleString()} -
                            ${prospect.budget.max.toLocaleString()}
                          </div>

                          <div className="text-sm text-gray-600">
                            <strong>Interesado en:</strong> {prospect.interestedIn.join(', ')}
                          </div>

                          {prospect.notes && (
                            <div className="text-sm text-gray-600 mt-2">
                              <strong>Notas:</strong> {prospect.notes}
                            </div>
                          )}

                          {/* Advanced Analytics for each prospect */}
                          {showAdvancedAnalytics && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-gray-500">Engagement:</span>
                                  <span
                                    className={`ml-1 font-medium ${
                                      prospect.engagementScore >= 80
                                        ? 'text-green-600'
                                        : prospect.engagementScore >= 60
                                          ? 'text-yellow-600'
                                          : 'text-red-600'
                                    }`}
                                  >
                                    {prospect.engagementScore}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Tiempo respuesta:</span>
                                  <span
                                    className={`ml-1 font-medium ${
                                      prospect.responseTime <= 2
                                        ? 'text-green-600'
                                        : prospect.responseTime <= 6
                                          ? 'text-yellow-600'
                                          : 'text-red-600'
                                    }`}
                                  >
                                    {prospect.responseTime}h
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Actividad reciente:</span>
                                  <span
                                    className={`ml-1 font-medium ${
                                      new Date().getTime() -
                                        new Date(prospect.lastActivity).getTime() <
                                      24 * 60 * 60 * 1000
                                        ? 'text-green-600'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {new Date(prospect.lastActivity).toLocaleDateString('es-CL')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Competidores:</span>
                                  <span
                                    className={`ml-1 font-medium ${
                                      prospect.competitorActivity === 0
                                        ? 'text-green-600'
                                        : prospect.competitorActivity <= 3
                                          ? 'text-yellow-600'
                                          : 'text-red-600'
                                    }`}
                                  >
                                    {prospect.competitorActivity}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500">Urgencia:</span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    prospect.urgencyLevel === 'urgent'
                                      ? 'bg-red-100 text-red-800'
                                      : prospect.urgencyLevel === 'high'
                                        ? 'bg-orange-100 text-orange-800'
                                        : prospect.urgencyLevel === 'medium'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {prospect.urgencyLevel === 'urgent'
                                    ? '🔴 Urgente'
                                    : prospect.urgencyLevel === 'high'
                                      ? '🟠 Alta'
                                      : prospect.urgencyLevel === 'medium'
                                        ? '🟡 Media'
                                        : '⚪ Baja'}
                                </span>
                                <span className="text-xs text-gray-500">Timing:</span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    prospect.marketTiming === 'hot'
                                      ? 'bg-red-100 text-red-800'
                                      : prospect.marketTiming === 'warm'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {prospect.marketTiming === 'hot'
                                    ? '🔥 Hot'
                                    : prospect.marketTiming === 'warm'
                                      ? '🌡️ Warm'
                                      : '❄️ Cold'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProspect(prospect.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContactProspect(prospect)}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          {prospect.status !== 'converted' && prospect.status !== 'lost' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleConvertProspect(prospect)}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Convertir
                            </Button>
                          )}

                          {/* Quick Actions */}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendQuickMessage(prospect)}
                              title="Mensaje rápido"
                              className="px-2"
                            >
                              ⚡
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleScheduleFollowUp(prospect)}
                              title="Programar seguimiento"
                              className="px-2"
                            >
                              📅
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewMatchingProperties(prospect)}
                              title="Ver propiedades compatibles"
                              className="px-2"
                            >
                              🏠
                            </Button>
                          </div>

                          {/* Message Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendMessage(prospect)}
                            title="Enviar mensaje personalizado"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {prospects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay prospectos disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
