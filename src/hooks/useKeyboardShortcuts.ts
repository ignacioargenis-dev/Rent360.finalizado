'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category: string;
}

interface UseKeyboardShortcutsOptions {
  userId: string;
  userRole: string;
  enabled?: boolean;
  showHelp?: boolean;
}

export function useKeyboardShortcuts({
  userId,
  userRole,
  enabled = true,
  showHelp = false
}: UseKeyboardShortcutsOptions) {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    // Navegación general
    {
      key: 'h',
      ctrlKey: true,
      action: () => router.push('/'),
      description: 'Ir al inicio',
      category: 'Navegación'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => router.push('/dashboard'),
      description: 'Ir al dashboard',
      category: 'Navegación'
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => {
        // Abrir búsqueda global
        const searchInput = document.querySelector('[data-global-search]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Abrir búsqueda global',
      category: 'Navegación'
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        // Abrir centro de notificaciones
        const notificationButton = document.querySelector('[data-notification-center]') as HTMLElement;
        if (notificationButton) {
          notificationButton.click();
        }
      },
      description: 'Abrir notificaciones',
      category: 'Navegación'
    },
    {
      key: '?',
      action: () => {
        // Mostrar ayuda de atajos
        const helpModal = document.querySelector('[data-shortcuts-help]') as HTMLElement;
        if (helpModal) {
          helpModal.style.display = 'block';
        }
      },
      description: 'Mostrar ayuda de atajos',
      category: 'Ayuda'
    },
    {
      key: 'Escape',
      action: () => {
        // Cerrar modales y overlays
        const modals = document.querySelectorAll('[data-modal]');
        modals.forEach(modal => {
          (modal as HTMLElement).style.display = 'none';
        });
      },
      description: 'Cerrar modales',
      category: 'Navegación'
    }
  ];

  // Atajos específicos por rol
  const roleSpecificShortcuts: Record<string, KeyboardShortcut[]> = {
    ADMIN: [
      {
        key: 'a',
        ctrlKey: true,
        action: () => router.push('/admin'),
        description: 'Ir al panel de administración',
        category: 'Administración'
      },
      {
        key: 'u',
        ctrlKey: true,
        action: () => router.push('/admin/users'),
        description: 'Gestionar usuarios',
        category: 'Administración'
      },
      {
        key: 'p',
        ctrlKey: true,
        action: () => router.push('/admin/properties'),
        description: 'Gestionar propiedades',
        category: 'Administración'
      },
      {
        key: 't',
        ctrlKey: true,
        action: () => router.push('/admin/tickets'),
        description: 'Ver tickets de soporte',
        category: 'Administración'
      }
    ],
    OWNER: [
      {
        key: 'o',
        ctrlKey: true,
        action: () => router.push('/owner'),
        description: 'Ir al panel de propietario',
        category: 'Propietario'
      },
      {
        key: 'p',
        ctrlKey: true,
        action: () => router.push('/owner/properties'),
        description: 'Mis propiedades',
        category: 'Propietario'
      },
      {
        key: 't',
        ctrlKey: true,
        action: () => router.push('/owner/tenants'),
        description: 'Mis inquilinos',
        category: 'Propietario'
      },
      {
        key: 'm',
        ctrlKey: true,
        action: () => router.push('/owner/payments'),
        description: 'Mis pagos',
        category: 'Propietario'
      }
    ],
    BROKER: [
      {
        key: 'b',
        ctrlKey: true,
        action: () => router.push('/broker'),
        description: 'Ir al panel de corredor',
        category: 'Corredor'
      },
      {
        key: 'c',
        ctrlKey: true,
        action: () => router.push('/broker/clients'),
        description: 'Mis clientes',
        category: 'Corredor'
      },
      {
        key: 'p',
        ctrlKey: true,
        action: () => router.push('/broker/properties'),
        description: 'Propiedades gestionadas',
        category: 'Corredor'
      }
    ],
    TENANT: [
      {
        key: 't',
        ctrlKey: true,
        action: () => router.push('/tenant'),
        description: 'Ir al panel de inquilino',
        category: 'Inquilino'
      },
      {
        key: 'c',
        ctrlKey: true,
        action: () => router.push('/tenant/contracts'),
        description: 'Mis contratos',
        category: 'Inquilino'
      },
      {
        key: 'p',
        ctrlKey: true,
        action: () => router.push('/tenant/payments'),
        description: 'Mis pagos',
        category: 'Inquilino'
      },
      {
        key: 'm',
        ctrlKey: true,
        action: () => router.push('/tenant/maintenance'),
        description: 'Solicitar mantenimiento',
        category: 'Inquilino'
      }
    ],
    RUNNER: [
      {
        key: 'r',
        ctrlKey: true,
        action: () => router.push('/runner'),
        description: 'Ir al panel de runner',
        category: 'Runner'
      },
      {
        key: 't',
        ctrlKey: true,
        action: () => router.push('/runner/tasks'),
        description: 'Mis tareas',
        category: 'Runner'
      }
    ],
    PROVIDER: [
      {
        key: 'v',
        ctrlKey: true,
        action: () => router.push('/provider'),
        description: 'Ir al panel de proveedor',
        category: 'Proveedor'
      },
      {
        key: 's',
        ctrlKey: true,
        action: () => router.push('/provider/services'),
        description: 'Mis servicios',
        category: 'Proveedor'
      },
      {
        key: 'r',
        ctrlKey: true,
        action: () => router.push('/provider/requests'),
        description: 'Solicitudes de mantenimiento',
        category: 'Proveedor'
      }
    ],
    MAINTENANCE: [
      {
        key: 'm',
        ctrlKey: true,
        action: () => router.push('/maintenance'),
        description: 'Ir al panel de mantenimiento',
        category: 'Mantenimiento'
      },
      {
        key: 's',
        ctrlKey: true,
        action: () => router.push('/maintenance/services'),
        description: 'Mis servicios',
        category: 'Mantenimiento'
      },
      {
        key: 'r',
        ctrlKey: true,
        action: () => router.push('/maintenance/requests'),
        description: 'Solicitudes de mantenimiento',
        category: 'Mantenimiento'
      }
    ]
  };

  // Combinar atajos generales con los específicos del rol
  const allShortcuts = [
    ...shortcuts,
    ...(roleSpecificShortcuts[userRole] || [])
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignorar si se está escribiendo en un input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // Buscar atajo coincidente
    const matchingShortcut = allShortcuts.find(shortcut => {
      return shortcut.key === event.key &&
             !!shortcut.ctrlKey === event.ctrlKey &&
             !!shortcut.altKey === event.altKey &&
             !!shortcut.shiftKey === event.shiftKey &&
             !!shortcut.metaKey === event.metaKey;
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      
      try {
        matchingShortcut.action();
        logger.debug('Keyboard shortcut executed', {
          userId,
          userRole,
          shortcut: matchingShortcut.description,
          key: event.key,
          modifiers: {
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey,
            meta: event.metaKey
          }
        });
      } catch (error) {
        logger.error('Error executing keyboard shortcut:', {
          userId,
          shortcut: matchingShortcut.description,
          error
        });
      }
    }
  }, [enabled, allShortcuts, userId, userRole]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  // Función para obtener atajos por categoría
  const getShortcutsByCategory = useCallback(() => {
    const categories: Record<string, KeyboardShortcut[]> = {};
    
    allShortcuts.forEach(shortcut => {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = [];
      }
      categories[shortcut.category].push(shortcut);
    });
    
    return categories;
  }, [allShortcuts]);

  // Función para formatear atajo para mostrar
  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.metaKey) parts.push('Cmd');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  }, []);

  return {
    shortcuts: allShortcuts,
    getShortcutsByCategory,
    formatShortcut,
    isEnabled: enabled
  };
}
