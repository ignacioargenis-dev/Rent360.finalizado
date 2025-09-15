import { logger } from '@/lib/logger-edge';

/**
 * Tipos de referidos
 */
export enum ReferralType {
  CLIENT_REFERRAL = 'CLIENT_REFERRAL',
  PROVIDER_REFERRAL = 'PROVIDER_REFERRAL'
}

/**
 * Estados del referido
 */
export enum ReferralStatus {
  PENDING = 'PENDING',
  QUALIFIED = 'QUALIFIED',
  CONVERTED = 'CONVERTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

/**
 * Nivel del referidor
 */
export enum ReferrerLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND'
}

/**
 * Estructura de un referido
 */
export interface Referral {
  id: string;
  referrerId: string;
  referrerType: 'OWNER' | 'TENANT' | 'MAINTENANCE_PROVIDER' | 'SERVICE_PROVIDER';
  referredId: string;
  referralType: ReferralType;
  status: ReferralStatus;
  referralCode: string;
  createdAt: Date;
  qualifiedAt?: Date;
  convertedAt?: Date;
  commissionEarned: number;
  commissionPaid: boolean;
  metadata: {
    source: string;
    campaign?: string;
    notes?: string;
  };
}

/**
 * Configuración de comisiones por nivel
 */
export interface CommissionConfig {
  level: ReferrerLevel;
  clientReferralCommission: number; // porcentaje
  providerReferralCommission: number; // porcentaje
  minimumReferrals: number;
  maximumCommissionPerMonth: number;
  bonusThreshold: number; // número de referidos para bono especial
  bonusAmount: number;
}

/**
 * Estadísticas del referidor
 */
export interface ReferrerStats {
  totalReferrals: number;
  qualifiedReferrals: number;
  convertedReferrals: number;
  totalCommission: number;
  pendingCommission: number;
  currentLevel: ReferrerLevel;
  nextLevelThreshold: number;
  conversionRate: number;
  monthlyStats: {
    month: string;
    referrals: number;
    commission: number;
  }[];
}

/**
 * Servicio de sistema de referidos
 */
export class ReferralService {
  private static instance: ReferralService;
  private referrals: Map<string, Referral> = new Map();
  private referrerStats: Map<string, ReferrerStats> = new Map();

