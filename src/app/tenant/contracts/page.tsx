'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Download,
  Eye,
  DollarSign,
  Home,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  FileText,
  User
} from 'lucide-react';
import { Contract, Property } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';
import ElectronicSignature from '@/components/contracts/ElectronicSignature';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ContractWithDetails extends Contract {
  property?: Property;
  ownerName?: string;
}

export default function TenantContractsPage() {
  const { user, loading: userLoading } = useUserState();

  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedContract, setSelectedContract] = useState<ContractWithDetails | null>(null);

  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  useEffect(() => {
    // Mock data for demo
    const emptyImages: string[] = [];

    setTimeout(() => {
      setContracts([
                {
          id: 'pending-tenant-1',
          contractNumber: 'CTR-2024-004',
          propertyId: '4',
          tenantId: '1',
          ownerId: '6',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2025-02-28'),
          monthlyRent: 450000,
          deposit: 450000,
          status: 'PENDING' as any,
          brokerId: null,
          terms: 'Contrato residencial estándar - Pendiente de firma del propietario',
          signedAt: null,
          terminatedAt: null,
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date('2024-02-15'),
          property: {
            id: '4',
            title: 'Casa Ñuñoa',
            description: 'Casa familiar moderna en Ñuñoa',
            address: 'Av. Irarrázaval 2345, Ñuñoa',
            city: 'Santiago',
            commune: 'Ñuñoa',
            region: 'Metropolitana',
            price: 450000,
            deposit: 450000,
            bedrooms: 3,
            bathrooms: 2,
            area: 120,
            status: 'AVAILABLE' as any,
            type: 'HOUSE' as any,
            images: JSON.stringify(emptyImages),
            features: JSON.stringify(['Jardín', 'Estacionamiento', 'Amoblado']),
            views: 156,
            inquiries: 12,
            ownerId: '6',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ownerName: 'Propietario Ñuñoa',
        },
                {
          id: '1',
          contractNumber: 'CTR-2024-001',
          propertyId: '1',
          tenantId: '1',
          ownerId: '2',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          monthlyRent: 550000,
          deposit: 550000,
          status: 'ACTIVE' as any,
          brokerId: '3',
          terms: 'Contrato estándar de arrendamiento por 12 meses con cláusulas de garantía y mantenimiento.',
          signedAt: new Date('2023-12-20'),
          terminatedAt: null,
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2024-01-01'),
          property: {
            id: '1',
            title: 'Departamento Las Condes',
            description: 'Hermoso departamento en el corazón de Las Condes',
            address: 'Av. Apoquindo 3400, Las Condes',
            city: 'Santiago',
            commune: 'Las Condes',
            region: 'Metropolitana',
            price: 550000,
            deposit: 550000,
            bedrooms: 2,
            bathrooms: 2,
            area: 85,
            status: 'RENTED' as any,
            type: 'APARTMENT' as any,
            images: JSON.stringify(emptyImages),
            features: JSON.stringify(['Estacionamiento', 'Bodega', 'Gimnasio']),
            views: 245,
            inquiries: 23,
            ownerId: '2',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ownerName: 'María González',
        },
        {
          id: '2',
          contractNumber: 'CTR-2023-002',
          propertyId: '2',
          tenantId: '1',
          ownerId: '3',
          startDate: new Date('2023-06-01'),
          endDate: new Date('2024-05-31'),
          monthlyRent: 350000,
          deposit: 350000,
          status: 'ACTIVE' as any,
          brokerId: '4',
          terms: 'Contrato de arrendamiento comercial con opción a compra al término del período.',
          signedAt: new Date('2023-05-20'),
          terminatedAt: null,
          createdAt: new Date('2023-05-15'),
          updatedAt: new Date('2023-06-01'),
          property: {
            id: '2',
            title: 'Oficina Providencia',
            description: 'Oficina comercial en sector empresarial',
            address: 'Av. Providencia 1245, Providencia',
            city: 'Santiago',
            commune: 'Providencia',
            region: 'Metropolitana',
            price: 350000,
            deposit: 350000,
            bedrooms: 1,
            bathrooms: 1,
            area: 45,
            status: 'RENTED' as any,
            type: 'COMMERCIAL' as any,
            images: JSON.stringify(emptyImages),
            features: JSON.stringify(['Seguridad 24/7', 'Recepción']),
            views: 189,
            inquiries: 15,
            ownerId: '3',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ownerName: 'Empresa Soluciones Ltda.',
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSignContract = (contract: ContractWithDetails) => {
    setSelectedContract(contract);
    setShowSignatureDialog(true);
  };

  const handleSignatureComplete = (signatureId: string) => {
    // Actualizar el estado del contrato a firmado
    setContracts(prev => prev.map(contract =>
      contract.id === selectedContract?.id
        ? { ...contract, status: 'ACTIVE' as any }
        : contract
    ));
    setShowSignatureDialog(false);
    setSelectedContract(null);
  };

  const handleSignatureCancel = () => {
    setShowSignatureDialog(false);
    setSelectedContract(null);
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

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.property?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (userLoading || loading) {
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
    <DashboardLayout>
      <DashboardHeader 
        user={user}
        title="Mis Contratos"
        subtitle="Gestiona tus contratos de arriendo"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contratos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
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
                  <p className="text-sm font-medium text-gray-600">Monto Total Mensual</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(contracts.reduce((sum, c) => sum + c.monthlyRent, 0))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Depósitos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(contracts.reduce((sum, c) => sum + c.deposit, 0))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por propiedad o propietario..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="EXPIRED">Expirados</option>
                  <option value="TERMINATED">Terminados</option>
                </select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {contract.property?.title}
                        </h3>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Home className="w-4 h-4" />
                          {contract.property?.address}
                        </p>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Arriendo mensual</p>
                        <p className="font-semibold text-gray-900">{formatPrice(contract.monthlyRent)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Depósito</p>
                        <p className="font-semibold text-gray-900">{formatPrice(contract.deposit)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Inicio</p>
                        <p className="font-semibold text-gray-900">{formatDate(contract.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Término</p>
                        <p className="font-semibold text-gray-900">{formatDate(contract.endDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>Propietario: {contract.ownerName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Creado: {formatDate(contract.createdAt.toISOString())}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                    {contract.status === 'PENDING' && (
                      <Dialog open={showSignatureDialog && selectedContract?.id === contract.id} onOpenChange={setShowSignatureDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="flex-1" onClick={() => handleSignContract(contract)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Firmar Contrato
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Firmar Contrato - {contract.property?.title}</DialogTitle>
                          </DialogHeader>
                          {selectedContract && (
                            <ElectronicSignature
                              contractId={selectedContract.id}
                              documentName={`Contrato ${selectedContract.contractNumber}`}
                              documentHash="mock-hash"
                              onSignatureComplete={handleSignatureComplete}
                              onSignatureCancel={handleSignatureCancel}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContracts.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron contratos
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta ajustar tus filtros de búsqueda.'
                  : 'Aún no tienes contratos de arriendo.'
                }
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Buscar Propiedades
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
