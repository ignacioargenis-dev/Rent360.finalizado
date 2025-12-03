'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Navigation,
  Info,
  X,
  Play,
} from 'lucide-react';

// Tipos para las escenas y hotspots
interface Hotspot {
  id: string;
  pitch?: number; // Coordenada vertical (-90 a 90) - opcional, se puede calcular desde Y
  yaw?: number; // Coordenada horizontal (-180 a 180) - opcional, se puede calcular desde X
  type: 'scene' | 'info' | 'link' | 'media';
  targetSceneId?: string;
  title: string;
  description?: string;
  // Compatibilidad con coordenadas X/Y (se convertirán a pitch/yaw)
  x?: number;
  y?: number;
}

interface Scene {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  description?: string;
  hotspots?: Hotspot[];
}

interface Viewer360Props {
  scenes: Scene[];
  initialSceneIndex?: number;
  onSceneChange?: (index: number) => void;
  onClose?: () => void;
  showControls?: boolean;
  autoRotate?: boolean;
  propertyInfo?: {
    title?: string;
    address?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
}

// Convertir coordenadas X/Y (porcentaje) a Yaw/Pitch
const convertXYToYawPitch = (x: number, y: number): { yaw: number; pitch: number } => {
  // X: 0-100 -> Yaw: -180 a 180
  const yaw = (x / 100) * 360 - 180;
  // Y: 0-100 -> Pitch: 90 a -90 (invertido porque Y=0 es arriba)
  const pitch = 90 - (y / 100) * 180;
  return { yaw, pitch };
};

export default function Viewer360({
  scenes,
  initialSceneIndex = 0,
  onSceneChange,
  onClose,
  showControls = true,
  autoRotate = false,
  propertyInfo,
}: Viewer360Props) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const pannellumViewerRef = useRef<any>(null);
  const scenesRef = useRef(scenes);
  const onSceneChangeRef = useRef(onSceneChange);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(initialSceneIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [pannellumLoaded, setPannellumLoaded] = useState(false);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  // Mantener referencias actualizadas
  useEffect(() => {
    scenesRef.current = scenes;
    onSceneChangeRef.current = onSceneChange;
  }, [scenes, onSceneChange]);

  // Cargar Pannellum dinámicamente (solo en cliente)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Cargar CSS de Pannellum
    const linkId = 'pannellum-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
      document.head.appendChild(link);
    }

