'use client';

import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import UnifiedMessagingSystem from '@/components/messaging/UnifiedMessagingSystem';
import { useAuth } from '@/components/auth/AuthProviderSimple';

export default function OwnerMessagesPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <UnifiedDashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">Debes iniciar sesión para acceder a los mensajes.</p>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <UnifiedMessagingSystem
        title="Mensajes"
        subtitle="Comunícate con inquilinos, proveedores y el equipo"
        showNewChatButton={true}
        showCallButton={true}
        showEmailButton={true}
        showResolveButton={false}
      />
    </UnifiedDashboardLayout>
  );
}
