import { Metadata } from 'next';
import LegalCasesSupportDashboard from '@/components/support/LegalCasesSupportDashboard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export const metadata: Metadata = {
  title: 'Casos Legales - Soporte | Rent360',
  description: 'Dashboard de soporte para gestión de casos legales del sistema Rent360',
  keywords: 'casos legales, soporte, gestión, Rent360, inmobiliaria',
};

export default function LegalCasesSupportPage() {
  return (
    <DashboardLayout
      title="Casos Legales"
      subtitle="Gestión y seguimiento de casos legales"
    >
      <div className="container mx-auto px-4 py-6">
        <LegalCasesSupportDashboard />
      </div>
    </DashboardLayout>
  );
}
