'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar,
  Star,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Users,
  Building
} from 'lucide-react';
interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'prospect' | 'active' | 'inactive';
  type: 'buyer' | 'renter' | 'investor';
  budget?: number;
  preferredAreas?: string[];
  notes?: string;
  lastContact?: Date;
  createdAt: Date;
  assignedProperties?: number;
  conversionRate?: number;
}

export default function BrokerProspectsPage() {

  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [typeFilter, setTypeFilter] = useState('all');

  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      // Simular datos de clientes potenciales
      const mockClients: Client[] = [
        {
          id: '1',
          name: 'Ana Martínez',
          email: 'ana.martinez@example.com',
          phone: '+56 9 1234 5678',
          status: 'prospect',
          type: 'renter',
          budget: 500000,
          preferredAreas: ['Las Condes', 'Vitacura', 'Providencia'],
          notes: 'Busca departamento de 2 dormitorios, amueblado preferiblemente',
          lastContact: new Date('2024-07-10'),
          createdAt: new Date('2024-07-01'),
          assignedProperties: 3,
          conversionRate: 75,
        },
        {
          id: '2',
          name: 'Luis Fernández',
          email: 'luis.fernandez@example.com',
          phone: '+56 9 8765 4321',
          status: 'prospect',
          type: 'buyer',
          budget: 200000000,
          preferredAreas: ['Lo Barnechea', 'La Reina'],
          notes: 'Interesado en invertir en propiedades comerciales',
          lastContact: new Date('2024-07-12'),
          createdAt: new Date('2024-07-05'),
          assignedProperties: 5,
          conversionRate: 60,
        },
        {
          id: '3',
          name: 'Carla Silva',
          email: 'carla.silva@example.com',
          phone: '+56 9 2345 6789',
          status: 'prospect',
          type: 'investor',
          budget: 500000000,
          preferredAreas: ['Santiago Centro', 'Providencia', 'Las Condes'],
          notes: 'Busca portafolio de propiedades para arrendar',
          lastContact: new Date('2024-07-08'),
          createdAt: new Date('2024-06-28'),
          assignedProperties: 8,
          conversionRate: 85,
        },
      ];
      setClients(mockClients);
    } catch (error) {
      logger.error('Error fetching clients:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone?.includes(searchTerm) ||
                         client.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleContactClient = async (clientId: string) => {
    try {
      alert('Sistema de contacto iniciado');
    } catch (error) {
      logger.error('Error contacting client:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleViewDetails = (clientId: string) => {
    window.open(`/broker/clients/${clientId}`, '_blank');
  };

  const handleConvertToActive = async (clientId: string) => {
    try {
      setClients(clients.map(client => 
        client.id === clientId ? { ...client, status: 'active' as const } : client,
      ));
      alert('Cliente convertido a activo exitosamente');
    } catch (error) {
      logger.error('Error converting client:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'prospect':
        return <Badge variant="secondary">Potencial</Badge>;
      case 'active':
        return <Badge variant="default">Activo</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactivo</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'buyer':
        return <Badge variant="outline">Comprador</Badge>;
      case 'renter':
        return <Badge variant="outline">Arrendatario</Badge>;
      case 'investor':
        return <Badge variant="outline">Inversionista</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getDaysSinceLastContact = (lastContact?: Date) => {
    if (!lastContact) {
return 'Nunca';
}
    const days = Math.floor((new Date().getTime() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) {
return 'Hoy';
}
    if (days === 1) {
return 'Ayer';
}
    return `Hace ${days} días`;
  };

  if (loading) {
    return (
      <EnhancedDashboardLayout title="Clientes Potenciales" subtitle="Gestiona tus clientes potenciales y oportunidades">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  const totalProspects = clients.length;
  const highValueProspects = clients.filter(c => c.budget && c.budget > 100000000).length;
  const avgConversionRate = clients.length > 0 ? clients.reduce((sum, c) => sum + (c.conversionRate || 0), 0) / clients.length : 0;

  return (
    <EnhancedDashboardLayout title="Clientes Potenciales" subtitle="Gestiona tus clientes potenciales y oportunidades">
      <div className="space-y-6">
        {/* Filtros y Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email, teléfono o notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="buyer">Comprador</SelectItem>
                  <SelectItem value="renter">Arrendatario</SelectItem>
                  <SelectItem value="investor">Inversionista</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="prospect">Potencial</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Potenciales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProspects}</div>
              <p className="text-xs text-muted-foreground">Clientes en cartera</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alto Valor</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{highValueProspects}</div>
              <p className="text-xs text-muted-foreground">Presupuesto &gt; $100M</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Promedio general</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propiedades Asignadas</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.reduce((sum, c) => sum + (c.assignedProperties || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total asignadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes Potenciales</CardTitle>
            <CardDescription>
              Lista de clientes potenciales con sus características y estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Último Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tasa Conversión</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                        {client.phone && (
                          <div className="text-xs text-gray-400">{client.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(client.type)}</TableCell>
                    <TableCell>
                      {client.budget ? `$${client.budget.toLocaleString()}` : 'No especificado'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getDaysSinceLastContact(client.lastContact)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{client.conversionRate || 0}%</span>
                        {client.conversionRate && client.conversionRate >= 80 && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactClient(client.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(client.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {client.status === 'prospect' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConvertToActive(client.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/broker/clients/${client.id}/edit`, '_blank')}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredClients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron clientes potenciales
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalles de Clientes Destacados */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes Destacados</CardTitle>
            <CardDescription>
              Clientes con mayor potencial de conversión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients
                .filter(c => c.conversionRate && c.conversionRate >= 70)
                .slice(0, 3)
                .map((client) => (
                  <div key={client.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">{client.name}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{client.conversionRate}%</span>
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <span>{client.type === 'buyer' ? 'Comprador' : client.type === 'renter' ? 'Arrendatario' : 'Inversionista'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Presupuesto:</span>
                        <span className="font-medium">
                          {client.budget ? `$${client.budget.toLocaleString()}` : 'No especificado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Propiedades:</span>
                        <span>{client.assignedProperties || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Último contacto:</span>
                        <span>{getDaysSinceLastContact(client.lastContact)}</span>
                      </div>
                    </div>
                    
                    {client.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium mb-1">Notas:</div>
                        <div className="text-gray-600">{client.notes}</div>
                      </div>
                    )}
                    
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleContactClient(client.id)}
                        className="flex-1"
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Contactar
                      </Button>
                      {client.status === 'prospect' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConvertToActive(client.id)}
                          className="flex-1"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Convertir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </EnhancedDashboardLayout>
  );
}
