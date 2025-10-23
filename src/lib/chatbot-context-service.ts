/**
 * SERVICIO DE CONTEXTO PARA CHATBOT RENT360
 * Proporciona datos reales del usuario para respuestas contextuales
 */

import { logger } from './logger-minimal';

export interface UserContext {
  role: string;
  id: string;
  name?: string;
  email?: string;
  data?: any;
}

export interface RoleData {
  properties?: any[];
  contracts?: any[];
  legalCases?: any[];
  payments?: any[];
  maintenance?: any[];
  transactions?: any[];
  tickets?: any[];
  earnings?: any[];
  tasks?: any[];
  commissions?: any[];
  users?: any[];
  stats?: any;
}

const ROLE_MAPPINGS = {
  OWNER: 'owner',
  TENANT: 'tenant',
  BROKER: 'broker',
  ADMIN: 'admin',
  PROVIDER: 'provider',
  MAINTENANCE_PROVIDER: 'provider',
  SERVICE_PROVIDER: 'provider',
  RUNNER: 'runner',
  SUPPORT: 'support',
  GUEST: 'guest',
};

export class ChatbotContextService {
  /**
   * Normaliza el rol del usuario a formato consistente
   */
  static normalizeRole(rawRole: string): string {
    if (!rawRole) {
      return 'guest';
    }
    return ROLE_MAPPINGS[rawRole.toUpperCase() as keyof typeof ROLE_MAPPINGS] || 'guest';
  }

  /**
   * Obtiene el contexto completo del usuario desde múltiples fuentes
   */
  static async getUserContext(authUser?: any): Promise<UserContext> {
    try {
      let userContext: UserContext = {
        role: 'guest',
        id: 'anonymous',
      };

      // 1. Intentar desde auth provider
      if (authUser) {
        userContext = {
          role: this.normalizeRole(authUser.role),
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
        };
      }

      // 2. Fallback: intentar desde API si no hay auth provider
      if (userContext.role === 'guest') {
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            if (userData.success && userData.user) {
              userContext = {
                role: this.normalizeRole(userData.user.role),
                id: userData.user.id,
                name: userData.user.name,
                email: userData.user.email,
              };
            }
          }
        } catch (error) {
          logger.warn('Error obteniendo contexto desde API:', error);
        }
      }

