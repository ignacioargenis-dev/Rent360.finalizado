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
        <img
          src={logoUrl}
          alt="Rent360 - Logo Oficial"
          className="w-[280px] h-auto animate-pulse mb-4"
          style={{
            filter: 'drop-shadow(0 8px 32px rgba(255,255,255,0.3)) brightness(1.1)',
            maxWidth: '80vw'
          }}
          onError={(e) => {
            // Fallback si la imagen no carga
            e.currentTarget.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'text-5xl font-bold text-white animate-pulse drop-shadow-lg';
            fallback.textContent = 'Rent360';
            e.currentTarget.parentNode?.appendChild(fallback);
          }}
        />

        {/* Barra de carga sutil */}
        <div className="mt-4 w-24 h-0.5 bg-white/30 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-white rounded-full animate-pulse" style={{width: '60%'}}></div>
        </div>
      </div>
    </div>
  );
}


