'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Shield, 
  Mail, 
  CreditCard, 
  FileText, 
  MapPin, 
  MessageSquare, 
  Database,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/notifications/NotificationSystem';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: 'system' | 'integration' | 'security' | 'email' | 'payment' | 'signature' | 'maps' | 'sms';
  isEncrypted: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SettingFormData {
  key: string;
  value: string;
  description: string;
  category: 'system' | 'integration' | 'security' | 'email' | 'payment' | 'signature' | 'maps' | 'sms';
  isEncrypted: boolean;
  isPublic: boolean;
}

const CATEGORIES = [
  { value: 'system', label: 'Sistema', icon: Settings },
  { value: 'integration', label: 'Integraciones', icon: Database },
  { value: 'security', label: 'Seguridad', icon: Shield },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'payment', label: 'Pagos', icon: CreditCard },
  { value: 'signature', label: 'Firmas', icon: FileText },
  { value: 'maps', label: 'Mapas', icon: MapPin },
  { value: 'sms', label: 'SMS', icon: MessageSquare }
];

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEncrypted, setShowEncrypted] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<SettingFormData>({
    key: '',
    value: '',
    description: '',
    category: 'system',
    isEncrypted: false,
    isPublic: false
  });
  const [activeTab, setActiveTab] = useState('system');
  
  const { success, error } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Error obteniendo configuraciones');
      }

      const data = await response.json();
      setSettings(data.data || []);
    } catch (err) {
      error('Error', 'Error cargando configuraciones: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (editingSetting) {
        // Actualizar configuración existente
        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: editingSetting.key,
            ...formData
          })
        });

        if (!response.ok) {
          throw new Error('Error actualizando configuración');
        }

        success('Éxito', 'Configuración actualizada exitosamente');
      } else {
        // Crear nueva configuración
        const response = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Error creando configuración');
        }

        success('Éxito', 'Configuración creada exitosamente');
      }

      // Limpiar formulario y recargar
      setEditingSetting(null);
      setShowForm(false);
      setFormData({
        key: '',
        value: '',
        description: '',
        category: 'system',
        isEncrypted: false,
        isPublic: false
      });
      
      await fetchSettings();
    } catch (err) {
      error('Error', 'Error guardando configuración: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (setting: SystemSetting) => {
    setEditingSetting(setting);
    setFormData({
      key: setting.key,
      value: setting.value,
      description: setting.description || '',
      category: setting.category,
      isEncrypted: setting.isEncrypted,
      isPublic: setting.isPublic
    });
    setShowForm(true);
  };

  const handleDelete = async (key: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/settings?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error eliminando configuración');
      }

      success('Éxito', 'Configuración eliminada exitosamente');
      await fetchSettings();
    } catch (err) {
      error('Error', 'Error eliminando configuración: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCancel = () => {
    setEditingSetting(null);
    setShowForm(false);
    setFormData({
      key: '',
      value: '',
      description: '',
      category: 'system',
      isEncrypted: false,
      isPublic: false
    });
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : Settings;
  };

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : 'Sistema';
  };

  const filteredSettings = settings.filter(setting => setting.category === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></Loader2>
          <p className="mt-2 text-gray-600">Cargando configuraciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración del Sistema</h1>
          <p className="text-gray-600">
            Gestiona la configuración del sistema, integraciones y credenciales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEncrypted(!showEncrypted)}
          >
            {showEncrypted ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showEncrypted ? 'Ocultar' : 'Mostrar'} Encriptados
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            disabled={showForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Configuración
          </Button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSetting ? 'Editar Configuración' : 'Nueva Configuración'}
            </CardTitle>
            <CardDescription>
              {editingSetting ? 'Modifica los valores de la configuración' : 'Crea una nueva configuración del sistema'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="key">Clave</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="ej: database_url"
                  disabled={!!editingSetting}
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="value">Valor</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Valor de la configuración"
                type={formData.isEncrypted && !showEncrypted ? 'password' : 'text'}
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional de la configuración"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isEncrypted"
                  checked={formData.isEncrypted}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEncrypted: checked })}
                />
                <Label htmlFor="isEncrypted">Valor Encriptado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
                <Label htmlFor="isPublic">Público</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de categorías */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.value} value={category.value} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{category.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const categorySettings = settings.filter(s => s.category === category.value);
          
          return (
            <TabsContent key={category.value} value={category.value}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {category.label}
                  </CardTitle>
                  <CardDescription>
                    {categorySettings.length} configuración{categorySettings.length !== 1 ? 'es' : ''} en esta categoría
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {categorySettings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay configuraciones en esta categoría
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categorySettings.map((setting) => (
                        <div
                          key={setting.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{setting.key}</h4>
                              {setting.isEncrypted && (
                                <Badge variant="secondary" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Encriptado
                                </Badge>
                              )}
                              {setting.isPublic && (
                                <Badge variant="outline" className="text-xs">
                                  Público
                                </Badge>
                              )}
                            </div>
                            {setting.description && (
                              <p className="text-sm text-gray-600 mb-2">{setting.description}</p>
                            )}
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Valor:</span>{' '}
                              {setting.isEncrypted && !showEncrypted ? (
                                <span className="font-mono">••••••••</span>
                              ) : (
                                <span className="font-mono break-all">{setting.value}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Actualizado: {new Date(setting.updatedAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(setting)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(setting.key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
