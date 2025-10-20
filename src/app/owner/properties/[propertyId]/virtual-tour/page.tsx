'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Upload,
  Save,
  Eye,
  Settings,
  Camera,
  Plus,
  Trash2,
  Edit,
  Play,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface VirtualTourScene {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  description?: string;
  hotspots: Hotspot[];
  audioUrl?: string;
  duration?: number;
}

interface Hotspot {
  id: string;
  x: number;
  y: number;
  type: 'scene' | 'info' | 'link' | 'media';
  targetSceneId?: string;
  title: string;
  description?: string;
  icon?: string;
  mediaUrl?: string;
}

interface VirtualTourConfig {
  propertyId: string;
  scenes: VirtualTourScene[];
  isEnabled: boolean;
  title: string;
  description: string;
  autoPlay: boolean;
  showControls: boolean;
  allowFullscreen: boolean;
}

export default function VirtualTourConfigPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const propertyId = params?.propertyId as string;

  const [tourConfig, setTourConfig] = useState<VirtualTourConfig>({
    propertyId,
    scenes: [],
    isEnabled: false,
    title: '',
    description: '',
    autoPlay: false,
    showControls: true,
    allowFullscreen: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar configuración existente
  useEffect(() => {
    loadTourConfig();
  }, [propertyId]);

  const loadTourConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/properties/${propertyId}/virtual-tour`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.tour) {
          setTourConfig({
            propertyId,
            scenes: data.tour.scenes || [],
            isEnabled: data.tour.isEnabled || false,
            title: data.tour.title || '',
            description: data.tour.description || '',
            autoPlay: data.tour.autoPlay || false,
            showControls: data.tour.showControls !== false,
            allowFullscreen: data.tour.allowFullscreen !== false,
          });
        }
      }
    } catch (error) {
      logger.error('Error cargando configuración del tour virtual:', { error, propertyId });
      setError('Error al cargar la configuración del tour virtual');
    } finally {
      setLoading(false);
    }
  };

  const saveTourConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/properties/${propertyId}/virtual-tour`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenes: tourConfig.scenes,
          isEnabled: tourConfig.isEnabled,
          title: tourConfig.title,
          description: tourConfig.description,
          autoPlay: tourConfig.autoPlay,
          showControls: tourConfig.showControls,
          allowFullscreen: tourConfig.allowFullscreen,
        }),
      });

      if (response.ok) {
        setSuccess('Configuración del tour virtual guardada exitosamente');
        logger.info('Tour virtual configurado', { propertyId, userId: user?.id });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar la configuración');
      }
    } catch (error) {
      logger.error('Error guardando configuración del tour virtual:', { error, propertyId });
      setError('Error al guardar la configuración del tour virtual');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`/api/properties/${propertyId}/virtual-tour/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.scenes) {
          setTourConfig(prev => ({
            ...prev,
            scenes: [...prev.scenes, ...data.scenes],
          }));
          setSuccess(`${data.scenes.length} escenas agregadas exitosamente`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al subir las imágenes');
      }
    } catch (error) {
      logger.error('Error subiendo imágenes del tour virtual:', { error, propertyId });
      setError('Error al subir las imágenes');
    } finally {
      setUploading(false);
    }
  };

  const removeScene = (sceneId: string) => {
    setTourConfig(prev => ({
      ...prev,
      scenes: prev.scenes.filter(scene => scene.id !== sceneId),
    }));
  };

  const updateScene = (sceneId: string, updates: Partial<VirtualTourScene>) => {
    setTourConfig(prev => ({
      ...prev,
      scenes: prev.scenes.map(scene => (scene.id === sceneId ? { ...scene, ...updates } : scene)),
    }));
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando configuración del tour virtual...</p>
          </div>
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
              onClick={() => router.push(`/owner/properties/${propertyId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración del Tour Virtual</h1>
              <p className="text-gray-600">
                Configura y gestiona el tour virtual 360° de tu propiedad
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={tourConfig.isEnabled ? 'default' : 'secondary'}>
              {tourConfig.isEnabled ? 'Habilitado' : 'Deshabilitado'}
            </Badge>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
            <TabsTrigger value="scenes">Escenas</TabsTrigger>
            <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          </TabsList>

          {/* Configuración General */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuración General
                </CardTitle>
                <CardDescription>Configura las opciones básicas del tour virtual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enabled">Habilitar Tour Virtual</Label>
                    <p className="text-sm text-gray-600">
                      Activa o desactiva el tour virtual para esta propiedad
                    </p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={tourConfig.isEnabled}
                    onCheckedChange={checked =>
                      setTourConfig(prev => ({ ...prev, isEnabled: checked }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título del Tour</Label>
                    <Input
                      id="title"
                      value={tourConfig.title}
                      onChange={e => setTourConfig(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej: Tour Virtual - Casa en Las Condes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="autoPlay">Reproducción Automática</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoPlay"
                        checked={tourConfig.autoPlay}
                        onCheckedChange={checked =>
                          setTourConfig(prev => ({ ...prev, autoPlay: checked }))
                        }
                      />
                      <Label htmlFor="autoPlay" className="text-sm">
                        Iniciar automáticamente
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={tourConfig.description}
                    onChange={e =>
                      setTourConfig(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe el tour virtual y sus características..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showControls"
                      checked={tourConfig.showControls}
                      onCheckedChange={checked =>
                        setTourConfig(prev => ({ ...prev, showControls: checked }))
                      }
                    />
                    <Label htmlFor="showControls">Mostrar Controles</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowFullscreen"
                      checked={tourConfig.allowFullscreen}
                      onCheckedChange={checked =>
                        setTourConfig(prev => ({ ...prev, allowFullscreen: checked }))
                      }
                    />
                    <Label htmlFor="allowFullscreen">Permitir Pantalla Completa</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestión de Escenas */}
          <TabsContent value="scenes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Escenas del Tour
                </CardTitle>
                <CardDescription>
                  Sube y gestiona las imágenes 360° para tu tour virtual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload de Imágenes */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Subir Imágenes 360°</h3>
                  <p className="text-gray-600 mb-4">
                    Selecciona imágenes panorámicas 360° para crear las escenas del tour
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label
                    htmlFor="image-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Seleccionar Imágenes
                      </>
                    )}
                  </Label>
                </div>

                {/* Lista de Escenas */}
                {tourConfig.scenes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tourConfig.scenes.map(scene => (
                      <Card key={scene.id} className="overflow-hidden">
                        <div className="aspect-video bg-gray-200">
                          <img
                            src={scene.thumbnailUrl}
                            alt={scene.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <Input
                              value={scene.name}
                              onChange={e => updateScene(scene.id, { name: e.target.value })}
                              placeholder="Nombre de la escena"
                            />
                            <Textarea
                              value={scene.description || ''}
                              onChange={e => updateScene(scene.id, { description: e.target.value })}
                              placeholder="Descripción de la escena"
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeScene(scene.id)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Eliminar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                Editar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay escenas configuradas</p>
                    <p className="text-sm">Sube imágenes 360° para comenzar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vista Previa */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Vista Previa del Tour
                </CardTitle>
                <CardDescription>Previsualiza cómo se verá el tour virtual</CardDescription>
              </CardHeader>
              <CardContent>
                {tourConfig.scenes.length > 0 ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Vista previa del tour virtual</p>
                        <p className="text-sm text-gray-500">
                          {tourConfig.scenes.length} escena
                          {tourConfig.scenes.length !== 1 ? 's' : ''} configurada
                          {tourConfig.scenes.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {tourConfig.scenes.map(scene => (
                        <div
                          key={scene.id}
                          className="aspect-video bg-gray-200 rounded overflow-hidden"
                        >
                          <img
                            src={scene.thumbnailUrl}
                            alt={scene.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay escenas para previsualizar</p>
                    <p className="text-sm">Configura las escenas en la pestaña anterior</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botones de Acción */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="text-sm text-gray-600">
            {tourConfig.scenes.length} escena{tourConfig.scenes.length !== 1 ? 's' : ''} configurada
            {tourConfig.scenes.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button
              onClick={saveTourConfig}
              disabled={saving || tourConfig.scenes.length === 0}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
