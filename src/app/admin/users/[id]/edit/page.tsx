'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, User, Phone, MapPin, FileText } from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { User as UserType } from '@/types';
import { logger } from '@/lib/logger-minimal';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    address: '',
    rutVerified: false,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(`/api/users/${params?.id}`);
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setFormData({
            name: data.user.name || '',
            bio: data.user.bio || '',
            phone: data.user.phone || '',
            address: data.user.address || '',
            rutVerified: data.user.rutVerified || false,
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      loadUser();
    }
  }, [params?.id]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        logger.info('Usuario actualizado exitosamente', { userId: user.id });
        alert('✅ Usuario actualizado exitosamente.');
        router.push(`/admin/users/${user.id}`);
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Error al actualizar usuario'}`);
      }
    } catch (error) {
      logger.error('Error updating user:', error);
      alert('❌ Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
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

  if (!user) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Usuario no encontrado</div>
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
              <h1 className="text-2xl font-bold">Editar Usuario</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-sm text-gray-500 mt-1">El email no se puede cambiar</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="rutVerified"
                    checked={formData.rutVerified}
                    onCheckedChange={checked => handleInputChange('rutVerified', checked)}
                  />
                  <Label htmlFor="rutVerified">RUT Verificado</Label>
                </div>
              </CardContent>
            </Card>

            {/* Información de Contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Biografía */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Biografía
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={e => handleInputChange('bio', e.target.value)}
                  placeholder="Información adicional sobre el usuario..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
              Cancelar
            </Button>
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
