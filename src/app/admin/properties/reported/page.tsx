'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Filter, Search, AlertTriangle, Eye, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Property } from '@/types';

interface Report {
  id: string;
  propertyId: string;
  reporterId: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  createdAt: Date;
  property?: Property;
  reporter?: {
    name: string;
    email: string;
  };
}

export default function AdminReportedPropertiesPage() {
  const [reports, setReports] = useState<Report[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Simular datos mientras no exista la API
      const mockReports: Report[] = [
        {
          id: '1',
          propertyId: 'prop1',
          reporterId: 'user1',
          reason: 'Informaci�n falsa',
          description: 'La propiedad no existe en la direcci�n indicada',
          status: 'OPEN',
          createdAt: new Date('2024-01-15'),
          property: {
            id: '1',
            title: 'Departamento en Providencia',
            description: 'Hermoso departamento en el coraz�n de Providencia',
            address: 'Av. Providencia 1234',
            city: 'Santiago',
            commune: 'Providencia',
            region: 'Metropolitana',
            price: 850000,
            deposit: 850000,
            bedrooms: 2,
            bathrooms: 1,
            area: 65,
            status: 'AVAILABLE' as any,
            type: 'APARTMENT' as any,
            views: 125,
            inquiries: 18,
            ownerId: 'owner-1',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            features: 'Estacionamiento, Seguridad 24/7',
            images: '/images/prop1-1.jpg, /images/prop1-2.jpg',
          },
          reporter: {
            name: 'Juan P�rez',
            email: 'juan@example.com',
          },
        },
        {
          id: '2',
          propertyId: 'prop2',
          reporterId: 'user2',
          reason: 'Fotos enga�osas',
          description: 'Las fotos no corresponden al estado actual de la propiedad',
          status: 'INVESTIGATING',
          createdAt: new Date('2024-01-12'),
          property: {
            id: '2',
            title: 'Casa en Las Condes',
            description: 'Casa familiar en sector residencial',
            address: 'Av. Las Condes 5678',
            city: 'Santiago',
            commune: 'Las Condes',
            region: 'Metropolitana',
            price: 1200000,
            deposit: 1200000,
            bedrooms: 3,
            bathrooms: 2,
            area: 120,
            status: 'AVAILABLE' as any,
            type: 'HOUSE' as any,
            views: 89,
            inquiries: 15,
            ownerId: 'owner-2',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-10'),
            features: 'Jard�n, Estacionamiento, Seguridad',
            images: '/images/prop2-1.jpg, /images/prop2-2.jpg',
          },
          reporter: {
            name: 'Mar�a Gonz�lez',
            email: 'maria@example.com',
          },
        },
      ];
      setReports(mockReports);
    } catch (error) {
      logger.error('Error fetching reports:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch =
      report.property?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.property?.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (
    reportId: string,
    status: 'OPEN' | 'RESOLVED' | 'INVESTIGATING' | 'DISMISSED'
  ) => {
    try {
      // Simular actualizaci�n
      setReports(prev =>
        prev.map(report => (report.id === reportId ? { ...report, status } : report))
      );
    } catch (error) {
      logger.error('Error updating report status:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="destructive">Abierto</Badge>;
      case 'INVESTIGATING':
        return <Badge variant="default">Investigando</Badge>;
      case 'RESOLVED':
        return <Badge variant="secondary">Resuelto</Badge>;
      case 'DISMISSED':
        return <Badge variant="outline">Descartado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Cargando propiedades reportadas...</p>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Propiedades Reportadas"
      subtitle="Gestiona las propiedades reportadas por usuarios"
    >
      <div className="space-y-6">
        {/* Filtros y B�squeda */}
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
                  placeholder="Buscar por propiedad, raz�n o reportador..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="OPEN">Abierto</SelectItem>
                  <SelectItem value="INVESTIGATING">Investigando</SelectItem>
                  <SelectItem value="RESOLVED">Resuelto</SelectItem>
                  <SelectItem value="DISMISSED">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Estad�sticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reportes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredReports.length}</div>
              <p className="text-xs text-muted-foreground">Reportes totales</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abiertos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {filteredReports.filter(r => r.status === 'OPEN').length}
              </div>
              <p className="text-xs text-muted-foreground">Requieren atenci�n</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investigando</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {filteredReports.filter(r => r.status === 'INVESTIGATING').length}
              </div>
              <p className="text-xs text-muted-foreground">En investigaci�n</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {filteredReports.filter(r => r.status === 'RESOLVED').length}
              </div>
              <p className="text-xs text-muted-foreground">Casos cerrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Reportes */}
        <Card>
          <CardHeader>
            <CardTitle>Reportes de Propiedades</CardTitle>
            <CardDescription>Lista de propiedades reportadas por usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Raz�n</TableHead>
                  <TableHead>Reportador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.property?.title}</div>
                        <div className="text-sm text-gray-500">{report.property?.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.reason}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {report.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.reporter?.name}</div>
                        <div className="text-sm text-gray-500">{report.reporter?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(`/admin/properties/${report.propertyId}`, '_blank')
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {report.status === 'OPEN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(report.id, 'INVESTIGATING')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Investigar
                          </Button>
                        )}
                        {report.status === 'INVESTIGATING' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              Descartar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredReports.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron reportes de propiedades
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
