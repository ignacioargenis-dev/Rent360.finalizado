'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Página de redirect - La funcionalidad de detalle de prospects se movió a /broker/prospects/[id]
 * Esta página mantiene la compatibilidad con bookmarks antiguos
 */
export default function ProspectDetailRedirect() {
  const router = useRouter();
  const params = useParams();
  const prospectId = params.prospectId as string;

  useEffect(() => {
    // Redirigir inmediatamente a la nueva ubicación manteniendo el ID
    router.replace(`/broker/prospects/${prospectId}`);
  }, [router, prospectId]);

  // Mostrar mensaje mientras redirige
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al detalle del prospect...</p>
      </div>
    </div>
  );
}
