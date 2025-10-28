'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página de redirect - La funcionalidad de prospects se movió a /broker/prospects
 * Esta página mantiene la compatibilidad con bookmarks antiguos
 */
export default function ProspectsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir inmediatamente a la nueva ubicación
    router.replace('/broker/prospects');
  }, [router]);

  // Mostrar mensaje mientras redirige
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo a la nueva interfaz de prospects...</p>
      </div>
    </div>
  );
}
