import { Metadata } from 'next';
import SystemMetricsDashboard from '@/components/admin/SystemMetricsDashboard';

export const metadata: Metadata = {
  title: 'M�tricas del Sistema - Rent360 Admin',
  description: 'Dashboard de monitoreo y m�tricas del sistema Rent360',
};

export default function SystemMetricsPage() {
  return <SystemMetricsDashboard />;
}