    // Cargar JS de Pannellum
    const scriptId = 'pannellum-js';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
      script.onload = () => {
        setPannellumLoaded(true);
      };
      document.head.appendChild(script);
    } else if ((window as any).pannellum) {
      setPannellumLoaded(true);
    }
  }, []);

  // Inicializar/actualizar el visor cuando cambia la escena
  useEffect(() => {
    if (!pannellumLoaded || !viewerRef.current || scenes.length === 0) {
      return;
    }

    const currentScene = scenes[currentSceneIndex];
    if (!currentScene) {
      return;
    }

    setIsLoading(true);

    // Destruir visor anterior si existe
    if (pannellumViewerRef.current) {
      try {
        pannellumViewerRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying pannellum viewer:', e);
      }
    }

    // Preparar hotspots con conversión de coordenadas si es necesario
    const hotspots = (currentScene.hotspots || []).map(hotspot => {
      let pitch = hotspot.pitch;
      let yaw = hotspot.yaw;

      // Si tiene coordenadas X/Y pero no pitch/yaw, convertir
      if (
        hotspot.x !== undefined &&
        hotspot.y !== undefined &&
        (pitch === undefined || yaw === undefined)
      ) {
        const converted = convertXYToYawPitch(hotspot.x, hotspot.y);
        pitch = converted.pitch;
        yaw = converted.yaw;
      }

      // Guardar referencia para el click handler
      const targetSceneId = hotspot.targetSceneId;
      const hotspotType = hotspot.type;

      return {
        id: hotspot.id,
        pitch: pitch || 0,
        yaw: yaw || 0,
        type: 'custom',
        text: hotspot.title,
        cssClass:
          hotspotType === 'scene' ? 'pnlm-hotspot-custom-scene' : 'pnlm-hotspot-custom-info',
        createTooltipFunc: (hotSpotDiv: HTMLElement, args: any) => {
          // Crear el contenido del hotspot
          hotSpotDiv.innerHTML = '';

          // Contenedor principal
          const container = document.createElement('div');
          container.className =
            hotspotType === 'scene' ? 'hotspot-circle-scene' : 'hotspot-circle-info';

          // Icono
          const icon = document.createElement('span');
          icon.className = 'hotspot-icon';
          icon.innerHTML = hotspotType === 'scene' ? '→' : 'i';
          container.appendChild(icon);

          hotSpotDiv.appendChild(container);

          // Tooltip
          const tooltip = document.createElement('div');
          tooltip.className = 'hotspot-tooltip';
          tooltip.innerHTML = `<strong>${hotspot.title}</strong>${hotspot.description ? '<br><small>' + hotspot.description + '</small>' : ''}`;
          hotSpotDiv.appendChild(tooltip);

          // Agregar event listener para el click
          hotSpotDiv.style.cursor = 'pointer';
          hotSpotDiv.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Hotspot clicked:', hotspot.title, 'targetSceneId:', targetSceneId);
            if (hotspotType === 'scene' && targetSceneId) {
              // Usar referencias actualizadas
              const currentScenes = scenesRef.current;
              const targetIndex = currentScenes.findIndex(s => s.id === targetSceneId);
              console.log(
                'Target index:',
                targetIndex,
                'scenes:',
                currentScenes.map(s => s.id)
              );
              if (targetIndex !== -1) {
                setCurrentSceneIndex(targetIndex);
                onSceneChangeRef.current?.(targetIndex);
              } else {
                console.error('Scene not found with id:', targetSceneId);
              }
            }
          });
        },
      };
    });

    // Crear nuevo visor
    try {
      pannellumViewerRef.current = (window as any).pannellum.viewer(viewerRef.current, {
        type: 'equirectangular',
        panorama: currentScene.imageUrl,
        autoLoad: true,
        autoRotate: autoRotate ? -2 : 0,
        autoRotateInactivityDelay: 3000,
        compass: false,
        showZoomCtrl: false,
        showFullscreenCtrl: false,
        mouseZoom: true,
        keyboardZoom: true,
        draggable: true,
        disableKeyboardCtrl: false,
        hfov: 100,
        minHfov: 50,
        maxHfov: 120,
        pitch: 0,
        yaw: 0,
        hotSpots: hotspots,
        hotSpotDebug: false,
        sceneFadeDuration: 1000,
      });

      pannellumViewerRef.current.on('load', () => {
        setIsLoading(false);
      });

      pannellumViewerRef.current.on('error', (err: any) => {
        console.error('Pannellum error:', err);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error initializing Pannellum:', error);
      setIsLoading(false);
    }

    return () => {
      if (pannellumViewerRef.current) {
        try {
          pannellumViewerRef.current.destroy();
        } catch (e) {
          // Ignorar errores al destruir
        }
      }
    };
  }, [pannellumLoaded, currentSceneIndex, scenes, autoRotate]);

  const handleSceneChange = useCallback(
    (index: number) => {
      setCurrentSceneIndex(index);
      onSceneChange?.(index);
    },
    [onSceneChange]
  );

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      handleSceneChange(currentSceneIndex - 1);
    }
  };

  const handleNextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      handleSceneChange(currentSceneIndex + 1);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleResetView = () => {
    if (pannellumViewerRef.current) {
      pannellumViewerRef.current.setPitch(0);
      pannellumViewerRef.current.setYaw(0);
      pannellumViewerRef.current.setHfov(100);
    }
  };

  const currentScene = scenes[currentSceneIndex];

  return (
    <div className="relative w-full h-full bg-black">
      {/* Estilos personalizados para hotspots */}
      <style jsx global>{`
        /* Resetear estilos por defecto de Pannellum */
        .pnlm-hotspot-base {
          background: transparent !important;
          border: none !important;
          width: auto !important;
          height: auto !important;
        }

        .pnlm-hotspot-base > span {
          display: none !important;
        }

        .pnlm-tooltip {
          display: none !important;
        }

        /* Contenedor del hotspot */
        .pnlm-hotspot-custom-scene,
        .pnlm-hotspot-custom-info {
          cursor: pointer !important;
          background: transparent !important;
          border: none !important;
        }

        /* Círculo del hotspot - Escena */
        .hotspot-circle-scene {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 3px solid rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow:
            0 0 20px rgba(16, 185, 129, 0.6),
            0 4px 15px rgba(0, 0, 0, 0.4);
          animation: hotspot-pulse 2s infinite;
        }

        .hotspot-circle-scene:hover {
          transform: scale(1.2);
          box-shadow:
            0 0 30px rgba(16, 185, 129, 0.9),
            0 6px 25px rgba(0, 0, 0, 0.5);
        }

        .hotspot-circle-scene .hotspot-icon {
          font-size: 28px;
          color: white;
          font-weight: bold;
        }

        /* Círculo del hotspot - Info */
        .hotspot-circle-info {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: 3px solid rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow:
            0 0 15px rgba(59, 130, 246, 0.6),
            0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .hotspot-circle-info:hover {
          transform: scale(1.2);
          box-shadow:
            0 0 25px rgba(59, 130, 246, 0.9),
            0 6px 20px rgba(0, 0, 0, 0.5);
        }

        .hotspot-circle-info .hotspot-icon {
          font-size: 22px;
          color: white;
          font-weight: bold;
          font-style: italic;
        }

        /* Tooltip */
        .hotspot-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 15px;
          background: rgba(0, 0, 0, 0.95);
          color: white;
          padding: 12px 18px;
          border-radius: 10px;
          white-space: nowrap;
          font-size: 14px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }

        .hotspot-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 8px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.95);
        }

        .hotspot-tooltip strong {
          display: block;
          font-size: 15px;
          margin-bottom: 2px;
        }

        .hotspot-tooltip small {
          color: #94a3b8;
          font-size: 12px;
        }

        .pnlm-hotspot:hover .hotspot-tooltip {
          opacity: 1;
        }

        /* Animación de pulso */
        @keyframes hotspot-pulse {
          0%,
          100% {
            box-shadow:
              0 0 20px rgba(16, 185, 129, 0.6),
              0 4px 15px rgba(0, 0, 0, 0.4);
          }
          50% {
            box-shadow:
              0 0 35px rgba(16, 185, 129, 0.9),
              0 6px 30px rgba(0, 0, 0, 0.5);
          }
        }

        /* Estilos del contenedor Pannellum */
        .pnlm-container {
          background: #0f172a !important;
        }

        .pnlm-load-box {
          background: rgba(15, 23, 42, 0.9) !important;
          border-radius: 12px !important;
        }

        .pnlm-lbar {
          background: #10b981 !important;
        }

        .pnlm-lbar-fill {
          background: #34d399 !important;
        }

        /* Ocultar controles por defecto */
        .pnlm-controls-container {
          display: none !important;
        }
      `}</style>

      {/* Contenedor del visor Pannellum */}
      <div ref={viewerRef} className="w-full h-full" style={{ minHeight: '400px' }} />

      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <p className="text-white font-medium">Cargando vista 360°...</p>
          </div>
        </div>
      )}

      {/* Header con controles */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 via-black/50 to-transparent">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              )}
              <div className="text-white">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-400" />
                  Tour Virtual 360°
                </h2>
                {propertyInfo?.title && (
                  <p className="text-sm text-slate-300">{propertyInfo.title}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Contador de escenas */}
              <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-emerald-400 font-bold">{currentSceneIndex + 1}</span>
                <span className="text-slate-400">/</span>
                <span className="text-white">{scenes.length}</span>
              </div>

              {/* Controles */}
              <button
                onClick={handleResetView}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                title="Restablecer vista"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleFullscreen}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-white" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nombre de la escena actual */}
      {currentScene?.name && showControls && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-black/70 backdrop-blur-md rounded-xl px-6 py-3 border border-white/10">
            <p className="text-white font-medium text-center">{currentScene.name}</p>
            {currentScene.description && (
              <p className="text-slate-400 text-sm text-center mt-1">{currentScene.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Botones de navegación lateral */}
      <button
        onClick={handlePrevScene}
        disabled={currentSceneIndex === 0}
        className={`absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full transition-all duration-300 ${
          currentSceneIndex === 0
            ? 'bg-white/5 cursor-not-allowed'
            : 'bg-white/10 hover:bg-emerald-500/80 hover:scale-110 backdrop-blur-sm'
        }`}
      >
        <ChevronLeft
          className={`w-8 h-8 ${currentSceneIndex === 0 ? 'text-slate-600' : 'text-white'}`}
        />
      </button>

      <button
        onClick={handleNextScene}
        disabled={currentSceneIndex === scenes.length - 1}
        className={`absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full transition-all duration-300 ${
          currentSceneIndex === scenes.length - 1
            ? 'bg-white/5 cursor-not-allowed'
            : 'bg-white/10 hover:bg-emerald-500/80 hover:scale-110 backdrop-blur-sm'
        }`}
      >
        <ChevronRight
          className={`w-8 h-8 ${currentSceneIndex === scenes.length - 1 ? 'text-slate-600' : 'text-white'}`}
        />
      </button>

      {/* Footer con thumbnails */}
      {showControls && scenes.length > 1 && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-500 ${
            showThumbnails ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'
          }`}
        >
          {/* Toggle thumbnails */}
          <div className="flex justify-center -mb-1">
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="bg-black/70 hover:bg-black/90 backdrop-blur-sm px-4 py-1 rounded-t-xl transition-all"
            >
              <span className="text-white text-xs">
                {showThumbnails ? '▼ Ocultar' : '▲ Mostrar escenas'}
              </span>
            </button>
          </div>

          <div className="bg-gradient-to-t from-black/95 via-black/85 to-black/70 backdrop-blur-sm p-4">
            {/* Barra de progreso */}
            <div className="w-full h-1 bg-white/20 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${((currentSceneIndex + 1) / scenes.length) * 100}%` }}
              />
            </div>

            {/* Thumbnails */}
            <div
              className={`transition-all duration-300 overflow-hidden ${showThumbnails ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="flex gap-2 overflow-x-auto pb-2">
                {scenes.map((scene, index) => (
                  <button
                    key={scene.id}
                    onClick={() => handleSceneChange(index)}
                    className={`relative flex-shrink-0 group transition-all duration-300 ${
                      index === currentSceneIndex
                        ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-black scale-105'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={scene.thumbnailUrl || scene.imageUrl}
                      alt={scene.name}
                      className="w-24 h-16 object-cover rounded-lg"
                    />
                    <div
                      className={`absolute inset-0 rounded-lg flex items-center justify-center ${
                        index === currentSceneIndex
                          ? 'bg-emerald-500/30'
                          : 'bg-black/40 group-hover:bg-black/20'
                      }`}
                    >
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Instrucciones */}
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mt-2">
              <Info className="w-4 h-4" />
              <span>
                Arrastra para mirar • Scroll para zoom • Clic en puntos verdes para navegar
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de hotspots */}
      {currentScene?.hotspots && currentScene.hotspots.length > 0 && showControls && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-emerald-500/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">
            {currentScene.hotspots.filter(h => h.type === 'scene').length} punto(s) de navegación
          </span>
        </div>
      )}
    </div>
  );
}
