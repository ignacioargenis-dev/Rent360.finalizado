'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { ArrowLeft, Save } from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Property } from '@/types';

export default function PropertyEditPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    commune: '',
    region: '',
    price: '',
    deposit: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    type: '',
    status: '',
  });

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${params?.id}`);
        if (response.ok) {
          const data = await response.json();
          setProperty(data.property);
          setFormData({
            title: data.property.title || '',
            description: data.property.description || '',
            address: data.property.address || '',
            city: data.property.city || '',
            commune: data.property.commune || '',
            region: data.property.region || '',
            price: data.property.price?.toString() || '',
            deposit: data.property.deposit?.toString() || '',
            bedrooms: data.property.bedrooms?.toString() || '',
            bathrooms: data.property.bathrooms?.toString() || '',
            area: data.property.area?.toString() || '',
            type: data.property.type || '',
            status: data.property.status || '',
          });
        }
      } catch (error) {
        console.error('Error loading property:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      loadProperty();
    }
  }, [params?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/properties/${params?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          deposit: parseFloat(formData.deposit),
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          area: parseFloat(formData.area),
        }),
      });

      if (response.ok) {
        router.push(`/admin/properties/${params?.id}`);
      } else {
        console.error('Error updating property');
      }
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!property) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Propiedad no encontrada</div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Editar Propiedad</h1>
              <p className="text-gray-600">{property.title}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="commune">Comuna</Label>
                    <Input
                      id="commune"
                      value={formData.commune}
                      onChange={e => handleInputChange('commune', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="region">Región</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={e => handleInputChange('region', e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Propiedad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Precio (CLP)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={e => handleInputChange('price', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deposit">Depósito (CLP)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      value={formData.deposit}
                      onChange={e => handleInputChange('deposit', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Dormitorios</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={e => handleInputChange('bedrooms', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Baños</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={e => handleInputChange('bathrooms', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="area">Área (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={formData.area}
                      onChange={e => handleInputChange('area', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={value => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APARTMENT">Apartamento</SelectItem>
                        <SelectItem value="HOUSE">Casa</SelectItem>
                        <SelectItem value="STUDIO">Estudio</SelectItem>
                        <SelectItem value="ROOM">Habitación</SelectItem>
                        <SelectItem value="OFFICE">Oficina</SelectItem>
                        <SelectItem value="COMMERCIAL">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={value => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Disponible</SelectItem>
                        <SelectItem value="PENDING">Pendiente</SelectItem>
                        <SelectItem value="RENTED">Arrendada</SelectItem>
                        <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
