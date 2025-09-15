'use client';

import { logger } from '@/lib/logger-edge';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Download, 
  Plus,
  Calendar,
  DollarSign,
  Users, 
  Building, 
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  X,
  Loader2
} from 'lucide-react';
import { User, Contract } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

export default function AdminContractsPage() {

  const [user, setUser] = useState<User | null>(null);

  const [contracts, setContracts] = useState<Contract[]>([]);

  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [creatingContract, setCreatingContract] = useState(false);

  const [newContract, setNewContract] = useState({
    propertyId: '',
    ownerId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    deposit: '',
    status: 'DRAFT' as const,
    terms: '',
  });

  useEffect(() => {
    // Load user data
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

    // Load contracts data
    const loadContracts = async () => {
      try {
        // Mock data for demo - compatible with global Contract interface
        const mockContracts: Contract[] = [
          {
            id: '1',
            contractNumber: 'CNT-001-2024',
            propertyId: 'prop-1',
            ownerId: 'user-owner-1',
            tenantId: 'user-tenant-1',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            monthlyRent: 550000,
            deposit: 550000,
            status: 'ACTIVE' as const,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            property: {
              id: 'prop-1',
              title: 'Departamento Las Condes',
              description: 'Hermoso departamento en Las Condes',
              address: 'Las Condes, Santiago',
              city: 'Santiago',
              commune: 'Las Condes',
              region: 'Metropolitana',
              price: 550000,
              deposit: 550000,
              bedrooms: 2,
              bathrooms: 1,
              area: 65,
              status: 'RENTED' as const,
              images: [],
              features: [],
              ownerId: 'user-owner-1',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            } as any,
            owner: {
              id: 'user-owner-1',
              email: 'maria@example.com',
              name: 'María González',
              role: 'owner' as const,
              phone: '+56912345678',
              isActive: true,
              emailVerified: true,
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            } as any,
            tenant: {
              id: 'user-tenant-1',
              email: 'carlos@example.com',
              name: 'Carlos Ramírez',
              role: 'tenant' as const,
              phone: '+56987654321',
              isActive: true,
              emailVerified: true,
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            } as any,
          },
          {
            id: '2',
            contractNumber: 'CNT-002-2024',
            propertyId: 'prop-2',
            ownerId: 'user-owner-2',
            tenantId: 'user-tenant-2',
            startDate: new Date('2024-02-15'),
            endDate: new Date('2025-02-14'),
            monthlyRent: 350000,
            deposit: 350000,
            status: 'ACTIVE' as const,
            createdAt: new Date('2024-02-15'),
            updatedAt: new Date('2024-02-15'),
            property: {
              id: 'prop-2',
              title: 'Oficina Providencia',
              description: 'Oficina moderna en Providencia',
              address: 'Providencia, Santiago',
              city: 'Santiago',
              commune: 'Providencia',
              region: 'Metropolitana',
              price: 350000,
              deposit: 350000,
              bedrooms: 0,
              bathrooms: 1,
              area: 45,
              status: 'RENTED' as const,
              images: [],
              features: [],
              ownerId: 'user-owner-2',
              createdAt: new Date('2024-02-15'),
              updatedAt: new Date('2024-02-15'),
            } as any,
            owner: {
              id: 'user-owner-2',
              email: 'empresa@example.com',
              name: 'Empresa Soluciones Ltda.',
              role: 'owner' as const,
              phone: '+56212345678',
              isActive: true,
              emailVerified: true,
              createdAt: new Date('2024-02-15'),
              updatedAt: new Date('2024-02-15'),
            } as any,
            tenant: {
              id: 'user-tenant-2',
              email: 'techcorp@example.com',
              name: 'TechCorp SA',
              role: 'tenant' as const,
              phone: '+56287654321',
              isActive: true,
              emailVerified: true,
              createdAt: new Date('2024-02-15'),
              updatedAt: new Date('2024-02-15'),
            } as any,
          },
          {
            id: '3',
            contractNumber: 'CNT-003-2024',
            propertyId: 'prop-3',
            ownerId: 'user-owner-3',
            tenantId: 'user-tenant-3',
            startDate: new Date('2024-03-01'),
            endDate: new Date('2025-02-28'),
            monthlyRent: 1200000,
            deposit: 1200000,
            status: 'ACTIVE' as const,
            createdAt: new Date('2024-03-01'),
            updatedAt: new Date('2024-03-01'),
            property: {
              id: 'prop-3',
              title: 'Casa Vitacura',
              description: 'Amplia casa familiar en Vitacura',
              address: 'Vitacura, Santiago',
              city: 'Santiago',
              commune: 'Vitacura',
              region: 'Metropolitana',
              price: 1200000,
              deposit: 1200000,
              bedrooms: 4,
              bathrooms: 3,
              area: 180,
              status: 'RENTED' as const,
              images: [],
              features: [],
              ownerId: 'user-owner-3',
              createdAt: new Date('2024-03-01'),
              updatedAt: new Date('2024-03-01'),
            } as any,
            owner: {
              id: 'user-owner-3',
              email: 'pedro@example.com',
              name: 'Pedro Silva',
              role: 'owner' as const,
              phone: '+56911223344',
              isActive: true,
              emailVerified: true,
              createdAt: new Date('2024-03-01'),
              updatedAt: new Date('2024-03-01'),
            } as any,
            tenant: {
              id: 'user-tenant-3',
              email: 'ana@example.com',
              name: 'Ana Martínez',
              role: 'tenant' as const,
              phone: '+56944332211',
              isActive: true,
              emailVerified: true,
              createdAt: new Date('2024-03-01'),
              updatedAt: new Date('2024-03-01'),
            } as any,
          },
          {
            id: '4',
            contractNumber: 'CNT-004-2023',
            propertyId: 'prop-4',
            ownerId: 'user-owner-4',
            tenantId: 'user-tenant-4',
            startDate: new Date('2023-06-01'),
            endDate: new Date('2024-05-31'),
            monthlyRent: 280000,
            deposit: 280000,
            status: 'EXPIRED' as const,
            createdAt: new Date('2023-06-01'),
            updatedAt: new Date('2024-06-01'),
            property: {
              id: 'prop-4',
              title: 'Estudio Centro Histórico',
              description: 'Acogedor estudio en el centro',
              address: 'Centro, Santiago',
              city: 'Santiago',
              commune: 'Santiago',
              region: 'Metropolitana',
              price: 280000,
              deposit: 280000,
              bedrooms: 1,
              bathrooms: 1,
              area: 35,
              status: 'AVAILABLE' as const,
              images: [],
              features: [],
              ownerId: 'user-owner-4',
              createdAt: new Date('2023-06-01'),
              updatedAt: new Date('2024-06-01'),
            } as any,
            owner: {
              id: 'user-owner-4',
              email: 'luis@example.com',
              name: 'Luis Fernández',
              role: 'owner' as const,
              phone: '+56955667788',
              isActive: true,
              emailVerified: true,
              createdAt: new Date('2023-06-01'),
              updatedAt: new Date('2024-06-01'),
            } as any,
            tenant: {
              id: 'user-tenant-4',
              email: 'sofia@example.com',
              name: 'Sofía López',
              role: 'tenant' as const,
              phone: '+56988776655',
              isActive: true,
              emailVerified: true,
              createdAt: new Date('2023-06-01'),
              updatedAt: new Date('2024-06-01'),
            } as any,
          },
        ];

        setContracts(mockContracts);
        setFilteredContracts(mockContracts);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading contracts:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadContracts();
  }, []);

  useEffect(() => {
    // Filter contracts based on search and status
    let filtered = contracts;

    if (searchQuery) {
      filtered = filtered.filter(contract =>
        contract.contractNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.property?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.property?.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.owner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.tenant?.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    setFilteredContracts(filtered);
  }, [contracts, searchQuery, statusFilter]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-800">Expirado</Badge>;
      case 'TERMINATED':
        return <Badge className="bg-gray-100 text-gray-800">Terminado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'EXPIRED':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'TERMINATED':
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const createContract = async () => {
    if (!newContract.propertyId || !newContract.ownerId || !newContract.tenantId ||
        !newContract.startDate || !newContract.endDate || !newContract.monthlyRent) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setCreatingContract(true);

      // Create contract object compatible with global Contract interface
      const now = new Date();
      const contractNumber = `CNT-${Date.now().toString().slice(-6)}-2024`;

      const contractData: Contract = {
        id: Date.now().toString(),
        contractNumber,
        propertyId: newContract.propertyId,
        ownerId: newContract.ownerId,
        tenantId: newContract.tenantId,
        startDate: new Date(newContract.startDate),
        endDate: new Date(newContract.endDate),
        monthlyRent: parseInt(newContract.monthlyRent || '0'),
        deposit: parseInt(newContract.deposit || '0') || parseInt(newContract.monthlyRent || '0'),
        status: newContract.status,
        terms: newContract.terms || undefined,
        createdAt: now,
        updatedAt: now,
        property: {
          id: newContract.propertyId,
          title: `Propiedad ${newContract.propertyId}`,
          description: 'Propiedad creada desde formulario',
          address: 'Dirección por definir',
          city: 'Santiago',
          commune: 'Centro',
          region: 'Metropolitana',
          price: parseInt(newContract.monthlyRent || '0'),
          deposit: parseInt(newContract.deposit || '0'),
          bedrooms: 1,
          bathrooms: 1,
          area: 50,
          status: 'RENTED' as const,
          images: [],
          features: [],
          ownerId: newContract.ownerId,
          createdAt: now,
          updatedAt: now,
        } as any,
        owner: {
          id: newContract.ownerId,
          email: `${newContract.ownerId}@example.com`,
          name: `Propietario ${newContract.ownerId}`,
          role: 'owner' as const,
          isActive: true,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        } as any,
        tenant: {
          id: newContract.tenantId,
          email: `${newContract.tenantId}@example.com`,
          name: `Inquilino ${newContract.tenantId}`,
          role: 'tenant' as const,
          isActive: true,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        } as any,
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setContracts([contractData, ...contracts]);
      setShowCreateModal(false);
      setNewContract({
        propertyId: '',
        ownerId: '',
        tenantId: '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
        deposit: '',
        status: 'DRAFT' as const,
        terms: '',
      });
    } catch (error) {
      logger.error('Error creating contract:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al crear contrato');
    } finally {
      setCreatingContract(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Gestión de Contratos"
      subtitle="Administra todos los contratos del sistema"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contratos</p>
                  <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {contracts.filter(c => c.status === 'ACTIVE').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {contracts.filter(c => c.status === 'PENDING').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(contracts.filter(c => c.status === 'ACTIVE').reduce((sum, c) => sum + c.monthlyRent, 0))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar por número de contrato, propiedad, propietario o inquilino..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ACTIVE">Activos</SelectItem>
                    <SelectItem value="PENDING">Pendientes</SelectItem>
                    <SelectItem value="EXPIRED">Expirados</SelectItem>
                    <SelectItem value="TERMINATED">Terminados</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Contrato
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Contratos</CardTitle>
            <CardDescription>
              {filteredContracts.length} contratos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredContracts.map((contract) => (
                <div key={contract.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(contract.status)}
                        <h3 className="text-lg font-semibold">{contract.contractNumber}</h3>
                        {getStatusBadge(contract.status)}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building className="w-4 h-4" />
                            <span>{contract.property?.title || 'Propiedad no disponible'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Propietario: {contract.owner?.name || 'No disponible'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Inquilino: {contract.tenant?.name || 'No disponible'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{formatPrice(contract.monthlyRent)}/mes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Depósito: {formatPrice(contract.deposit)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Contract Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Crear Nuevo Contrato</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Contrato *
                </label>
                <Input
                  value={newContract.title}
                  onChange={(e) => setNewContract({...newContract, title: e.target.value})}
                  placeholder="Contrato Arriendo Departamento Las Condes"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID de Propiedad *
                  </label>
                  <Input
                    value={newContract.propertyId}
                    onChange={(e) => setNewContract({...newContract, propertyId: e.target.value})}
                    placeholder="prop-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <Select value={newContract.status} onValueChange={(value) => setNewContract({...newContract, status: value as Contract['status']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Borrador</SelectItem>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="EXPIRED">Expirado</SelectItem>
                      <SelectItem value="TERMINATED">Terminado</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID de Propietario *
                  </label>
                  <Input
                    value={newContract.ownerId}
                    onChange={(e) => setNewContract({...newContract, ownerId: e.target.value})}
                    placeholder="user-owner-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID de Inquilino *
                  </label>
                  <Input
                    value={newContract.tenantId}
                    onChange={(e) => setNewContract({...newContract, tenantId: e.target.value})}
                    placeholder="user-tenant-1"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio *
                  </label>
                  <Input
                    type="date"
                    value={newContract.startDate}
                    onChange={(e) => setNewContract({...newContract, startDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Término *
                  </label>
                  <Input
                    type="date"
                    value={newContract.endDate}
                    onChange={(e) => setNewContract({...newContract, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arriendo Mensual (CLP) *
                  </label>
                  <Input
                    type="number"
                    value={newContract.monthlyRent}
                    onChange={(e) => setNewContract({...newContract, monthlyRent: e.target.value})}
                    placeholder="550000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depósito (CLP)
                  </label>
                  <Input
                    type="number"
                    value={newContract.deposit}
                    onChange={(e) => setNewContract({...newContract, deposit: e.target.value})}
                    placeholder="550000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Términos y Condiciones
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={newContract.terms}
                  onChange={(e) => setNewContract({...newContract, terms: e.target.value})}
                  placeholder="Ingrese los términos y condiciones del contrato..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={creatingContract}
              >
                Cancelar
              </Button>
              <Button 
                onClick={createContract}
                disabled={creatingContract}
              >
                {creatingContract ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Contrato
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </EnhancedDashboardLayout>
  );
}
