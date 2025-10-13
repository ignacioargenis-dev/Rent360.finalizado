'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';


import React from 'react';
import PerformanceMonitor from '@/components/admin/PerformanceMonitor';

export default function PerformancePage() {
  return (
    <div className="container mx-auto py-6">
      <PerformanceMonitor />
    </div>
  );
}
