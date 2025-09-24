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
      }}
    >
      <img
        src={logoUrl}
        alt="Rent360"
        className="w-[240px] h-auto animate-pulse"
        style={{ filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.35))' }}
      />
    </div>
  );
}


