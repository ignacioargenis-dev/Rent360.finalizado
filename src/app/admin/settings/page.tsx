'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

export default function AdminSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a la configuración avanzada
    router.replace('/admin/settings/enhanced');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Redirigiendo a Configuración Avanzada...</p>
      </div>
    </div>
  );
}


