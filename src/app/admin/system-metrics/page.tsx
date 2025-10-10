import { Metadata } from 'next';
import SystemMetricsDashboard from '@/components/admin/SystemMetricsDashboard';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export const metadata: Metadata = {
  title: 'Métricas del Sistema - Rent360 Admin',
  description: 'Dashboard de monitoreo y métricas del sistema Rent360',
};

export default function SystemMetricsPage() {
  return (
    <UnifiedDashboardLayout
      title="Métricas del Sistema"
      subtitle="Monitoreo en tiempo real del rendimiento y salud del sistema"
    >
      <div className="container mx-auto px-4 py-6">
        <SystemMetricsDashboard />
      </div>
    </UnifiedDashboardLayout>
  );
}
