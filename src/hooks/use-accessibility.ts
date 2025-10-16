import { useCallback, useEffect, useRef } from 'react';

export interface AccessibilityOptions {
  announceToScreenReader?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
  skipLinks?: boolean;
}

export const useAccessibility = (options: AccessibilityOptions = {}) => {
  const {
    announceToScreenReader = false,
    focusManagement = false,
    keyboardNavigation = false,
    skipLinks = false,
  } = options;

  const announcementRef = useRef<HTMLDivElement | null>(null);

  // Función para anunciar mensajes a lectores de pantalla
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (!announceToScreenReader) {
        return;
      }

      if (!announcementRef.current) {
        const div = document.createElement('div');
        div.setAttribute('aria-live', priority);
        div.setAttribute('aria-atomic', 'true');
        div.style.position = 'absolute';
        div.style.left = '-10000px';
        div.style.width = '1px';
        div.style.height = '1px';
        div.style.overflow = 'hidden';
        document.body.appendChild(div);
        announcementRef.current = div;
      }

      announcementRef.current.textContent = message;
    },
    [announceToScreenReader]
  );

  // Función para manejar foco
  const manageFocus = useCallback(
    (element: HTMLElement | null) => {
      if (!focusManagement || !element) {
        return;
      }

      element.focus();
      // Asegurar que el elemento sea visible
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [focusManagement]
  );

  // Hook para navegación por teclado
  useEffect(() => {
    if (!keyboardNavigation) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Implementar navegación por teclado personalizada si es necesario
      // Por ejemplo, navegación con flechas, Enter, Escape, etc.
    };

    // ⚡ OPTIMIZACIÓN: Usar passive listener para mejor performance
    document.addEventListener('keydown', handleKeyDown, { passive: true });
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavigation]);

  // Hook para skip links
  useEffect(() => {
    if (!skipLinks) {
      return;
    }

    const handleSkipLink = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && event.shiftKey) {
        // Mostrar skip links temporalmente
        const skipLinks = document.querySelectorAll('[data-skip-link]');
        skipLinks.forEach(link => {
          (link as HTMLElement).style.display = 'block';
        });
      }
    };

    const handleSkipLinkHide = () => {
      const skipLinks = document.querySelectorAll('[data-skip-link]');
      skipLinks.forEach(link => {
        (link as HTMLElement).style.display = 'none';
      });
    };

    // ⚡ OPTIMIZACIÓN: Usar passive listeners para mejor performance
    document.addEventListener('keydown', handleSkipLink, { passive: true });
    document.addEventListener('focusout', handleSkipLinkHide, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleSkipLink);
      document.removeEventListener('focusout', handleSkipLinkHide);
    };
  }, [skipLinks]);

  return {
    announce,
    manageFocus,
  };
};

export default useAccessibility;
