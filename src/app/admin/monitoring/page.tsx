'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';


import React from 'react';
import MonitoringDashboard from '@/components/admin/MonitoringDashboard';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-6">
      <MonitoringDashboard />
    </div>
  );
}
