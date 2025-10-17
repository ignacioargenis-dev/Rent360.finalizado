'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Settings,
  Info,
  Navigation,
  Eye,
  EyeOff,
  Download,
  Share2,
  Heart,
  MapPin,
  Clock,
  User,
  Home,
  Camera,
  Move,
  ZoomIn,
  ZoomOut,
  AlertCircle,
} from 'lucide-react';
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
  x: number; // Porcentaje de posición X (0-100)
  y: number; // Porcentaje de posición Y (0-100)
  type: 'scene' | 'info' | 'link' | 'media';
  targetSceneId?: string;
  title: string;
  description?: string;
  icon?: string;
  mediaUrl?: string;
}

interface VirtualTour360Props {
  propertyId: string;
  scenes: VirtualTourScene[];
  isFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onShare?: () => void;
  onFavorite?: () => void;
  className?: string;
}

export default function VirtualTour360({
  propertyId,
  scenes,
  isFullscreen = false,
  onFullscreenChange,
  onShare,
  onFavorite,
  className = '',
}: VirtualTour360Props) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [showHotspotDialog, setShowHotspotDialog] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentScene = scenes[currentSceneIndex];

  // Auto-rotate functionality
  useEffect(() => {
    if (autoRotate && isPlaying) {
      rotationIntervalRef.current = setInterval(() => {
        setPanX(prev => (prev + rotationSpeed) % 360);
      }, 50);
    } else {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    }

    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
    };
  }, [autoRotate, isPlaying, rotationSpeed]);

  // Audio management
  useEffect(() => {
    if (currentScene?.audioUrl && audioRef.current) {
      audioRef.current.src = currentScene.audioUrl;
      audioRef.current.muted = isMuted;
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          logger.error('Error playing audio:', { error });
        });
      }
    }
  }, [currentScene, isPlaying, isMuted]);

  const handleSceneChange = (sceneIndex: number) => {
    if (sceneIndex >= 0 && sceneIndex < scenes.length) {
      setIsLoading(true);
      setCurrentSceneIndex(sceneIndex);
      setPanX(0);
      setPanY(0);
      setZoom(1);
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    setSelectedHotspot(hotspot);
    setShowHotspotDialog(true);

    if (hotspot.type === 'scene' && hotspot.targetSceneId) {
      const targetIndex = scenes.findIndex(scene => scene.id === hotspot.targetSceneId);
      if (targetIndex !== -1) {
        handleSceneChange(targetIndex);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const toggleFullscreen = () => {
    if (onFullscreenChange) {
      onFullscreenChange(!isFullscreen);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetView = () => {
    setPanX(0);
    setPanY(0);
    setZoom(1);
  };

  if (!scenes || scenes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tour Virtual No Disponible</h3>
            <p className="text-gray-600">
              Este tour virtual aún no está disponible para esta propiedad.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Tour Container */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Tour Virtual 360°
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{currentScene?.name || 'Escena actual'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentSceneIndex + 1} de {scenes.length}
              </Badge>
              {onShare && (
                <Button variant="outline" size="sm" onClick={onShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              )}
              {onFavorite && (
                <Button variant="outline" size="sm" onClick={onFavorite}>
                  <Heart className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Tour Viewer */}
          <div
            ref={containerRef}
            className="relative w-full h-96 bg-gray-100 overflow-hidden cursor-move select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {currentScene && (
              <>
                {/* Main Image */}
                <img
                  ref={imageRef}
                  src={currentScene.imageUrl}
                  alt={currentScene.name}
                  className="w-full h-full object-cover transition-transform duration-300"
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                  }}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setError('Error al cargar la imagen del tour');
                    setIsLoading(false);
                  }}
                />

                {/* Hotspots */}
                {showHotspots &&
                  currentScene.hotspots.map(hotspot => (
                    <button
                      key={hotspot.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-110 z-20"
                      style={{
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        handleHotspotClick(hotspot);
                      }}
                      title={hotspot.title}
                    >
                      {hotspot.type === 'scene' && <Navigation className="w-4 h-4" />}
                      {hotspot.type === 'info' && <Info className="w-4 h-4" />}
                      {hotspot.type === 'link' && <Eye className="w-4 h-4" />}
                      {hotspot.type === 'media' && <Play className="w-4 h-4" />}
                    </button>
                  ))}

                {/* Error State */}
                {error && (
                  <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                      <p className="text-red-700">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setError(null);
                          setIsLoading(true);
                        }}
                      >
                        Reintentar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between mb-4">
              {/* Scene Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSceneChange(currentSceneIndex - 1)}
                  disabled={currentSceneIndex === 0}
                >
                  ← Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSceneChange(currentSceneIndex + 1)}
                  disabled={currentSceneIndex === scenes.length - 1}
                >
                  Siguiente →
                </Button>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={togglePlayPause}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={resetView}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowHotspots(!showHotspots)}>
                  {showHotspots ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowInfo(!showInfo)}>
                  <Info className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Scene Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {scenes.map((scene, index) => (
                <button
                  key={scene.id}
                  className={`flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden ${
                    index === currentSceneIndex
                      ? 'border-blue-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSceneChange(index)}
                >
                  <img
                    src={scene.thumbnailUrl}
                    alt={scene.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Panel */}
      {showInfo && currentScene && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-2">{currentScene.name}</h3>
            {currentScene.description && (
              <p className="text-gray-600 mb-4">{currentScene.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>Propiedad {propertyId}</span>
              </div>
              {currentScene.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{currentScene.duration}s</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Camera className="w-4 h-4" />
                <span>360° Panorámica</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotspot Dialog */}
      <Dialog open={showHotspotDialog} onOpenChange={setShowHotspotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedHotspot?.title}</DialogTitle>
            <DialogDescription>{selectedHotspot?.description}</DialogDescription>
          </DialogHeader>
          {selectedHotspot?.mediaUrl && (
            <div className="mt-4">
              <video src={selectedHotspot.mediaUrl} controls className="w-full rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audio Element */}
      <audio ref={audioRef} loop />
    </div>
  );
}
