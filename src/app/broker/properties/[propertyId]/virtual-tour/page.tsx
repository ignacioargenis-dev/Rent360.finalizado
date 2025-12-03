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
  Navigation,
  Target,
  Link2,
  MessageSquare,
  X,
  MousePointer,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';
import Viewer360 from '@/components/virtual-tour/Viewer360';

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
  pitch?: number; // Coordenada vertical 3D (-90 a 90)
  yaw?: number; // Coordenada horizontal 3D (-180 a 180)
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

export default function BrokerVirtualTourConfigPage() {
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
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [editingScene, setEditingScene] = useState<string | null>(null);

  // Estados para hotspots
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [newHotspot, setNewHotspot] = useState<Partial<Hotspot>>({
    type: 'scene',
    title: '',
    description: '',
  });
  const [use360Viewer, setUse360Viewer] = useState(true); // Usar visor 360° real

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

  // Funciones para manejar hotspots
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingHotspot) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNewHotspot(prev => ({
      ...prev,
      x,
      y,
      id: `hotspot-${Date.now()}`,
    }));
  };

  const addHotspotToScene = () => {
    if (!newHotspot.x || !newHotspot.title) {
      setError('Por favor, haz clic en la imagen y agrega un título');
      return;
    }

    const currentScene = tourConfig.scenes[selectedSceneIndex];
    if (!currentScene) {
      return;
    }

    const hotspot: Hotspot = {
      id: newHotspot.id || `hotspot-${Date.now()}`,
      x: newHotspot.x,
      y: newHotspot.y || 50,
      type: newHotspot.type || 'scene',
      targetSceneId: newHotspot.targetSceneId,
      title: newHotspot.title,
      description: newHotspot.description,
    };

    const updatedHotspots = [...(currentScene.hotspots || []), hotspot];
    updateScene(currentScene.id, { hotspots: updatedHotspots });

    // Resetear
    setIsAddingHotspot(false);
    setNewHotspot({ type: 'scene', title: '', description: '' });
    setSuccess('Punto de navegación agregado');
  };

  const removeHotspot = (sceneId: string, hotspotId: string) => {
    const scene = tourConfig.scenes.find(s => s.id === sceneId);
    if (!scene) {
      return;
    }

    const updatedHotspots = (scene.hotspots || []).filter(h => h.id !== hotspotId);
    updateScene(sceneId, { hotspots: updatedHotspots });
  };

  const updateHotspot = (sceneId: string, hotspotId: string, updates: Partial<Hotspot>) => {
    const scene = tourConfig.scenes.find(s => s.id === sceneId);
    if (!scene) {
      return;
    }

    const updatedHotspots = (scene.hotspots || []).map(h =>
      h.id === hotspotId ? { ...h, ...updates } : h
    );
    updateScene(sceneId, { hotspots: updatedHotspots });
  };

  const getHotspotIcon = (type: string) => {
    switch (type) {
      case 'scene':
        return <Navigation className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'link':
        return <Link2 className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
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
              onClick={() => router.push(`/broker/properties/${propertyId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración del Tour Virtual</h1>
              <p className="text-gray-600">
                Configura y gestiona el tour virtual 360° de la propiedad
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
            <TabsTrigger value="navigation">Navegación</TabsTrigger>
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
                    {tourConfig.scenes.map((scene, index) => (
                      <Card
                        key={scene.id}
                        className={`overflow-hidden transition-all ${editingScene === scene.id ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <div className="aspect-video bg-gray-200 relative group">
                          <img
                            src={scene.thumbnailUrl}
                            alt={scene.name}
                            className="w-full h-full object-cover"
                            onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/api/placeholder/400/225';
                            }}
                          />
                          {/* Overlay con número de escena */}
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                            Escena {index + 1}
                          </div>
                          {/* Botón de vista previa */}
                          <button
                            onClick={() => setSelectedSceneIndex(index)}
                            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all"
                          >
                            <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {editingScene === scene.id ? (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-500">Nombre</Label>
                                  <Input
                                    value={scene.name}
                                    onChange={e => updateScene(scene.id, { name: e.target.value })}
                                    placeholder="Nombre de la escena"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-500">Descripción</Label>
                                  <Textarea
                                    value={scene.description || ''}
                                    onChange={e =>
                                      updateScene(scene.id, { description: e.target.value })
                                    }
                                    placeholder="Descripción de la escena"
                                    rows={2}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setEditingScene(null)}
                                    className="flex items-center gap-1 flex-1"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    Listo
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      removeScene(scene.id);
                                      setEditingScene(null);
                                    }}
                                    className="flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {scene.name || `Escena ${index + 1}`}
                                  </h4>
                                  {scene.description && (
                                    <p className="text-sm text-gray-500 line-clamp-2">
                                      {scene.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingScene(scene.id)}
                                    className="flex items-center gap-1 flex-1"
                                  >
                                    <Edit className="w-3 h-3" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeScene(scene.id)}
                                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </>
                            )}
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

          {/* Configuración de Navegación / Hotspots */}
          <TabsContent value="navigation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Puntos de Navegación (Hotspots)
                </CardTitle>
                <CardDescription>
                  Agrega puntos de navegación para conectar las escenas como en Google Street View
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {tourConfig.scenes.length < 2 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Necesitas al menos 2 escenas para configurar la navegación entre ellas.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {/* Selector de escena */}
                    <div className="space-y-2">
                      <Label>Selecciona una escena para agregar puntos de navegación</Label>
                      <Select
                        value={selectedSceneIndex.toString()}
                        onValueChange={value => setSelectedSceneIndex(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tourConfig.scenes.map((scene, index) => (
                            <SelectItem key={scene.id} value={index.toString()}>
                              {scene.name || `Escena ${index + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Editor visual de hotspots */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Imagen de la escena (haz clic para agregar un punto)</Label>
                        <Button
                          variant={isAddingHotspot ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setIsAddingHotspot(!isAddingHotspot);
                            setNewHotspot({ type: 'scene', title: '', description: '' });
                          }}
                          className="flex items-center gap-2"
                        >
                          {isAddingHotspot ? (
                            <>
                              <X className="w-4 h-4" />
                              Cancelar
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Agregar Punto
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Imagen con hotspots */}
                      <div
                        className={`relative aspect-video bg-gray-900 rounded-lg overflow-hidden ${isAddingHotspot ? 'cursor-crosshair' : ''}`}
                        onClick={handleImageClick}
                      >
                        {(() => {
                          const currentScene = tourConfig.scenes[selectedSceneIndex];
                          return currentScene ? (
                            <img
                              src={currentScene.imageUrl}
                              alt={currentScene.name}
                              className="w-full h-full object-cover"
                            />
                          ) : null;
                        })()}

                        {/* Hotspots existentes */}
                        {(tourConfig.scenes[selectedSceneIndex]?.hotspots || []).map(hotspot => (
                          <div
                            key={hotspot.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                          >
                            <button
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                                ${
                                  hotspot.type === 'scene'
                                    ? 'bg-emerald-500 hover:bg-emerald-600 animate-pulse'
                                    : 'bg-blue-500 hover:bg-blue-600'
                                } text-white shadow-lg hover:scale-110`}
                              title={hotspot.title}
                            >
                              {getHotspotIcon(hotspot.type)}
                            </button>
                            {/* Tooltip con info */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
                                <p className="font-medium">{hotspot.title}</p>
                                {hotspot.targetSceneId && (
                                  <p className="text-gray-300">
                                    →{' '}
                                    {tourConfig.scenes.find(s => s.id === hotspot.targetSceneId)
                                      ?.name || 'Escena'}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Botón eliminar */}
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                const currentScene = tourConfig.scenes[selectedSceneIndex];
                                if (currentScene) {
                                  removeHotspot(currentScene.id, hotspot.id);
                                }
                              }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {/* Nuevo hotspot temporal */}
                        {isAddingHotspot && newHotspot.x !== undefined && (
                          <div
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${newHotspot.x}%`, top: `${newHotspot.y}%` }}
                          >
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white animate-bounce shadow-lg">
                              <Target className="w-5 h-5" />
                            </div>
                          </div>
                        )}

                        {/* Indicador de modo */}
                        {isAddingHotspot && (
                          <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                            <MousePointer className="w-4 h-4" />
                            Haz clic en la imagen para colocar el punto
                          </div>
                        )}
                      </div>

                      {/* Formulario para nuevo hotspot */}
                      {isAddingHotspot && newHotspot.x !== undefined && (
                        <Card className="border-orange-200 bg-orange-50">
                          <CardContent className="p-4 space-y-4">
                            <h4 className="font-medium text-orange-800">
                              Configurar nuevo punto de navegación
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Tipo de punto</Label>
                                <Select
                                  value={newHotspot.type}
                                  onValueChange={(value: 'scene' | 'info' | 'link') =>
                                    setNewHotspot(prev => ({ ...prev, type: value }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="scene">
                                      <span className="flex items-center gap-2">
                                        <Navigation className="w-4 h-4" /> Ir a otra escena
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="info">
                                      <span className="flex items-center gap-2">
                                        <Info className="w-4 h-4" /> Información
                                      </span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {newHotspot.type === 'scene' && (
                                <div className="space-y-2">
                                  <Label>Escena destino</Label>
                                  <Select
                                    value={newHotspot.targetSceneId || ''}
                                    onValueChange={value =>
                                      setNewHotspot(prev => ({ ...prev, targetSceneId: value }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona una escena" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tourConfig.scenes
                                        .filter((_, idx) => idx !== selectedSceneIndex)
                                        .map((scene, index) => (
                                          <SelectItem key={scene.id} value={scene.id}>
                                            {scene.name || `Escena ${index + 1}`}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>Título del punto</Label>
                              <Input
                                value={newHotspot.title || ''}
                                onChange={e =>
                                  setNewHotspot(prev => ({ ...prev, title: e.target.value }))
                                }
                                placeholder={
                                  newHotspot.type === 'scene'
                                    ? 'Ej: Ir a la cocina'
                                    : 'Ej: Info del living'
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Descripción (opcional)</Label>
                              <Input
                                value={newHotspot.description || ''}
                                onChange={e =>
                                  setNewHotspot(prev => ({ ...prev, description: e.target.value }))
                                }
                                placeholder="Descripción adicional"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={addHotspotToScene}
                                disabled={
                                  !newHotspot.title ||
                                  (newHotspot.type === 'scene' && !newHotspot.targetSceneId)
                                }
                                className="flex-1"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Guardar Punto
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsAddingHotspot(false);
                                  setNewHotspot({ type: 'scene', title: '', description: '' });
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Lista de hotspots de la escena actual */}
                      {(tourConfig.scenes[selectedSceneIndex]?.hotspots || []).length > 0 && (
                        <div className="space-y-2">
                          <Label>Puntos de navegación en esta escena</Label>
                          <div className="space-y-2">
                            {(tourConfig.scenes[selectedSceneIndex]?.hotspots || []).map(
                              hotspot => (
                                <div
                                  key={hotspot.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        hotspot.type === 'scene'
                                          ? 'bg-emerald-100 text-emerald-600'
                                          : 'bg-blue-100 text-blue-600'
                                      }`}
                                    >
                                      {getHotspotIcon(hotspot.type)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{hotspot.title}</p>
                                      {hotspot.type === 'scene' && hotspot.targetSceneId && (
                                        <p className="text-xs text-gray-500">
                                          →{' '}
                                          {tourConfig.scenes.find(
                                            s => s.id === hotspot.targetSceneId
                                          )?.name || 'Escena'}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const scene = tourConfig.scenes[selectedSceneIndex];
                                      if (scene) {
                                        removeHotspot(scene.id, hotspot.id);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vista Previa */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Vista Previa del Tour
                    </CardTitle>
                    <CardDescription>Previsualiza cómo se verá el tour virtual</CardDescription>
                  </div>
                  {/* Toggle para visor 360° */}
                  <div className="flex items-center gap-3">
                    <Label htmlFor="viewer-mode" className="text-sm text-gray-600">
                      Visor 360° real
                    </Label>
                    <Switch
                      id="viewer-mode"
                      checked={use360Viewer}
                      onCheckedChange={setUse360Viewer}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tourConfig.scenes.length > 0 ? (
                  <div className="space-y-4">
                    {use360Viewer ? (
                      /* Visor 360° Real con Pannellum */
                      <div className="relative w-full h-[500px] bg-black rounded-lg overflow-hidden">
                        <Viewer360
                          scenes={tourConfig.scenes}
                          initialSceneIndex={selectedSceneIndex}
                          onSceneChange={index => setSelectedSceneIndex(index)}
                          showControls={true}
                          autoRotate={false}
                        />
                      </div>
                    ) : (
                      /* Visor básico con Hotspots */
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <img
                          src={tourConfig.scenes[selectedSceneIndex]?.imageUrl}
                          alt={tourConfig.scenes[selectedSceneIndex]?.name || 'Escena del tour'}
                          className="w-full h-full object-cover"
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />

                        {/* Hotspots interactivos */}
                        {(tourConfig.scenes[selectedSceneIndex]?.hotspots || []).map(hotspot => (
                          <button
                            key={hotspot.id}
                            onClick={() => {
                              if (hotspot.type === 'scene' && hotspot.targetSceneId) {
                                const targetIndex = tourConfig.scenes.findIndex(
                                  s => s.id === hotspot.targetSceneId
                                );
                                if (targetIndex !== -1) {
                                  setSelectedSceneIndex(targetIndex);
                                }
                              }
                            }}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
                            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                            title={hotspot.title}
                          >
                            {/* Indicador pulsante de fondo */}
                            <div
                              className={`absolute inset-0 rounded-full ${
                                hotspot.type === 'scene' ? 'bg-emerald-500' : 'bg-blue-500'
                              } animate-ping opacity-40`}
                            />

                            {/* Botón principal */}
                            <div
                              className={`relative w-12 h-12 rounded-full flex items-center justify-center 
                            ${
                              hotspot.type === 'scene'
                                ? 'bg-emerald-500 hover:bg-emerald-400'
                                : 'bg-blue-500 hover:bg-blue-400'
                            } text-white shadow-xl transition-all duration-300 group-hover:scale-125 cursor-pointer`}
                            >
                              {hotspot.type === 'scene' ? (
                                <Navigation className="w-6 h-6" />
                              ) : (
                                <Info className="w-6 h-6" />
                              )}
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                              <div className="bg-black/90 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
                                <p className="font-medium">{hotspot.title}</p>
                                {hotspot.type === 'scene' && (
                                  <p className="text-xs text-emerald-300 flex items-center gap-1">
                                    <Play className="w-3 h-3" /> Clic para navegar
                                  </p>
                                )}
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90" />
                            </div>
                          </button>
                        ))}

                        {/* Controles de navegación */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSceneIndex(prev => Math.max(0, prev - 1))}
                            disabled={selectedSceneIndex === 0}
                            className="text-white hover:bg-white/20"
                          >
                            ← Anterior
                          </Button>
                          <span className="text-white text-sm px-2">
                            {selectedSceneIndex + 1} / {tourConfig.scenes.length}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSelectedSceneIndex(prev =>
                                Math.min(tourConfig.scenes.length - 1, prev + 1)
                              )
                            }
                            disabled={selectedSceneIndex === tourConfig.scenes.length - 1}
                            className="text-white hover:bg-white/20"
                          >
                            Siguiente →
                          </Button>
                        </div>
                        {/* Nombre de la escena */}
                        <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
                          {tourConfig.scenes[selectedSceneIndex]?.name ||
                            `Escena ${selectedSceneIndex + 1}`}
                        </div>
                        {/* Indicador de hotspots */}
                        {(tourConfig.scenes[selectedSceneIndex]?.hotspots || []).length > 0 && (
                          <div className="absolute top-4 right-4 bg-emerald-500/80 px-3 py-1 rounded text-white text-xs flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            {(tourConfig.scenes[selectedSceneIndex]?.hotspots || []).length}{' '}
                            punto(s) de navegación
                          </div>
                        )}
                      </div>
                    )}

                    {/* Thumbnails de navegación */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {tourConfig.scenes.map((scene, index) => (
                        <button
                          key={scene.id}
                          onClick={() => setSelectedSceneIndex(index)}
                          className={`aspect-video bg-gray-200 rounded overflow-hidden border-2 transition-all ${
                            selectedSceneIndex === index
                              ? 'border-blue-600 ring-2 ring-blue-200'
                              : 'border-transparent hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={scene.thumbnailUrl}
                            alt={scene.name}
                            className="w-full h-full object-cover"
                            onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/api/placeholder/160/90';
                            }}
                          />
                        </button>
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
