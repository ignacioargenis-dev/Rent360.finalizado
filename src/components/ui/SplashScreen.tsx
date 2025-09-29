'use client';

import React from 'react';

type SplashScreenProps = {
  logoUrl: string;
  visible: boolean;
  onHidden?: () => void;
  durationMs?: number;
};

export function SplashScreen({ logoUrl, visible, onHidden, durationMs = 1200 }: SplashScreenProps) {
  const [show, setShow] = React.useState(visible);

  React.useEffect(() => {
    setShow(visible);
    if (visible) {
      const timeout = setTimeout(() => {
        setShow(false);
        onHidden?.();
      }, durationMs);
      return () => clearTimeout(timeout);
    }
    // No cleanup needed when not visible
    return undefined;
  }, [visible, durationMs, onHidden]);

  if (!show) return null;

  return (
    <div
      aria-label="Pantalla de bienvenida"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b2f2b]"
      style={{
        transition: 'opacity 400ms ease',
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <div className="text-center">
        {/* Logo principal */}
        <div className="text-6xl font-bold text-white animate-pulse mb-4 drop-shadow-lg">
          Rent360
        </div>

        {/* Subtítulo */}
        <div className="text-white/80 text-lg font-medium animate-pulse">
          Plataforma Inmobiliaria
        </div>

        {/* Barra de carga */}
        <div className="mt-6 w-32 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}


