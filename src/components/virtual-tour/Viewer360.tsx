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
  pitch: number; // Coordenada vertical (-90 a 90)
  yaw: number; // Coordenada horizontal (-180 a 180)
  type: 'scene' | 'info' | 'link';
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
  const [currentSceneIndex, setCurrentSceneIndex] = useState(initialSceneIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [pannellumLoaded, setPannellumLoaded] = useState(false);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

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

      return {
        id: hotspot.id,
        pitch: pitch || 0,
        yaw: yaw || 0,
        type: hotspot.type === 'scene' ? 'scene' : 'info',
        text: hotspot.title,
        sceneId: hotspot.targetSceneId,
        cssClass: hotspot.type === 'scene' ? 'custom-hotspot-scene' : 'custom-hotspot-info',
        createTooltipFunc: (hotSpotDiv: HTMLElement) => {
          hotSpotDiv.classList.add('custom-tooltip');
          const span = document.createElement('span');
          span.innerHTML = hotspot.title;
          hotSpotDiv.appendChild(span);
          if (hotspot.description) {
            const desc = document.createElement('span');
            desc.className = 'hotspot-description';
            desc.innerHTML = hotspot.description;
            hotSpotDiv.appendChild(desc);
          }
        },
        clickHandlerFunc: () => {
          if (hotspot.type === 'scene' && hotspot.targetSceneId) {
            const targetIndex = scenes.findIndex(s => s.id === hotspot.targetSceneId);
            if (targetIndex !== -1) {
              handleSceneChange(targetIndex);
            }
          }
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
        .pnlm-hotspot {
          width: 50px !important;
          height: 50px !important;
          border-radius: 50% !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }

        .custom-hotspot-scene {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          border: 3px solid rgba(255, 255, 255, 0.8) !important;
          box-shadow:
            0 0 20px rgba(16, 185, 129, 0.6),
            0 4px 15px rgba(0, 0, 0, 0.3) !important;
          animation: pulse-green 2s infinite !important;
        }

        .custom-hotspot-scene:hover {
          transform: scale(1.3) !important;
          box-shadow:
            0 0 30px rgba(16, 185, 129, 0.8),
            0 6px 20px rgba(0, 0, 0, 0.4) !important;
        }

        .custom-hotspot-scene::after {
          content: '→' !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          font-size: 24px !important;
          color: white !important;
          font-weight: bold !important;
        }

        .custom-hotspot-info {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          border: 3px solid rgba(255, 255, 255, 0.8) !important;
          box-shadow:
            0 0 20px rgba(59, 130, 246, 0.6),
            0 4px 15px rgba(0, 0, 0, 0.3) !important;
        }

        .custom-hotspot-info:hover {
          transform: scale(1.3) !important;
          box-shadow:
            0 0 30px rgba(59, 130, 246, 0.8),
            0 6px 20px rgba(0, 0, 0, 0.4) !important;
        }

        .custom-hotspot-info::after {
          content: 'i' !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          font-size: 20px !important;
          color: white !important;
          font-weight: bold !important;
          font-style: italic !important;
        }

        .pnlm-hotspot .custom-tooltip {
          display: none;
        }

        .pnlm-hotspot:hover .custom-tooltip {
          display: block;
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 10px;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          white-space: nowrap;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .pnlm-hotspot:hover .custom-tooltip .hotspot-description {
          display: block;
          font-size: 12px;
          font-weight: normal;
          color: #94a3b8;
          margin-top: 4px;
        }

        @keyframes pulse-green {
          0%,
          100% {
            box-shadow:
              0 0 20px rgba(16, 185, 129, 0.6),
              0 4px 15px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow:
              0 0 30px rgba(16, 185, 129, 0.9),
              0 6px 25px rgba(0, 0, 0, 0.4);
          }
        }

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
