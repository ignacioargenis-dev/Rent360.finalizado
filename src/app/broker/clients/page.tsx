'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  MessageCircle,
  Star,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Eye,
  Edit,
  FileText,
} from 'lucide-react';
import { User as UserType } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';
import { DataTable } from '@/components/ui/data-table';
import { usePagination } from '@/hooks/usePagination';
import { useFilters } from '@/hooks/useFilters';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'OWNER' | 'TENANT' | 'BOTH';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  totalProperties: number;
  activeContracts: number;
  totalRevenue: number;
  lastContact: string;
  nextFollowUp?: string;
  averageRating: number;
  properties: Array<{
    id: string;
    title: string;
    address: string;
    status: string;
  }>;
  notes?: string;
  preferences: {
    contactMethod: 'email' | 'phone' | 'whatsapp';
    propertyTypes: string[];
    budgetRange: {
      min: number;
      max: number;
    };
    locations: string[];
  };
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  totalRevenue: number;
  averageRating: number;
  conversionRate: number;
}

export default function BrokerClientsPage() {
  const { user, loading: userLoading } = useUserState();

  const [clients, setClients] = useState<Client[]>([]);

  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    newClientsThisMonth: 0,
    totalRevenue: 0,
    averageRating: 0,
    conversionRate: 0,
  });

  const [loading, setLoading] = useState(true);
  
  // Pagination hook
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 10,
  });
  
  // Filters hook
  const filters = useFilters({
    fields: [
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        options: [
          { value: 'OWNER', label: 'Propietario' },
          { value: 'TENANT', label: 'Inquilino' },
          { value: 'BOTH', label: 'Ambos' },
        ],
        placeholder: 'Todos los tipos',
      },
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        options: [
          { value: 'ACTIVE', label: 'Activo' },
          { value: 'INACTIVE', label: 'Inactivo' },
          { value: 'PENDING', label: 'Pendiente' },
        ],
        placeholder: 'Todos los estados',
      },
    ],
  });


  const [searchQuery, setSearchQuery] = useState('');

  const filterFields = [
    { key: 'name', label: 'Nombre', type: 'text' as const },
    { key: 'email', label: 'Email', type: 'text' as const },
    { key: 'phone', label: 'Teléfono', type: 'text' as const },
    { key: 'role', label: 'Rol', type: 'select' as const, options: [
      { value: 'tenant', label: 'Inquilino' },
      { value: 'owner', label: 'Propietario' },
    ]},
  ];

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      const mockClients: Client[] = [
        {
          id: '1',
          name: 'María González',
          email: 'maria@ejemplo.com',
          phone: '+56 9 1234 5678',
          type: 'OWNER',
          status: 'ACTIVE',
          totalProperties: 3,
          activeContracts: 2,
          totalRevenue: 8500000,
          lastContact: '2024-03-15',
          nextFollowUp: '2024-03-20',
          averageRating: 4.8,
          properties: [
            {
              id: '1',
              title: 'Departamento Las Condes',
              address: 'Av. Apoquindo 3400, Las Condes',
              status: 'RENTED',
            },
            {
              id: '2',
              title: 'Oficina Providencia',
              address: 'Av. Providencia 1245, Providencia',
              status: 'RENTED',
            },
          ],
          notes: 'Cliente excelente, siempre puntual con los pagos. Prefiere comunicación por email.',
          preferences: {
            contactMethod: 'email',
            propertyTypes: ['apartment', 'office'],
            budgetRange: { min: 300000, max: 1500000 },
            locations: ['Las Condes', 'Providencia', 'Vitacura'],
          },
        },
        {
          id: '2',
          name: 'Carlos Ramírez',
          email: 'carlos@ejemplo.com',
          phone: '+56 9 8765 4321',
          type: 'TENANT',
          status: 'ACTIVE',
          totalProperties: 1,
          activeContracts: 1,
          totalRevenue: 6600000,
          lastContact: '2024-03-14',
          nextFollowUp: '2024-03-18',
          averageRating: 4.9,
          properties: [
            {
              id: '1',
              title: 'Departamento Las Condes',
              address: 'Av. Apoquindo 3400, Las Condes',
              status: 'RENTED',
            },
          ],
          notes: 'Buscando propiedad para su familia. Presupuesto flexible.',
          preferences: {
            contactMethod: 'whatsapp',
            propertyTypes: ['apartment', 'house'],
            budgetRange: { min: 400000, max: 800000 },
            locations: ['Las Condes', 'Vitacura', 'Lo Barnechea'],
          },
        },
        {
          id: '3',
          name: 'Ana Martínez',
          email: 'ana@ejemplo.com',
          phone: '+56 9 2345 6789',
          type: 'OWNER',
          status: 'PENDING',
          totalProperties: 1,
          activeContracts: 0,
          totalRevenue: 0,
          lastContact: '2024-03-13',
          nextFollowUp: '2024-03-16',
          averageRating: 0,
          properties: [
            {
              id: '3',
              title: 'Casa Vitacura',
              address: 'Av. Vitacura 8900, Vitacura',
              status: 'AVAILABLE',
            },
          ],
          notes: 'Nueva propietaria, necesita orientación sobre precios de mercado.',
          preferences: {
            contactMethod: 'phone',
            propertyTypes: ['house'],
            budgetRange: { min: 800000, max: 2000000 },
            locations: ['Vitacura', 'Lo Barnechea'],
          },
        },
        {
          id: '4',
          name: 'Pedro Silva',
          email: 'pedro@ejemplo.com',
          phone: '+56 9 3456 7890',
          type: 'TENANT',
          status: 'INACTIVE',
          totalProperties: 0,
          activeContracts: 0,
          totalRevenue: 0,
          lastContact: '2024-02-15',
          averageRating: 4.2,
          properties: [],
          notes: 'Encontró propiedad por su cuenta. Mantener contacto para futuras oportunidades.',
          preferences: {
            contactMethod: 'email',
            propertyTypes: ['apartment'],
            budgetRange: { min: 250000, max: 500000 },
            locations: ['Providencia', 'Santiago Centro'],
          },
        },
        {
          id: '5',
          name: 'Empresa Soluciones Ltda.',
          email: 'contacto@soluciones.cl',
          phone: '+56 2 2345 6789',
          type: 'BOTH',
          status: 'ACTIVE',
          totalProperties: 2,
          activeContracts: 2,
          totalRevenue: 8400000,
          lastContact: '2024-03-15',
          nextFollowUp: '2024-03-25',
          averageRating: 4.7,
          properties: [
            {
              id: '2',
              title: 'Oficina Providencia',
              address: 'Av. Providencia 1245, Providencia',
              status: 'RENTED',
            },
            {
              id: '4',
              title: 'Local Comercial',
              address: 'Ahumada 456, Santiago',
              status: 'RENTED',
            },
          ],
          notes: 'Cliente corporativo, busca expandir sus oficinas. Contacto principal: Juan Pérez.',
          preferences: {
            contactMethod: 'email',
            propertyTypes: ['office', 'commercial'],
            budgetRange: { min: 300000, max: 2000000 },
            locations: ['Providencia', 'Santiago Centro', 'Las Condes'],
          },
        },
      ];

      setClients(mockClients);
      pagination.updateTotal(mockClients.length);
      
      // Calculate stats
      const totalClients = mockClients.length;
      const activeClients = mockClients.filter(c => c.status === 'ACTIVE').length;
      const newClientsThisMonth = mockClients.filter(c => {
        const contactDate = new Date(c.lastContact);
        const now = new Date();
        return contactDate.getMonth() === now.getMonth() && 
               contactDate.getFullYear() === now.getFullYear();
      }).length;
      const totalRevenue = mockClients.reduce((sum, c) => sum + c.totalRevenue, 0);
      const averageRating = mockClients
        .filter(c => c.averageRating > 0)
        .reduce((sum, c) => sum + c.averageRating, 0) / 
        mockClients.filter(c => c.averageRating > 0).length;
      const conversionRate = (activeClients / totalClients) * 100;

      setStats({
        totalClients,
        activeClients,
        newClientsThisMonth,
        totalRevenue,
        averageRating: Number(averageRating.toFixed(1)),
        conversionRate: Number(conversionRate.toFixed(1)),
      });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'OWNER':
        return <Badge className="bg-blue-100 text-blue-800">Propietario</Badge>;
      case 'TENANT':
        return <Badge className="bg-purple-100 text-purple-800">Inquilino</Badge>;
      case 'BOTH':
        return <Badge className="bg-green-100 text-green-800">Ambos</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Define columns for the data table
  const columns = [
    {
      key: 'name' as keyof Client,
      label: 'Nombre',
      sortable: true,
      render: (value: string, client: Client) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {client.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C'}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{client.name}</div>
            <div className="text-sm text-gray-500">{client.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone' as keyof Client,
      label: 'Teléfono',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="text-gray-600">{value || 'No especificado'}</span>
      ),
    },
    {
      key: 'role' as keyof Client,
      label: 'Rol',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge variant={value === 'tenant' ? 'default' : 'secondary'}>
          {value === 'tenant' ? 'Inquilino' : 'Propietario'}
        </Badge>
      ),
    },
    {
      key: 'status' as keyof Client,
      label: 'Estado',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'default' : 'destructive'}>
          {value === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'createdAt' as keyof Client,
      label: 'Fecha de Registro',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-600">
          {new Date(value).toLocaleDateString('es-CL')}
        </span>
      ),
    },
  ];

  const filteredClients = clients.filter(client => {
    const matchesSearch = !filters.hasActiveFilters || (
      client.name.toLowerCase().includes(filters.getFilterValue('search')?.toLowerCase() || '') ||
      client.email.toLowerCase().includes(filters.getFilterValue('search')?.toLowerCase() || '') ||
      client.phone.includes(filters.getFilterValue('search') || '')
    );
    const matchesType = !filters.getFilterValue('type') || client.type === filters.getFilterValue('type');
    const matchesStatus = !filters.getFilterValue('status') || client.status === filters.getFilterValue('status');
    return matchesSearch && matchesType && matchesStatus;
  });

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader 
        user={user}
        title="Gestión de Clientes"
        subtitle="Administra tu cartera de clientes y prospectos"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeClients}</p>
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
                  <p className="text-sm font-medium text-gray-600">Nuevos Este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newClientsThisMonth}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Calificación</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa Conversión</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <DataTable
          data={filteredClients}
          columns={columns}
                     pagination={pagination as any}
           filters={{ ...filters, fields: filterFields }}
          loading={loading}
          searchable={true}
          exportable={true}
          refreshable={true}
          onExport={() => {
            // Export functionality
            const csvContent = [
              ['Nombre', 'Email', 'Teléfono', 'Tipo', 'Estado', 'Propiedades', 'Ingresos', 'Calificación', 'Último Contacto'],
              ...filteredClients.map(client => [
                client.name,
                client.email,
                client.phone,
                client.type,
                client.status,
                client.totalProperties,
                client.totalRevenue,
                client.averageRating,
                client.lastContact,
              ]),
            ].map(row => row.join(',')).join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clientes.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
          onRefresh={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1000);
          }}
          emptyMessage="No se encontraron clientes con los filtros actuales"
          loadingMessage="Cargando clientes..."
        />
      </div>
    </DashboardLayout>
  );
}
