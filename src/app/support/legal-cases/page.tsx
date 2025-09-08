import { Metadata } from 'next';
import LegalCasesSupportDashboard from '@/components/support/LegalCasesSupportDashboard';

export const metadata: Metadata = {
  title: 'Casos Legales - Soporte | Rent360',
  description: 'Dashboard de soporte para gestión de casos legales del sistema Rent360',
  keywords: 'casos legales, soporte, gestión, Rent360, inmobiliaria',
};

export default function LegalCasesSupportPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard de Casos Legales
        </h1>
        <p className="text-gray-600">
          Gestión y seguimiento de casos legales para el equipo de soporte
        </p>
      </div>
      
      <LegalCasesSupportDashboard />
    </div>
  );
}