      return userContext;
    } catch (error) {
      logger.error('Error obteniendo contexto de usuario:', error);
      return { role: 'guest', id: 'anonymous' };
    }
  }

  /**
   * Obtiene datos específicos del rol del usuario
   */
  static async getUserData(userId: string, userRole: string): Promise<RoleData | null> {
    if (userRole === 'guest' || userId === 'anonymous') {
      return null;
    }

    try {
      switch (userRole) {
        case 'owner':
          return await this.getOwnerData(userId);

        case 'tenant':
          return await this.getTenantData(userId);

        case 'broker':
          return await this.getBrokerData(userId);

        case 'admin':
          return await this.getAdminData(userId);

        case 'provider':
          return await this.getProviderData(userId);

        case 'runner':
          return await this.getRunnerData(userId);

        case 'support':
          return await this.getSupportData(userId);

        default:
          return null;
      }
    } catch (error) {
      logger.error(`Error obteniendo datos para rol ${userRole}:`, error);
      return null;
    }
  }

  /**
   * Obtiene datos específicos de propietario
   */
  private static async getOwnerData(userId: string): Promise<RoleData> {
    try {
      const [propertiesRes, contractsRes, legalCasesRes, paymentsRes, maintenanceRes] =
        await Promise.allSettled([
          fetch(`/api/owner/properties?limit=5`, { credentials: 'include' }),
          fetch(`/api/owner/contracts?limit=5`, { credentials: 'include' }),
          fetch(`/api/owner/legal-cases?limit=3`, { credentials: 'include' }),
          fetch(`/api/owner/payments?limit=3`, { credentials: 'include' }),
          fetch(`/api/owner/maintenance?limit=3`, { credentials: 'include' }),
        ]);

      return {
        properties:
          propertiesRes.status === 'fulfilled' && propertiesRes.value.ok
            ? (await propertiesRes.value.json()).properties || []
            : [],
        contracts:
          contractsRes.status === 'fulfilled' && contractsRes.value.ok
            ? (await contractsRes.value.json()).contracts || []
            : [],
        legalCases:
          legalCasesRes.status === 'fulfilled' && legalCasesRes.value.ok
            ? (await legalCasesRes.value.json()).cases || []
            : [],
        payments:
          paymentsRes.status === 'fulfilled' && paymentsRes.value.ok
            ? (await paymentsRes.value.json()).payments || []
            : [],
        maintenance:
          maintenanceRes.status === 'fulfilled' && maintenanceRes.value.ok
            ? (await maintenanceRes.value.json()).requests || []
            : [],
      };
    } catch (error) {
      logger.warn('Error obteniendo datos de owner:', error);
      return {};
    }
  }

  /**
   * Obtiene datos específicos de inquilino
   */
  private static async getTenantData(userId: string): Promise<RoleData> {
    try {
      const [contractsRes, paymentsRes, maintenanceRes] = await Promise.allSettled([
        fetch(`/api/tenant/contracts?limit=5`, { credentials: 'include' }),
        fetch(`/api/tenant/payments?limit=5`, { credentials: 'include' }),
        fetch(`/api/tenant/maintenance?limit=3`, { credentials: 'include' }),
      ]);

      return {
        contracts:
          contractsRes.status === 'fulfilled' && contractsRes.value.ok
            ? (await contractsRes.value.json()).contracts || []
            : [],
        payments:
          paymentsRes.status === 'fulfilled' && paymentsRes.value.ok
            ? (await paymentsRes.value.json()).payments || []
            : [],
        maintenance:
          maintenanceRes.status === 'fulfilled' && maintenanceRes.value.ok
            ? (await maintenanceRes.value.json()).requests || []
            : [],
      };
    } catch (error) {
      logger.warn('Error obteniendo datos de tenant:', error);
      return {};
    }
  }

  /**
   * Obtiene datos específicos de corredor
   */
  private static async getBrokerData(userId: string): Promise<RoleData> {
    try {
      const [contractsRes, commissionsRes, propertiesRes] = await Promise.allSettled([
        fetch(`/api/broker/contracts?limit=5`, { credentials: 'include' }),
        fetch(`/api/broker/commissions?limit=5`, { credentials: 'include' }),
        fetch(`/api/broker/properties?limit=5`, { credentials: 'include' }),
      ]);

      return {
        contracts:
          contractsRes.status === 'fulfilled' && contractsRes.value.ok
            ? (await contractsRes.value.json()).contracts || []
            : [],
        commissions:
          commissionsRes.status === 'fulfilled' && commissionsRes.value.ok
            ? (await commissionsRes.value.json()).commissions || []
            : [],
        properties:
          propertiesRes.status === 'fulfilled' && propertiesRes.value.ok
            ? (await propertiesRes.value.json()).properties || []
            : [],
      };
    } catch (error) {
      logger.warn('Error obteniendo datos de broker:', error);
      return {};
    }
  }

  /**
   * Obtiene datos específicos de administrador
   */
  private static async getAdminData(userId: string): Promise<RoleData> {
    try {
      const [statsRes, usersRes] = await Promise.allSettled([
        fetch('/api/admin/dashboard-stats', { credentials: 'include' }),
        fetch('/api/admin/users?limit=10', { credentials: 'include' }),
      ]);

      return {
        stats:
          statsRes.status === 'fulfilled' && statsRes.value.ok ? await statsRes.value.json() : null,
        users:
          usersRes.status === 'fulfilled' && usersRes.value.ok
            ? (await usersRes.value.json()).users || []
            : [],
      };
    } catch (error) {
      logger.warn('Error obteniendo datos de admin:', error);
      return {};
    }
  }

  /**
   * Obtiene datos específicos de proveedor
   */
  private static async getProviderData(userId: string): Promise<RoleData> {
    try {
      const [transactionsRes, jobsRes] = await Promise.allSettled([
        fetch('/api/provider/transactions?limit=5', { credentials: 'include' }),
        fetch('/api/provider/jobs?limit=5', { credentials: 'include' }),
      ]);

      return {
        transactions:
          transactionsRes.status === 'fulfilled' && transactionsRes.value.ok
            ? (await transactionsRes.value.json()).transactions || []
            : [],
        tasks:
          jobsRes.status === 'fulfilled' && jobsRes.value.ok
            ? (await jobsRes.value.json()).jobs || []
            : [],
      };
    } catch (error) {
      logger.warn('Error obteniendo datos de provider:', error);
      return {};
    }
  }

  /**
   * Obtiene datos específicos de runner
   */
  private static async getRunnerData(userId: string): Promise<RoleData> {
    try {
      const [tasksRes, earningsRes] = await Promise.allSettled([
        fetch('/api/runner/tasks?limit=5', { credentials: 'include' }),
        fetch('/api/runner/earnings?limit=5', { credentials: 'include' }),
      ]);

      return {
        tasks:
          tasksRes.status === 'fulfilled' && tasksRes.value.ok
            ? (await tasksRes.value.json()).tasks || []
            : [],
        earnings:
          earningsRes.status === 'fulfilled' && earningsRes.value.ok
            ? (await earningsRes.value.json()).earnings || []
            : [],
      };
    } catch (error) {
      logger.warn('Error obteniendo datos de runner:', error);
      return {};
    }
  }

  /**
   * Obtiene datos específicos de soporte
   */
  private static async getSupportData(userId: string): Promise<RoleData> {
    try {
      const [ticketsRes, usersRes, propertiesRes] = await Promise.allSettled([
        fetch('/api/support/tickets?limit=5', { credentials: 'include' }),
        fetch('/api/support/users?limit=10', { credentials: 'include' }),
        fetch('/api/support/properties?limit=10', { credentials: 'include' }),
      ]);

      return {
        tickets:
          ticketsRes.status === 'fulfilled' && ticketsRes.value.ok
            ? (await ticketsRes.value.json()).tickets || []
            : [],
        users:
          usersRes.status === 'fulfilled' && usersRes.value.ok
            ? (await usersRes.value.json()).users || []
            : [],
        properties:
          propertiesRes.status === 'fulfilled' && propertiesRes.value.ok
            ? (await propertiesRes.value.json()).properties || []
            : [],
      };
    } catch (error) {
      logger.warn('Error obteniendo datos de support:', error);
      return {};
    }
  }

  /**
   * Genera resumen contextual del usuario
   */
  static generateContextSummary(userRole: string, userData: RoleData): string {
    const summaries = {
      owner: `Propietario con ${userData.properties?.length || 0} propiedades, ${userData.contracts?.length || 0} contratos activos, ${userData.legalCases?.length || 0} casos legales`,
      tenant: `Inquilino con ${userData.contracts?.length || 0} contratos, ${userData.payments?.filter(p => p.status === 'pending').length || 0} pagos pendientes`,
      broker: `Corredor con ${userData.contracts?.length || 0} contratos gestionados, ${userData.commissions?.length || 0} comisiones activas`,
      admin: `Administrador supervisando ${userData.users?.length || 0} usuarios del sistema`,
      provider: `Proveedor con ${userData.tasks?.length || 0} trabajos activos, ${userData.transactions?.length || 0} transacciones completadas`,
      runner: `Runner con ${userData.tasks?.length || 0} tareas pendientes, ${userData.earnings?.length || 0} ganancias este mes`,
      support: `Soporte manejando ${userData.tickets?.length || 0} tickets, ${userData.users?.length || 0} usuarios`,
      guest: 'Usuario no autenticado',
    };

    return summaries[userRole as keyof typeof summaries] || summaries.guest;
  }
}
