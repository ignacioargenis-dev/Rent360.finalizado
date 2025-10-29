'use client';

// Usar el NotificationProvider del layout principal
export { useNotifications } from '@/components/ui/notification-provider';

// Importar el toast hook real
import { useToast as useToastHook } from '@/hooks/use-toast';

// Crear wrapper compatible para componentes que esperan { success, error }
export function useToast() {
  const { toast } = useToastHook();

  return {
    success: (title: string, description?: string) => {
      if (description) {
        toast({
          title,
          description,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Éxito',
          description: title,
          variant: 'default',
        });
      }
    },
    error: (title: string, description?: string) => {
      if (description) {
        toast({
          title,
          description,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: title,
          variant: 'destructive',
        });
      }
    },
    warning: (message: string) =>
      toast({
        title: 'Advertencia',
        description: message,
        variant: 'default',
      }),
    info: (message: string) =>
      toast({
        title: 'Información',
        description: message,
        variant: 'default',
      }),
    toast, // Mantener compatibilidad con la API original
  };
}

// Tipos para compatibilidad (ya no se usan aquí)
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: string;
  expiresAt?: string;
}

// Archivo simplificado - ahora usa el NotificationProvider del layout principal
// Todo el código anterior se movió al NotificationProvider principal
