import { useTranslations } from 'next-intl';

export function useTranslation(namespace?: string) {
  const t = useTranslations(namespace);

  // Función helper para traducciones con parámetros
  const translate = (key: string, params?: Record<string, string | number>) => {
    return t(key, params);
  };

  // Función helper para traducciones de validación
  const translateValidation = (key: string, params?: Record<string, string | number>) => {
    return translate(`validation.${key}`, params);
  };

  // Función helper para traducciones de errores
  const translateError = (key: string) => {
    return translate(`errors.${key}`);
  };

  // Función helper para traducciones de éxito
  const translateSuccess = (key: string) => {
    return translate(`success.${key}`);
  };

  // Función helper para traducciones de navegación
  const translateNav = (key: string) => {
    return translate(`navigation.${key}`);
  };

  return {
    t: translate,
    tv: translateValidation,
    te: translateError,
    ts: translateSuccess,
    tn: translateNav,
  };
}

// Hook específico para traducciones comunes
export function useCommonTranslation() {
  return useTranslation('common');
}

// Hook específico para traducciones de autenticación
export function useAuthTranslation() {
  return useTranslation('auth');
}

// Hook específico para traducciones del dashboard
export function useDashboardTranslation() {
  return useTranslation('dashboard');
}

// Hook específico para traducciones de propiedades
export function usePropertiesTranslation() {
  return useTranslation('properties');
}

// Hook específico para traducciones de contratos
export function useContractsTranslation() {
  return useTranslation('contracts');
}

// Hook específico para traducciones de pagos
export function usePaymentsTranslation() {
  return useTranslation('payments');
}

// Hook específico para traducciones de usuarios
export function useUsersTranslation() {
  return useTranslation('users');
}

// Hook específico para traducciones de administración
export function useAdminTranslation() {
  return useTranslation('admin');
}