  // Configuración de comisiones por nivel
  private commissionConfigs: CommissionConfig[] = [
    {
      level: ReferrerLevel.BRONZE,
      clientReferralCommission: 5,
      providerReferralCommission: 8,
      minimumReferrals: 0,
      maximumCommissionPerMonth: 50000,
      bonusThreshold: 10,
      bonusAmount: 10000
    },
    {
      level: ReferrerLevel.SILVER,
      clientReferralCommission: 7,
      providerReferralCommission: 10,
      minimumReferrals: 5,
      maximumCommissionPerMonth: 100000,
      bonusThreshold: 15,
      bonusAmount: 25000
    },
    {
      level: ReferrerLevel.GOLD,
      clientReferralCommission: 10,
      providerReferralCommission: 12,
      minimumReferrals: 15,
      maximumCommissionPerMonth: 200000,
      bonusThreshold: 25,
      bonusAmount: 50000
    },
    {
      level: ReferrerLevel.PLATINUM,
      clientReferralCommission: 12,
      providerReferralCommission: 15,
      minimumReferrals: 30,
      maximumCommissionPerMonth: 500000,
      bonusThreshold: 50,
      bonusAmount: 100000
    },
    {
      level: ReferrerLevel.DIAMOND,
      clientReferralCommission: 15,
      providerReferralCommission: 18,
      minimumReferrals: 50,
      maximumCommissionPerMonth: 1000000,
      bonusThreshold: 100,
      bonusAmount: 200000
    }
  ];

  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): ReferralService {
    if (!ReferralService.instance) {
      ReferralService.instance = new ReferralService();
    }
    return ReferralService.instance;
  }

  /**
   * Genera un código único de referido
   */
  generateReferralCode(referrerId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `REF${referrerId.substr(0, 4)}${timestamp}${random}`.toUpperCase();
  }

  /**
   * Crea un nuevo referido
   */
  async createReferral(
    referrerId: string,
    referrerType: 'OWNER' | 'TENANT' | 'MAINTENANCE_PROVIDER' | 'SERVICE_PROVIDER',
    referralType: ReferralType,
    metadata: {
      source: string;
      campaign?: string;
      notes?: string;
    }
  ): Promise<{ referralCode: string; referral: Referral }> {
    try {
      const referralCode = this.generateReferralCode(referrerId);

      const referral: Referral = {
        id: this.generateReferralId(),
        referrerId,
        referrerType,
        referredId: '', // Se asignará cuando se registre el referido
        referralType,
        status: ReferralStatus.PENDING,
        referralCode,
        createdAt: new Date(),
        commissionEarned: 0,
        commissionPaid: false,
        metadata
      };

      this.referrals.set(referral.id, referral);

      // Actualizar estadísticas del referidor
      await this.updateReferrerStats(referrerId);

      logger.info('Referido creado:', {
        referrerId,
        referralCode,
        referralType
      });

      return { referralCode, referral };
    } catch (error) {
      logger.error('Error creando referido:', error as Error);
      throw error;
    }
  }

  /**
   * Registra cuando un referido se registra en la plataforma
   */
  async registerReferredUser(referralCode: string, referredUserId: string): Promise<Referral | null> {
    try {
      // Buscar el referido por código
      let referral: Referral | undefined;

      for (const [id, ref] of this.referrals) {
        if (ref.referralCode === referralCode && ref.status === ReferralStatus.PENDING) {
          referral = ref;
          break;
        }
      }

      if (!referral) {
        logger.warn('Código de referido no encontrado o ya usado:', { referralCode });
        return null;
      }

      // Actualizar referido
      referral.referredId = referredUserId;
      referral.status = ReferralStatus.QUALIFIED;
      referral.qualifiedAt = new Date();

      // Actualizar estadísticas
      await this.updateReferrerStats(referral.referrerId);

      logger.info('Usuario referido registrado:', {
        referralCode,
        referredUserId,
        referrerId: referral.referrerId
      });

      return referral;
    } catch (error) {
      logger.error('Error registrando usuario referido:', error as Error);
      throw error;
    }
  }

  /**
   * Convierte un referido cuando completa su primera transacción
   */
  async convertReferral(referralId: string, transactionAmount: number): Promise<void> {
    try {
      const referral = this.referrals.get(referralId);
      if (!referral) {
        throw new Error('Referido no encontrado');
      }

      if (referral.status !== ReferralStatus.QUALIFIED) {
        throw new Error('El referido no está en estado calificado');
      }

      // Calcular comisión
      const commission = this.calculateCommission(referral.referrerId, referral.referralType, transactionAmount);

      // Actualizar referido
      referral.status = ReferralStatus.CONVERTED;
      referral.convertedAt = new Date();
      referral.commissionEarned = commission;

      // Actualizar estadísticas
      await this.updateReferrerStats(referral.referrerId);

      logger.info('Referido convertido:', {
        referralId,
        commission,
        referrerId: referral.referrerId
      });

    } catch (error) {
      logger.error('Error convirtiendo referido:', error as Error);
      throw error;
    }
  }

  /**
   * Calcula la comisión para un referido
   */
  private calculateCommission(referrerId: string, referralType: ReferralType, transactionAmount: number): number {
    const stats = this.referrerStats.get(referrerId);
    if (!stats) return 0;

    const config = this.commissionConfigs.find(c => c.level === stats.currentLevel);
    if (!config) return 0;

    const commissionPercentage = referralType === ReferralType.CLIENT_REFERRAL
      ? config.clientReferralCommission
      : config.providerReferralCommission;

    const commission = (transactionAmount * commissionPercentage) / 100;

    // Aplicar límite mensual
    const monthlyCommission = this.getMonthlyCommission(referrerId);
    const availableLimit = config.maximumCommissionPerMonth - monthlyCommission;

    return Math.min(commission, availableLimit);
  }

  /**
   * Obtiene la comisión mensual de un referidor
   */
  private getMonthlyCommission(referrerId: string): number {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    return Array.from(this.referrals.values())
      .filter(r => r.referrerId === referrerId &&
                   r.status === ReferralStatus.CONVERTED &&
                   r.convertedAt?.toISOString().slice(0, 7) === currentMonth)
      .reduce((sum, r) => sum + r.commissionEarned, 0);
  }

  /**
   * Actualiza las estadísticas de un referidor
   */
  private async updateReferrerStats(referrerId: string): Promise<void> {
    const referrerReferrals = Array.from(this.referrals.values())
      .filter(r => r.referrerId === referrerId);

    const qualifiedReferrals = referrerReferrals.filter(r =>
      r.status === ReferralStatus.QUALIFIED || r.status === ReferralStatus.CONVERTED
    );

    const convertedReferrals = referrerReferrals.filter(r =>
      r.status === ReferralStatus.CONVERTED
    );

    const totalCommission = convertedReferrals.reduce((sum, r) => sum + r.commissionEarned, 0);
    const pendingCommission = convertedReferrals
      .filter(r => !r.commissionPaid)
      .reduce((sum, r) => sum + r.commissionEarned, 0);

    const currentLevel = this.calculateReferrerLevel(convertedReferrals.length);
    const nextLevel = this.getNextLevel(currentLevel);
    const nextLevelThreshold = nextLevel ? this.commissionConfigs.find(c => c.level === nextLevel)?.minimumReferrals || 0 : 0;

    const conversionRate = qualifiedReferrals.length > 0
      ? (convertedReferrals.length / qualifiedReferrals.length) * 100
      : 0;

    // Estadísticas mensuales (últimos 6 meses)
    const monthlyStats = this.calculateMonthlyStats(referrerReferrals);

    const stats: ReferrerStats = {
      totalReferrals: referrerReferrals.length,
      qualifiedReferrals: qualifiedReferrals.length,
      convertedReferrals: convertedReferrals.length,
      totalCommission,
      pendingCommission,
      currentLevel,
      nextLevelThreshold,
      conversionRate,
      monthlyStats
    };

    this.referrerStats.set(referrerId, stats);
  }

  /**
   * Calcula el nivel del referidor basado en referidos convertidos
   */
  private calculateReferrerLevel(convertedCount: number): ReferrerLevel {
    for (let i = this.commissionConfigs.length - 1; i >= 0; i--) {
      if (convertedCount >= this.commissionConfigs[i].minimumReferrals) {
        return this.commissionConfigs[i].level;
      }
    }
    return ReferrerLevel.BRONZE;
  }

  /**
   * Obtiene el siguiente nivel
   */
  private getNextLevel(currentLevel: ReferrerLevel): ReferrerLevel | null {
    const levels = Object.values(ReferrerLevel);
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }

  /**
   * Calcula estadísticas mensuales
   */
  private calculateMonthlyStats(referrals: Referral[]): Array<{ month: string; referrals: number; commission: number }> {
    const monthlyData: Record<string, { referrals: number; commission: number }> = {};

    referrals.forEach(referral => {
      if (referral.convertedAt) {
        const month = referral.convertedAt.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { referrals: 0, commission: 0 };
        }
        monthlyData[month].referrals++;
        monthlyData[month].commission += referral.commissionEarned;
      }
    });

    // Generar últimos 6 meses
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toISOString().slice(0, 7);
      result.push({
        month,
        referrals: monthlyData[month]?.referrals || 0,
        commission: monthlyData[month]?.commission || 0
      });
    }

    return result;
  }

  /**
   * Obtiene estadísticas de un referidor
   */
  async getReferrerStats(referrerId: string): Promise<ReferrerStats | null> {
    return this.referrerStats.get(referrerId) || null;
  }

  /**
   * Obtiene código de referido de un usuario
   */
  async getReferralCode(referrerId: string): Promise<string | null> {
    // Buscar código existente o generar uno nuevo
    for (const [id, referral] of this.referrals) {
      if (referral.referrerId === referrerId) {
        return referral.referralCode;
      }
    }

    // Si no existe, crear uno
    const result = await this.createReferral(referrerId, 'OWNER', ReferralType.CLIENT_REFERRAL, {
      source: 'system_generated'
    });

    return result.referralCode;
  }

  /**
   * Obtiene configuración de comisiones por nivel
   */
  getCommissionConfig(level: ReferrerLevel): CommissionConfig | null {
    return this.commissionConfigs.find(c => c.level === level) || null;
  }

  /**
   * Procesa pago de comisiones pendientes
   */
  async processCommissionPayments(referrerId: string): Promise<{
    paidCommissions: number;
    totalAmount: number;
  }> {
    const pendingReferrals = Array.from(this.referrals.values())
      .filter(r => r.referrerId === referrerId &&
                   r.status === ReferralStatus.CONVERTED &&
                   !r.commissionPaid);

    pendingReferrals.forEach(referral => {
      referral.commissionPaid = true;
    });

    const totalAmount = pendingReferrals.reduce((sum, r) => sum + r.commissionEarned, 0);

    // Actualizar estadísticas
    await this.updateReferrerStats(referrerId);

    logger.info('Comisiones procesadas:', {
      referrerId,
      count: pendingReferrals.length,
      totalAmount
    });

    return {
      paidCommissions: pendingReferrals.length,
      totalAmount
    };
  }

  /**
   * Genera reporte de referidos
   */
  async generateReferralReport(referrerId: string): Promise<{
    summary: ReferrerStats;
    recentReferrals: Referral[];
    earningsBreakdown: {
      thisMonth: number;
      lastMonth: number;
      totalEarned: number;
      availableForWithdrawal: number;
    };
  }> {
    const summary = await this.getReferrerStats(referrerId);
    if (!summary) {
      throw new Error('Estadísticas no encontradas');
    }

    const recentReferrals = Array.from(this.referrals.values())
      .filter(r => r.referrerId === referrerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    const thisMonth = summary.monthlyStats[summary.monthlyStats.length - 1]?.commission || 0;
    const lastMonth = summary.monthlyStats[summary.monthlyStats.length - 2]?.commission || 0;

    const earningsBreakdown = {
      thisMonth,
      lastMonth,
      totalEarned: summary.totalCommission,
      availableForWithdrawal: summary.pendingCommission
    };

    return {
      summary,
      recentReferrals,
      earningsBreakdown
    };
  }

  /**
   * Genera ID único para referido
   */
  private generateReferralId(): string {
    return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Inicializa datos de ejemplo
   */
  private initializeMockData(): void {
    // Crear algunos referidos de ejemplo
    const mockReferrals: Referral[] = [
      {
        id: 'ref_001',
        referrerId: 'user_001',
        referrerType: 'OWNER',
        referredId: 'user_002',
        referralType: ReferralType.CLIENT_REFERRAL,
        status: ReferralStatus.CONVERTED,
        referralCode: 'REFUSER001',
        createdAt: new Date('2024-01-15'),
        qualifiedAt: new Date('2024-01-16'),
        convertedAt: new Date('2024-01-20'),
        commissionEarned: 2500,
        commissionPaid: true,
        metadata: { source: 'social_media', campaign: 'facebook_campaign' }
      },
      {
        id: 'ref_002',
        referrerId: 'user_001',
        referrerType: 'OWNER',
        referredId: 'prov_003',
        referralType: ReferralType.PROVIDER_REFERRAL,
        status: ReferralStatus.CONVERTED,
        referralCode: 'REFUSER002',
        createdAt: new Date('2024-01-10'),
        qualifiedAt: new Date('2024-01-12'),
        convertedAt: new Date('2024-01-18'),
        commissionEarned: 4000,
        commissionPaid: false,
        metadata: { source: 'direct_invitation' }
      }
    ];

    mockReferrals.forEach(referral => {
      this.referrals.set(referral.id, referral);
    });

    // Calcular estadísticas iniciales
    this.updateReferrerStats('user_001');

    logger.info('Datos de referidos inicializados');
  }

  /**
   * Obtiene estadísticas generales del sistema
   */
  async getSystemStats(): Promise<{
    totalReferrals: number;
    totalConverted: number;
    totalCommissionPaid: number;
    topReferrers: Array<{ referrerId: string; convertedCount: number; totalCommission: number }>;
  }> {
    const allReferrals = Array.from(this.referrals.values());
    const convertedReferrals = allReferrals.filter(r => r.status === ReferralStatus.CONVERTED);
    const totalCommissionPaid = convertedReferrals
      .filter(r => r.commissionPaid)
      .reduce((sum, r) => sum + r.commissionEarned, 0);

    // Top referidores
    const referrerStats = new Map<string, { convertedCount: number; totalCommission: number }>();

    convertedReferrals.forEach(referral => {
      const stats = referrerStats.get(referral.referrerId) || { convertedCount: 0, totalCommission: 0 };
      stats.convertedCount++;
      stats.totalCommission += referral.commissionEarned;
      referrerStats.set(referral.referrerId, stats);
    });

    const topReferrers = Array.from(referrerStats.entries())
      .map(([referrerId, stats]) => ({ referrerId, ...stats }))
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, 10);

    return {
      totalReferrals: allReferrals.length,
      totalConverted: convertedReferrals.length,
      totalCommissionPaid,
      topReferrers
    };
  }
}

/**
 * Instancia global del servicio de referidos
 */
export const referralService = ReferralService.getInstance();
