'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
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


export default function AdminContractsPage() {

  const [user, setUser] = useState<User | null>(null);

  const [contracts, setContracts] = useState<Contract[]>([]);

  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [creatingContract, setCreatingContract] = useState(false);

  const [newContract, setNewContract] = useState<{
    title: string;
    propertyId: string;
    ownerId: string;
    tenantId: string;
    startDate: string;
    endDate: string;
    monthlyRent: string;
    deposit: string;
    status: Contract['status'];
    terms: string;
  }>({
    title: '',
    propertyId: '',
    ownerId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    deposit: '',
    status: 'DRAFT',
    terms: `CONTRATO DE ARRIENDO

En [Ciudad], a [Día] de [Mes] de [Año], entre:

ARRendADOR: [Nombre Completo del Arrendador], [RUT del Arrendador], domiciliado en [Dirección del Arrendador], [Comuna], [Región], en adelante "el Arrendador".

ARRENDATARIO: [Nombre Completo del Arrendatario], [RUT del Arrendatario], domiciliado en [Dirección del Arrendatario], [Comuna], [Región], en adelante "el Arrendatario".

Se ha convenido el siguiente CONTRATO DE ARRIENDO, conforme a las disposiciones de la Ley N° 18.101 y demás normas legales vigentes.

PRIMERO: OBJETO DEL CONTRATO

El Arrendador da en arriendo al Arrendatario y este acepta, la propiedad ubicada en [Dirección Completa de la Propiedad], [Comuna], [Región], consistente en [Descripción detallada de la propiedad: tipo, número de habitaciones, baños, etc.], con una superficie aproximada de [Superficie] m².

SEGUNDO: PLAZO DEL ARRIENDO

El presente contrato tendrá una duración de [Número de meses/años], contado desde el [Fecha de inicio] hasta el [Fecha de término], prorrogándose automáticamente por períodos iguales, salvo aviso de no renovación dado por escrito por cualquiera de las partes con [Número] meses de anticipación.

TERCERO: PRECIO Y FORMA DE PAGO

El precio del arriendo mensual será de $[Monto en letras] pesos ($[Monto en números]), pagaderos por mensualidades anticipadas, los primeros 5 días de cada mes.

El Arrendatario deberá pagar además los siguientes gastos comunes: [Especificar qué gastos paga el arrendatario].

CUARTO: DEPÓSITO

El Arrendatario entrega en este acto un depósito de garantía por la suma de $[Monto depósito en letras] pesos ($[Monto depósito en números]), el cual será restituido al término del contrato, previa verificación del estado de la propiedad y cumplimiento de todas las obligaciones contractuales.

QUINTO: OBLIGACIONES DEL ARRENDATARIO

El Arrendatario se obliga a:
1. Pagar puntualmente el precio del arriendo y gastos comunes.
2. Destinar la propiedad exclusivamente a habitación familiar, no pudiendo subarrendar total o parcialmente.
3. Conservar la propiedad en buen estado, realizando las reparaciones locativas menores.
4. Permitir el ingreso del Arrendador para inspeccionar la propiedad con aviso previo.
5. Comunicar inmediatamente cualquier desperfecto o daño que ocurra en la propiedad.
6. No realizar modificaciones sin autorización previa y escrita del Arrendador.
7. Mantener la propiedad en condiciones de higiene y salubridad.

SEXTO: OBLIGACIONES DEL ARRENDADOR

El Arrendador se obliga a:
1. Entregar la propiedad en perfectas condiciones de habitabilidad.
2. Realizar las reparaciones mayores y mantener la propiedad en condiciones adecuadas.
3. Respetar el uso pacífico de la propiedad por parte del Arrendatario.
4. Emitir comprobante de pago mensual.

SÉPTIMO: TERMINACIÓN DEL CONTRATO

El contrato terminará por:
1. Vencimiento del plazo pactado.
2. Mutuo acuerdo de las partes.
3. Resolución anticipada por falta de pago por más de 3 meses.
4. Por cualquier causa legal que lo justifique.

OCTAVO: LEGISLACIÓN APLICABLE

Este contrato se rige por las disposiciones de la Ley N° 18.101 sobre Arrendamiento de Bienes Raíces Urbanos y demás normas legales vigentes en la República de Chile.

NOVENO: DOMICILIO Y NOTIFICACIONES

Para todos los efectos legales derivados de este contrato, las partes fijan domicilio en las direcciones indicadas al inicio. Las notificaciones se efectuarán válidamente en dichos domicilios.

DÉCIMO: CLÁUSULA COMPROMISORIA

Cualquier controversia que surja de la interpretación o cumplimiento del presente contrato será sometida al conocimiento de los tribunales ordinarios de justicia de [Ciudad donde se someterán las controversias].

Se firman dos ejemplares del mismo tenor, quedando uno en poder de cada parte.

[Espacio para firmas]

Arrendador: ___________________________                Arrendatario: ___________________________`,
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
            brokerId: null,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            monthlyRent: 550000,
            deposit: 550000,
            status: 'ACTIVE',
            terms: 'Contrato de arriendo estándar con cláusulas de mantenimiento y reparaciones',
            signedAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            terminatedAt: null,
          },
          {
            id: '2',
            contractNumber: 'CNT-002-2024',
            propertyId: 'prop-2',
            ownerId: 'user-owner-2',
            tenantId: 'user-tenant-2',
            brokerId: 'user-broker-1',
            startDate: new Date('2024-02-15'),
            endDate: new Date('2025-02-14'),
            monthlyRent: 350000,
            deposit: 350000,
            status: 'ACTIVE',
            terms: 'Contrato de oficina con servicios incluidos y cláusula de renovación automática',
            signedAt: new Date('2024-02-15'),
            createdAt: new Date('2024-02-15'),
            updatedAt: new Date('2024-02-15'),
            terminatedAt: null,
          },
          {
            id: '3',
            contractNumber: 'CNT-003-2024',
            propertyId: 'prop-3',
            ownerId: 'user-owner-3',
            tenantId: 'user-tenant-3',
            brokerId: null,
            startDate: new Date('2024-03-01'),
            endDate: new Date('2025-02-28'),
            monthlyRent: 1200000,
            deposit: 1200000,
            status: 'ACTIVE',
            terms: 'Contrato premium de casa familiar con jardín y estacionamiento privado',
            signedAt: new Date('2024-03-01'),
            createdAt: new Date('2024-03-01'),
            updatedAt: new Date('2024-03-01'),
            terminatedAt: null,
          },
          {
            id: '4',
            contractNumber: 'CNT-004-2023',
            propertyId: 'prop-4',
            ownerId: 'user-owner-4',
            tenantId: 'user-tenant-4',
            brokerId: 'user-broker-2',
            startDate: new Date('2023-06-01'),
            endDate: new Date('2024-05-31'),
            monthlyRent: 280000,
            deposit: 280000,
            status: 'EXPIRED',
            terms: 'Contrato de estudio terminado por vencimiento de plazo',
            signedAt: new Date('2023-06-01'),
            createdAt: new Date('2023-06-01'),
            updatedAt: new Date('2024-06-01'),
            terminatedAt: new Date('2024-05-31'),
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
        contract.propertyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.ownerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.tenantId.toLowerCase().includes(searchQuery.toLowerCase()),
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
        brokerId: null,
        startDate: new Date(newContract.startDate),
        endDate: new Date(newContract.endDate),
        monthlyRent: parseInt(newContract.monthlyRent || '0'),
        deposit: parseInt(newContract.deposit || '0') || parseInt(newContract.monthlyRent || '0'),
        status: newContract.status,
        terms: newContract.terms || 'Términos estándar del contrato de arriendo',
        signedAt: now,
        createdAt: now,
        updatedAt: now,
        terminatedAt: null,
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setContracts([contractData, ...contracts]);
      setShowCreateModal(false);
      setNewContract({
        title: '',
        propertyId: '',
        ownerId: '',
        tenantId: '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
        deposit: '',
        status: 'DRAFT',
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Rent360 Admin</h2>
          </div>
        </div>
        <div className="flex-1">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Contratos</h1>
            <p className="text-gray-600 mt-1">Administra todos los contratos del sistema</p>
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
                    placeholder="Buscar por número de contrato, ID de propiedad, propietario o inquilino..."
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
                            <span>Propiedad ID: {contract.propertyId}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Propietario ID: {contract.ownerId}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Inquilino ID: {contract.tenantId}</span>
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
                  Plantillas de Contrato
                </label>
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewContract({...newContract, terms: `CONTRATO DE ARRIENDO

En [Ciudad], a [Día] de [Mes] de [Año], entre:

ARRendADOR: [Nombre Completo del Arrendador], [RUT del Arrendador], domiciliado en [Dirección del Arrendador], [Comuna], [Región], en adelante "el Arrendador".

ARRENDATARIO: [Nombre Completo del Arrendatario], [RUT del Arrendatario], domiciliado en [Dirección del Arrendatario], [Comuna], [Región], en adelante "el Arrendatario".

Se ha convenido el siguiente CONTRATO DE ARRIENDO, conforme a las disposiciones de la Ley N° 18.101 y demás normas legales vigentes.

PRIMERO: OBJETO DEL CONTRATO

El Arrendador da en arriendo al Arrendatario y este acepta, la propiedad ubicada en [Dirección Completa de la Propiedad], [Comuna], [Región], consistente en [Descripción detallada de la propiedad: tipo, número de habitaciones, baños, etc.], con una superficie aproximada de [Superficie] m².

SEGUNDO: PLAZO DEL ARRIENDO

El presente contrato tendrá una duración de [Número de meses/años], contado desde el [Fecha de inicio] hasta el [Fecha de término], prorrogándose automáticamente por períodos iguales, salvo aviso de no renovación dado por escrito por cualquiera de las partes con [Número] meses de anticipación.

TERCERO: PRECIO Y FORMA DE PAGO

El precio del arriendo mensual será de $[Monto en letras] pesos ($[Monto en números]), pagaderos por mensualidades anticipadas, los primeros 5 días de cada mes.

El Arrendatario deberá pagar además los siguientes gastos comunes: [Especificar qué gastos paga el arrendatario].

CUARTO: DEPÓSITO

El Arrendatario entrega en este acto un depósito de garantía por la suma de $[Monto depósito en letras] pesos ($[Monto depósito en números]), el cual será restituido al término del contrato, previa verificación del estado de la propiedad y cumplimiento de todas las obligaciones contractuales.

QUINTO: OBLIGACIONES DEL ARRENDATARIO

El Arrendatario se obliga a:
1. Pagar puntualmente el precio del arriendo y gastos comunes.
2. Destinar la propiedad exclusivamente a habitación familiar, no pudiendo subarrendar total o parcialmente.
3. Conservar la propiedad en buen estado, realizando las reparaciones locativas menores.
4. Permitir el ingreso del Arrendador para inspeccionar la propiedad con aviso previo.
5. Comunicar inmediatamente cualquier desperfecto o daño que ocurra en la propiedad.
6. No realizar modificaciones sin autorización previa y escrita del Arrendador.
7. Mantener la propiedad en condiciones de higiene y salubridad.

SEXTO: OBLIGACIONES DEL ARRENDADOR

El Arrendador se obliga a:
1. Entregar la propiedad en perfectas condiciones de habitabilidad.
2. Realizar las reparaciones mayores y mantener la propiedad en condiciones adecuadas.
3. Respetar el uso pacífico de la propiedad por parte del Arrendatario.
4. Emitir comprobante de pago mensual.

SÉPTIMO: TERMINACIÓN DEL CONTRATO

El contrato terminará por:
1. Vencimiento del plazo pactado.
2. Mutuo acuerdo de las partes.
3. Resolución anticipada por falta de pago por más de 3 meses.
4. Por cualquier causa legal que lo justifique.

OCTAVO: LEGISLACIÓN APLICABLE

Este contrato se rige por las disposiciones de la Ley N° 18.101 sobre Arrendamiento de Bienes Raíces Urbanos y demás normas legales vigentes en la República de Chile.

NOVENO: DOMICILIO Y NOTIFICACIONES

Para todos los efectos legales derivados de este contrato, las partes fijan domicilio en las direcciones indicadas al inicio. Las notificaciones se efectuarán válidamente en dichos domicilios.

DÉCIMO: CLÁUSULA COMPROMISORIA

Cualquier controversia que surja de la interpretación o cumplimiento del presente contrato será sometida al conocimiento de los tribunales ordinarios de justicia de [Ciudad donde se someterán las controversias].

Se firman dos ejemplares del mismo tenor, quedando uno en poder de cada parte.

[Espacio para firmas]

Arrendador: ___________________________                Arrendatario: ___________________________`})}
                  >
                    Residencial
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewContract({...newContract, terms: `CONTRATO DE ARRIENDO COMERCIAL

En [Ciudad], a [Día] de [Mes] de [Año], entre:

ARRendADOR: [Nombre Completo del Arrendador], [RUT del Arrendador], domiciliado en [Dirección del Arrendador], [Comuna], [Región], en adelante "el Arrendador".

ARRENDATARIO: [Nombre Completo del Arrendatario], [RUT del Arrendatario], domiciliado en [Dirección del Arrendatario], [Comuna], [Región], en adelante "el Arrendatario".

Se ha convenido el siguiente CONTRATO DE ARRIENDO COMERCIAL, conforme a las disposiciones de la Ley N° 18.101 y demás normas legales vigentes.

PRIMERO: OBJETO DEL CONTRATO

El Arrendador da en arriendo al Arrendatario y este acepta, el local comercial ubicado en [Dirección Completa del Local], [Comuna], [Región], consistente en [Descripción detallada del local: tipo de comercio, superficie, etc.], con una superficie aproximada de [Superficie] m², destinado exclusivamente a [Actividad comercial específica].

SEGUNDO: PLAZO DEL ARRIENDO

El presente contrato tendrá una duración de [Número de meses/años], contado desde el [Fecha de inicio] hasta el [Fecha de término].

TERCERO: PRECIO Y FORMA DE PAGO

El precio del arriendo mensual será de $[Monto en letras] pesos ($[Monto en números]), pagaderos por mensualidades anticipadas, los primeros 5 días de cada mes.

CUARTO: DEPÓSITO

El Arrendatario entrega en este acto un depósito de garantía por la suma de $[Monto depósito en letras] pesos ($[Monto depósito en números]), equivalente a [Número] meses de arriendo.

QUINTO: OBLIGACIONES DEL ARRENDATARIO

El Arrendatario se obliga a:
1. Pagar puntualmente el precio del arriendo.
2. Destinar el local exclusivamente a [Actividad comercial específica].
3. Mantener el local en buen estado de conservación.
4. No realizar modificaciones estructurales sin autorización.
5. Cumplir con todas las normativas municipales y sanitarias.
6. Permitir inspecciones con aviso previo.

SEXTO: OBLIGACIONES DEL ARRENDADOR

El Arrendador se obliga a:
1. Entregar el local en condiciones adecuadas para su destino.
2. Mantener las instalaciones comunes en buen estado.
3. Proporcionar servicios básicos acordados.

SÉPTIMO: CLAUSULAS ESPECIALES

1. Horario de funcionamiento: [Especificar horario].
2. Renovación automática: [Condiciones de renovación].
3. Prohibición de competencia: [Cláusula de no competencia si aplica].

OCTAVO: LEGISLACIÓN APLICABLE

Este contrato se rige por las disposiciones de la Ley N° 18.101 y el Código de Comercio.

Se firman dos ejemplares del mismo tenor.

Arrendador: ___________________________                Arrendatario: ___________________________`})}
                  >
                    Comercial
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewContract({...newContract, terms: `CONTRATO DE ARRIENDO TEMPORADO

En [Ciudad], a [Día] de [Mes] de [Año], entre:

PROPIETARIO: [Nombre Completo del Propietario], [RUT del Propietario], en adelante "el Propietario".

ARRENDATARIO: [Nombre Completo del Arrendatario], [RUT del Arrendatario], en adelante "el Arrendatario".

Se ha convenido el siguiente CONTRATO DE ARRIENDO TEMPORADO para fines turísticos/transitorios.

PRIMERO: OBJETO

Se arrienda la propiedad ubicada en [Dirección completa], por un período máximo de [Número] días, desde [Fecha inicio] hasta [Fecha término].

SEGUNDO: PRECIO

El precio total del arriendo es de $[Monto total en letras] pesos ($[Monto total en números]), pagaderos [Forma de pago: al contado/anticipado/etc.].

TERCERO: CONDICIONES

1. El arriendo es por temporada/cort plazo, no pudiendo exceder [Número máximo] días continuos.
2. No se permite subarriendo ni cesión de derechos.
3. El Arrendatario debe respetar normas de convivencia y horarios.
4. Depósito de garantía: $[Monto depósito].

Se firman dos ejemplares.

Propietario: ___________________________                Arrendatario: ___________________________`})}
                  >
                    Temporada
                  </Button>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Términos y Condiciones (Editable)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={15}
                  value={newContract.terms}
                  onChange={(e) => setNewContract({...newContract, terms: e.target.value})}
                  placeholder="Seleccione una plantilla arriba o escriba los términos personalizados..."
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
          </div>
        </div>
      </div>
    </div>
  );
}
