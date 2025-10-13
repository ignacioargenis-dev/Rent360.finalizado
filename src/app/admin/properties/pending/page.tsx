'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';


import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Filter, Search, Eye, CheckCircle, XCircle } from 'lucide-react';

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

export default function AdminPendingPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties?status=PENDING');
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      logger.error('Error fetching properties:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApproveProperty = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });

      if (response.ok) {
        await fetchProperties();
      }
    } catch (error) {
      logger.error('Error approving property:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleRejectProperty = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (response.ok) {
        await fetchProperties();
      }
    } catch (error) {
      logger.error('Error rejecting property:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Cargando propiedades pendientes...</p>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Propiedades Pendientes"
      subtitle="Gestiona las propiedades pendientes de aprobaci�n"
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
                  placeholder="Buscar por t�tulo o direcci�n..."
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
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="UNDER_REVIEW">En revisi�n</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Estad�sticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredProperties.length}</div>
              <p className="text-xs text-muted-foreground">Propiedades por revisar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Aprobar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredProperties.filter(p => p.status === ('PENDING_REVIEW' as any)).length}
              </div>
              <p className="text-xs text-muted-foreground">Esperando aprobaci�n</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Revisi�n</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredProperties.filter(p => p.status === ('UNDER_REVIEW' as any)).length}
              </div>
              <p className="text-xs text-muted-foreground">Siendo revisadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Propiedades */}
        <Card>
          <CardHeader>
            <CardTitle>Propiedades Pendientes</CardTitle>
            <CardDescription>
              Lista de propiedades que requieren aprobaci�n para ser publicadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Direcci�n</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map(property => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.title}</div>
                        <div className="text-sm text-gray-500">
                          {property.bedrooms} hab � {property.bathrooms} ba�os � {property.area}m�
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{property.address}</TableCell>
                    <TableCell>${property.price.toLocaleString()}</TableCell>
                    <TableCell>Usuario #{property.ownerId}</TableCell>
                    <TableCell>
                      <Badge variant={property.status === 'PENDING' ? 'secondary' : 'default'}>
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(property.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/admin/properties/${property.id}`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveProperty(property.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectProperty(property.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredProperties.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron propiedades pendientes
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
