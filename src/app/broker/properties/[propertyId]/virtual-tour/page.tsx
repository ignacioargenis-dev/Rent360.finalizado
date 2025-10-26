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
  linkUrl?: string;
  mediaUrl?: string;
}

export default function BrokerVirtualTourPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const propertyId = params?.propertyId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [scenes, setScenes] = useState<VirtualTourScene[]>([]);
  const [activeScene, setActiveScene] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [tourTitle, setTourTitle] = useState('');
  const [tourDescription, setTourDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar datos de la propiedad y tour virtual
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar información de la propiedad
        const propertyResponse = await fetch(`/api/properties/${propertyId}`);
        if (propertyResponse.ok) {
          const propertyData = await propertyResponse.json();
          if (propertyData.success && propertyData.property) {
            setProperty(propertyData.property);
            setTourTitle(`Tour Virtual - ${propertyData.property.title}`);
            setTourDescription(
              `Recorrido virtual interactivo de la propiedad ${propertyData.property.title}`
            );
          }
        }

        // Cargar configuración del tour virtual
        const tourResponse = await fetch(`/api/properties/${propertyId}/virtual-tour`);
        if (tourResponse.ok) {
          const tourData = await tourResponse.json();
          setIsEnabled(tourData.enabled || false);
          setScenes(tourData.scenes || []);
          if (tourData.scenes?.length > 0) {
            setActiveScene(tourData.scenes[0].id);
          }
          setTourTitle(tourData.title || `Tour Virtual - ${property?.title}`);
          setTourDescription(tourData.description || '');
        }
      } catch (error) {
        logger.error('Error loading virtual tour data:', {
          error: error instanceof Error ? error.message : String(error),
          propertyId,
        });
        setErrorMessage('Error al cargar los datos del tour virtual');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      loadData();
    }
  }, [propertyId]);

  const saveVirtualTour = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/properties/${propertyId}/virtual-tour`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          enabled: isEnabled,
          title: tourTitle,
          description: tourDescription,
          scenes: scenes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el tour virtual');
      }

      const data = await response.json();
      setSuccessMessage('Tour virtual guardado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error saving virtual tour:', {
        error: error instanceof Error ? error.message : String(error),
        propertyId,
      });
      setErrorMessage(error instanceof Error ? error.message : 'Error al guardar el tour virtual');
    } finally {
      setSaving(false);
    }
  };

  const addNewScene = () => {
    const newScene: VirtualTourScene = {
      id: `scene-${Date.now()}`,
      name: `Escena ${scenes.length + 1}`,
      imageUrl: '',
      thumbnailUrl: '',
      description: '',
      hotspots: [],
    };

    setScenes([...scenes, newScene]);
    setActiveScene(newScene.id);
  };

  const updateScene = (sceneId: string, updates: Partial<VirtualTourScene>) => {
    setScenes(scenes.map(scene => (scene.id === sceneId ? { ...scene, ...updates } : scene)));
  };

  const deleteScene = (sceneId: string) => {
    setScenes(scenes.filter(scene => scene.id !== sceneId));
    if (activeScene === sceneId && scenes.length > 1) {
      const remainingScenes = scenes.filter(scene => scene.id !== sceneId);
      setActiveScene(remainingScenes[0].id);
    }
  };

  const handleImageUpload = async (sceneId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`/api/properties/${propertyId}/virtual-tour/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      updateScene(sceneId, {
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
      });
    } catch (error) {
      logger.error('Error uploading virtual tour image:', {
        error: error instanceof Error ? error.message : String(error),
        sceneId,
        propertyId,
      });
      setErrorMessage('Error al subir la imagen');
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando tour virtual...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!property) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Propiedad no encontrada</h2>
            <p className="text-gray-600 mb-4">No se pudo cargar la información de la propiedad.</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tour Virtual</h1>
              <p className="text-gray-600">{property.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isEnabled ? 'default' : 'secondary'}>
              {isEnabled ? 'Habilitado' : 'Deshabilitado'}
            </Badge>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Tour Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuración del Tour Virtual
            </CardTitle>
            <CardDescription>
              Configure las opciones generales del tour virtual interactivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Tour Virtual Habilitado</Label>
                <p className="text-sm text-gray-600">
                  Permitir que los visitantes exploren la propiedad en 360°
                </p>
              </div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tourTitle">Título del Tour</Label>
                <Input
                  id="tourTitle"
                  value={tourTitle}
                  onChange={e => setTourTitle(e.target.value)}
                  placeholder="Ej: Recorrido Virtual de la Propiedad"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tourDescription">Descripción</Label>
                <Textarea
                  id="tourDescription"
                  value={tourDescription}
                  onChange={e => setTourDescription(e.target.value)}
                  placeholder="Describe el tour virtual..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scenes Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Escenas del Tour
                </CardTitle>
                <CardDescription>Gestione las escenas y hotspots del tour virtual</CardDescription>
              </div>
              <Button onClick={addNewScene} disabled={!isEnabled}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Escena
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {scenes.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No hay escenas configuradas</h3>
                <p className="text-gray-600 mb-4">
                  Agregue escenas para crear un tour virtual interactivo
                </p>
                <Button onClick={addNewScene} disabled={!isEnabled}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Escena
                </Button>
              </div>
            ) : (
              <Tabs value={activeScene} onValueChange={setActiveScene}>
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
                  {scenes.map(scene => (
                    <TabsTrigger key={scene.id} value={scene.id} className="text-xs">
                      {scene.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {scenes.map(scene => (
                  <TabsContent key={scene.id} value={scene.id} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Scene Configuration */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            Configuración de Escena
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteScene(scene.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor={`scene-name-${scene.id}`}>Nombre de la Escena</Label>
                            <Input
                              id={`scene-name-${scene.id}`}
                              value={scene.name}
                              onChange={e => updateScene(scene.id, { name: e.target.value })}
                              placeholder="Ej: Sala de estar"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`scene-description-${scene.id}`}>Descripción</Label>
                            <Textarea
                              id={`scene-description-${scene.id}`}
                              value={scene.description || ''}
                              onChange={e => updateScene(scene.id, { description: e.target.value })}
                              placeholder="Describe esta escena..."
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label>Imagen de la Escena</Label>
                            <div className="mt-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(scene.id, file);
                                  }
                                }}
                                className="hidden"
                                id={`scene-image-${scene.id}`}
                              />
                              <label
                                htmlFor={`scene-image-${scene.id}`}
                                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                {scene.imageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                              </label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Scene Preview */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Vista Previa</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {scene.imageUrl ? (
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={scene.imageUrl}
                                alt={scene.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                              <div className="text-center text-gray-500">
                                <Camera className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">No hay imagen subida</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveVirtualTour} disabled={saving} className="min-w-32">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Tour Virtual
              </>
            )}
          </Button>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
