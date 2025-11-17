'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Wrench, AlertCircle, Upload, X } from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

export default function NewMaintenanceRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const propertyId = searchParams?.get('propertyId') || null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'MEDIUM',
    estimatedCost: '',
    images: [] as File[],
  });

  useEffect(() => {
    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.property) {
          setProperty(data.property);
        }
      }
    } catch (error) {
      logger.error('Error loading property:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!propertyId) {
        throw new Error('ID de propiedad requerido');
      }

      if (!formData.title.trim() || !formData.description.trim()) {
        throw new Error('Título y descripción son obligatorios');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('propertyId', propertyId);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('priority', formData.priority);

      if (formData.estimatedCost) {
        formDataToSend.append('estimatedCost', formData.estimatedCost);
      }

      // Agregar imágenes si hay
      formData.images.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const response = await fetch('/api/maintenance', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear la solicitud');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/owner/maintenance`);
      }, 2000);
    } catch (error) {
      logger.error('Error creating maintenance request:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Mantenimiento</h1>
          {property && (
            <p className="text-gray-600 mt-1">Propiedad: {property.title || property.address}</p>
          )}
        </div>

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">
                  Solicitud creada exitosamente. Redirigiendo...
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Información de la Solicitud
            </CardTitle>
            <CardDescription>
              Completa los detalles de la solicitud de mantenimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Reparación de fuga en baño"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe el problema o trabajo necesario..."
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electrical">Eléctrica</SelectItem>
                      <SelectItem value="plumbing">Plomería</SelectItem>
                      <SelectItem value="structural">Estructural</SelectItem>
                      <SelectItem value="appliance">Electrodomésticos</SelectItem>
                      <SelectItem value="cleaning">Limpieza</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridad *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={value => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Baja</SelectItem>
                      <SelectItem value="MEDIUM">Media</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="estimatedCost">Costo Estimado (CLP) - Opcional</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  value={formData.estimatedCost}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      estimatedCost: e.target.value,
                    }))
                  }
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="images">Imágenes - Opcional</Label>
                <div className="mt-2">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((file, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || success}>
                  {loading ? 'Creando...' : 'Crear Solicitud'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
