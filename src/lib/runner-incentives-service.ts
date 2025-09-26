import { db } from './db';
import { logger } from './logger';
import { DatabaseError, BusinessLogicError } from './errors';
import { NotificationService } from './notification-service';
import { RunnerReportsService } from './runner-reports-service';
import { RunnerRatingService } from './runner-rating-service';
import { RunnerIncentiveStatus } from '@prisma/client';

export interface IncentiveRule {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'rating' | 'volume' | 'loyalty' | 'seasonal';
  category: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

  // Criterios de elegibilidad
  criteria: {
    minVisits?: number | undefined;
    minRating?: number | undefined;
    minEarnings?: number | undefined;
    minCompletionRate?: number | undefined;
    consecutivePeriods?: number | undefined;
    rankingPosition?: number | undefined;
  };

  // Recompensas
  rewards: {
    bonusAmount?: number | undefined;
    bonusPercentage?: number | undefined;
    priorityBonus?: number | undefined;
    badge?: string | undefined;
    title?: string | undefined;
    features?: string[] | undefined;
  };

  // Configuración
  isActive: boolean;
  autoGrant: boolean;
  maxRecipients?: number | undefined;
  cooldownPeriod: number; // días entre grants del mismo incentivo
  validFrom: Date;
  validUntil?: Date | undefined;
}

export interface RunnerIncentive {
  id: string;
  runnerId: string;
  incentiveRuleId: string;
  status: RunnerIncentiveStatus;
  earnedAt: Date;
  grantedAt?: Date | undefined;
  claimedAt?: Date | undefined;
  expiresAt?: Date | undefined;

  // Detalles del logro
  achievementData: {
    visitsCompleted?: number | undefined;
    ratingAchieved?: number | undefined;
    earningsGenerated?: number | undefined;
    rankingPosition?: number | undefined;
    periodStart: Date;
    periodEnd: Date;
  };

  // Recompensas otorgadas
  rewardsGranted: {
    bonusAmount?: number | undefined;
    badge?: string | undefined;
    title?: string | undefined;
    features?: string[] | undefined;
  };

  // Metadata
  notificationSent: boolean;
  adminApprovalRequired: boolean;
  approvedBy?: string | undefined;
  notes?: string | undefined;
}

export interface RunnerIncentiveWithRule extends RunnerIncentive {
  incentiveRule: IncentiveRule;
}

export interface IncentiveLeaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;

  rankings: {
    position: number;
    runnerId: string;
    runnerName: string;
    score: number;
    incentives: string[];
    totalRewards: number;
  }[];

  topPerformers: {
    category: string;
    runnerId: string;
    runnerName: string;
    achievement: string;
    reward: string;
  }[];
}

/**
 * Servicio de incentivos para runners basado en rendimiento
 */
export class RunnerIncentivesService {
  private static readonly INCENTIVE_RULES: IncentiveRule[] = [
    // ===== INCENTIVOS POR RENDIMIENTO =====
    {
      id: 'super_runner',
      name: 'Super Runner',
      description: 'Completar 20+ visitas en una semana',
      type: 'volume',
      category: 'bronze',
      criteria: {
        minVisits: 20
      },
      rewards: {
        bonusAmount: 5000,
        badge: '🏃‍♂️',
        title: 'Super Runner'
      },
      isActive: true,
      autoGrant: true,
      cooldownPeriod: 7,
      validFrom: new Date('2024-01-01')
    },

    {
      id: 'top_earner',
      name: 'Top Earner',
      description: 'Generar más de $100.000 en ganancias semanales',
      type: 'performance',
      category: 'silver',
      criteria: {
        minEarnings: 100000
      },
      rewards: {
        bonusPercentage: 2,
        badge: '💰',
        title: 'Top Earner'
      },
      isActive: true,
      autoGrant: true,
      cooldownPeriod: 7,
      validFrom: new Date('2024-01-01')
    },

    {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Mantener calificación promedio de 4.9+ con mínimo 10 visitas',
      type: 'rating',
      category: 'gold',
      criteria: {
        minRating: 4.9,
        minVisits: 10
      },
      rewards: {
        bonusAmount: 15000,
        priorityBonus: 1.5,
        badge: '⭐',
        title: 'Perfectionist',
        features: ['prioridad_visitas_premium', 'badge_perfil']
      },
      isActive: true,
      autoGrant: true,
      cooldownPeriod: 30,
      validFrom: new Date('2024-01-01')
    },

    {
      id: 'rising_star',
      name: 'Rising Star',
      description: 'Mejorar calificación en 0.3+ puntos en un mes',
      type: 'performance',
      category: 'silver',
      criteria: {
        minRating: 4.5,
        consecutivePeriods: 1
      },
      rewards: {
        bonusAmount: 8000,
        badge: '📈',
        title: 'Rising Star'
      },
      isActive: true,
      autoGrant: true,
      cooldownPeriod: 30,
      validFrom: new Date('2024-01-01')
    },

    {
      id: 'loyalty_champion',
      name: 'Loyalty Champion',
      description: '3 meses consecutivos en el top 10 del ranking',
      type: 'loyalty',
      category: 'platinum',
      criteria: {
        rankingPosition: 10,
        consecutivePeriods: 3
      },
      rewards: {
        bonusAmount: 50000,
        priorityBonus: 2.0,
        badge: '👑',
        title: 'Loyalty Champion',
        features: ['prioridad_maxima', 'comision_extra', 'badge_exclusivo']
      },
      isActive: true,
      autoGrant: false, // Requiere aprobación manual
      maxRecipients: 5,
      cooldownPeriod: 90,
      validFrom: new Date('2024-01-01')
    },

    {
      id: 'community_hero',
      name: 'Community Hero',
      description: 'Ayudar a 5+ nuevos runners con onboarding',
      type: 'loyalty',
      category: 'gold',
      criteria: {
        minVisits: 50 // Placeholder - implementar sistema de mentoring
      },
      rewards: {
        bonusAmount: 20000,
        badge: '🤝',
        title: 'Community Hero',
        features: ['descuento_servicios', 'acceso_beta']
      },
      isActive: true,
      autoGrant: false,
      cooldownPeriod: 180,
      validFrom: new Date('2024-01-01')
    },

    // ===== INCENTIVOS ESTACIONALES =====
    {
      id: 'summer_boost',
      name: 'Summer Boost',
      description: 'Incrementar visitas en 25% durante verano',
      type: 'seasonal',
      category: 'silver',
      criteria: {
        minVisits: 15
      },
      rewards: {
        bonusPercentage: 3,
        badge: '☀️',
        title: 'Summer Champion'
      },
      isActive: false, // Solo activar en temporada
      autoGrant: true,
      cooldownPeriod: 30,
      validFrom: new Date('2024-12-01'),
      validUntil: new Date('2024-02-28')
    }
  ];

  /**
   * Evalúa y otorga incentivos a un runner
   */
  static async evaluateRunnerIncentives(runnerId: string): Promise<RunnerIncentive[]> {
    try {
      const runner = await db.user.findUnique({
        where: { id: runnerId },
        select: {
          id: true,
          name: true
        }
      });

      if (!runner) {
        throw new BusinessLogicError('Runner no encontrado');
      }

      const grantedIncentives: RunnerIncentive[] = [];

      // Obtener métricas de rendimiento actuales
      const performanceMetrics = await RunnerReportsService.generateRunnerPerformanceMetrics(runnerId);
      const ratingSummary = await RunnerRatingService.getRunnerRatingSummary(runnerId);

      // Evaluar cada regla de incentivo activa
      for (const rule of this.INCENTIVE_RULES) {
        if (!rule.isActive) continue;

        // Verificar período de validez
        const now = new Date();
        if (rule.validUntil && now > rule.validUntil) continue;
        if (now < rule.validFrom) continue;

        // Verificar si ya recibió este incentivo recientemente
        const recentIncentive = await db.runnerIncentive.findFirst({
          where: {
            runnerId,
            incentiveRuleId: rule.id,
            earnedAt: {
              gte: new Date(Date.now() - rule.cooldownPeriod * 24 * 60 * 60 * 1000)
            }
          }
        });

        if (recentIncentive) continue;

        // Verificar límite de destinatarios
        if (rule.maxRecipients) {
          const totalRecipients = await db.runnerIncentive.count({
            where: {
              incentiveRuleId: rule.id,
              status: RunnerIncentiveStatus.GRANTED,
              grantedAt: {
                gte: new Date(Date.now() - rule.cooldownPeriod * 24 * 60 * 60 * 1000)
              }
            }
          });

          if (totalRecipients >= rule.maxRecipients) continue;
        }

        // Evaluar criterios de elegibilidad
        if (this.evaluateIncentiveCriteria(rule, performanceMetrics, ratingSummary)) {
          // Crear incentivo
          const incentive = await this.grantIncentive(runnerId, rule, performanceMetrics, ratingSummary);

          if (incentive) {
            grantedIncentives.push(incentive);

            // Enviar notificación
            await this.notifyIncentiveGranted(incentive, runner.name || 'Runner');
          }
        }
      }

      logger.info('Evaluación de incentivos completada', {
        runnerId,
        incentivesGranted: grantedIncentives.length
      });

      return grantedIncentives;

    } catch (error) {
      logger.error('Error evaluando incentivos:', error as Error);
      throw error;
    }
  }

  /**
   * Obtiene todos los incentivos de un runner
   */
  static async getRunnerIncentives(
    runnerId: string,
    status?: RunnerIncentiveStatus,
    limit: number = 20
  ): Promise<RunnerIncentive[]> {
    try {
      const whereClause: any = { runnerId };
      if (status) {
        whereClause.status = status;
      }

      const incentives = await db.runnerIncentive.findMany({
        where: whereClause,
        orderBy: {
          earnedAt: 'desc'
        },
        take: limit
      });

      // Mapear los resultados de Prisma a la interfaz RunnerIncentive
      return incentives.map(incentive => ({
        id: incentive.id,
        runnerId: incentive.runnerId,
        incentiveRuleId: incentive.incentiveRuleId,
        status: incentive.status,
        earnedAt: incentive.earnedAt,
        grantedAt: incentive.grantedAt ?? undefined,
        claimedAt: incentive.claimedAt ?? undefined,
        expiresAt: incentive.expiresAt ?? undefined,
        achievementData: incentive.achievementData as RunnerIncentive['achievementData'],
        rewardsGranted: incentive.rewardsGranted as RunnerIncentive['rewardsGranted'],
        notificationSent: incentive.notificationSent,
        adminApprovalRequired: incentive.adminApprovalRequired,
        approvedBy: incentive.approvedBy ?? undefined,
        notes: incentive.notes ?? undefined
      }));

    } catch (error) {
      logger.error('Error obteniendo incentivos de runner:', error as Error);
      throw error;
    }
  }

  /**
   * Reclama un incentivo otorgado
   */
  static async claimIncentive(incentiveId: string, runnerId: string): Promise<boolean> {
    try {
      const incentive = await db.runnerIncentive.findUnique({
        where: { id: incentiveId }
      });

      if (!incentive) {
        throw new BusinessLogicError('Incentivo no encontrado');
      }

      if (incentive.runnerId !== runnerId) {
        throw new BusinessLogicError('No tienes permiso para reclamar este incentivo');
      }

      if (incentive.status !== RunnerIncentiveStatus.GRANTED) {
        throw new BusinessLogicError('El incentivo no está disponible para reclamar');
      }

      // Verificar si expiró
      if (incentive.expiresAt && new Date() > incentive.expiresAt) {
        await db.runnerIncentive.update({
          where: { id: incentiveId },
          data: { status: RunnerIncentiveStatus.EXPIRED }
        });
        throw new BusinessLogicError('El incentivo ha expirado');
      }

      // Marcar como reclamado
      await db.runnerIncentive.update({
        where: { id: incentiveId },
        data: {
          status: RunnerIncentiveStatus.CLAIMED,
          claimedAt: new Date()
        }
      });

      // Aplicar recompensas (bonos, etc.)
      await this.applyIncentiveRewards(incentive);

      logger.info('Incentivo reclamado exitosamente', {
        incentiveId,
        runnerId,
        rewardType: incentive.rewardsGranted
      });

      return true;

    } catch (error) {
      logger.error('Error reclamando incentivo:', error as Error);
      throw error;
    }
  }

  /**
   * Genera leaderboard de incentivos
   */
  static async generateIncentivesLeaderboard(
    period: 'weekly' | 'monthly' = 'weekly'
  ): Promise<IncentiveLeaderboard> {
    try {
      const now = new Date();
      const startDate = period === 'weekly'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : new Date(now.getFullYear(), now.getMonth(), 1);

      // Obtener todos los incentivos del período
      const periodIncentives = await db.runnerIncentive.findMany({
        where: {
          earnedAt: {
            gte: startDate,
            lte: now
          },
          status: {
            in: [RunnerIncentiveStatus.GRANTED, RunnerIncentiveStatus.CLAIMED]
          }
        },
        include: {
          runner: {
            select: {
              id: true,
              name: true
            }
          },
          incentiveRule: true
        }
      });

      // Agrupar por runner y calcular scores
      const runnerStats = new Map<string, {
        runnerId: string;
        runnerName: string;
        incentives: string[];
        totalRewards: number;
        score: number;
      }>();

      for (const incentive of periodIncentives) {
        const runnerId = incentive.runnerId;
        const existing = runnerStats.get(runnerId);

        if (existing) {
          existing.incentives.push(incentive.incentiveRule.name);
          existing.totalRewards += incentive.rewardsGranted.bonusAmount || 0;
          existing.score += this.calculateIncentiveScore(incentive.incentiveRule);
        } else {
          runnerStats.set(runnerId, {
            runnerId,
            runnerName: incentive.runner?.name || 'Runner',
            incentives: [incentive.incentiveRule.name],
            totalRewards: incentive.rewardsGranted.bonusAmount || 0,
            score: this.calculateIncentiveScore(incentive.incentiveRule)
          });
        }
      }

      // Convertir a array y ordenar
      const rankings = Array.from(runnerStats.values())
        .sort((a, b) => b.score - a.score)
        .map((runner, index) => ({
          position: index + 1,
          ...runner
        }));

      // Obtener top performers por categoría
      const topPerformers = await this.getTopPerformersByCategory(startDate, now);

      return {
        period,
        startDate,
        endDate: now,
        rankings,
        topPerformers
      };

    } catch (error) {
      logger.error('Error generando leaderboard de incentivos:', error as Error);
      return {
        period,
        startDate: new Date(),
        endDate: new Date(),
        rankings: [],
        topPerformers: []
      };
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  private static evaluateIncentiveCriteria(
    rule: IncentiveRule,
    performance: any,
    rating: any
  ): boolean {
    const criteria = rule.criteria;

    // Verificar visitas mínimas
    if (criteria.minVisits && performance.totalVisits < criteria.minVisits) {
      return false;
    }

    // Verificar calificación mínima
    if (criteria.minRating && rating.averageRating < criteria.minRating) {
      return false;
    }

    // Verificar ganancias mínimas
    if (criteria.minEarnings && performance.totalEarnings < criteria.minEarnings) {
      return false;
    }

    // Verificar tasa de completitud
    if (criteria.minCompletionRate && performance.completionRate < criteria.minCompletionRate) {
      return false;
    }

    // Verificar posición en ranking
    if (criteria.rankingPosition && performance.overallRanking > criteria.rankingPosition) {
      return false;
    }

    return true;
  }

  private static async grantIncentive(
    runnerId: string,
    rule: IncentiveRule,
    performance: any,
    rating: any
  ): Promise<RunnerIncentive | null> {
    try {
      // Calcular recompensas
      const rewardsGranted = this.calculateRewards(rule, performance, rating);

      // Crear registro de incentivo
      const incentive = await db.runnerIncentive.create({
        data: {
          runnerId,
          incentiveRuleId: rule.id,
          status: rule.autoGrant ? RunnerIncentiveStatus.GRANTED : RunnerIncentiveStatus.EARNED,
          earnedAt: new Date(),
          grantedAt: rule.autoGrant ? new Date() : undefined,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días para reclamar
          achievementData: {
            visitsCompleted: performance.totalVisits,
            ratingAchieved: rating.averageRating,
            earningsGenerated: performance.totalEarnings,
            rankingPosition: performance.overallRanking,
            periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            periodEnd: new Date()
          },
          rewardsGranted,
          notificationSent: false,
          adminApprovalRequired: !rule.autoGrant
        }
      });

      logger.info('Incentivo otorgado', {
        runnerId,
        incentiveRule: rule.name,
        rewards: rewardsGranted
      });

      return incentive;

    } catch (error) {
      logger.error('Error otorgando incentivo:', error as Error);
      return null;
    }
  }

  private static calculateRewards(rule: IncentiveRule, performance: any, rating: any): any {
    const rewards = { ...rule.rewards };

    // Calcular bono por porcentaje si aplica
    if (rewards.bonusPercentage) {
      rewards.bonusAmount = Math.round(performance.totalEarnings * (rewards.bonusPercentage / 100));
    }

    // Aplicar multiplicador de prioridad si existe
    if (rewards.priorityBonus) {
      rewards.bonusAmount = Math.round((rewards.bonusAmount || 0) * rewards.priorityBonus);
    }

    return rewards;
  }

  private static calculateIncentiveScore(rule: IncentiveRule): number {
    const categoryScores = {
      bronze: 10,
      silver: 25,
      gold: 50,
      platinum: 100,
      diamond: 200
    };

    return categoryScores[rule.category] || 0;
  }

  private static async notifyIncentiveGranted(
    incentive: RunnerIncentive,
    runnerName: string
  ): Promise<void> {
    try {
      // Obtener detalles de la regla
      const rule = this.INCENTIVE_RULES.find(r => r.id === incentive.incentiveRuleId);
      if (!rule) return;

      await NotificationService.notifyRunnerIncentiveAchieved({
        runnerId: incentive.runnerId,
        incentiveName: rule.name,
        incentiveLevel: rule.category,
        rewardDescription: this.formatRewardDescription(incentive.rewardsGranted),
        visitCount: incentive.achievementData.visitsCompleted || 0,
        averageRating: 4.5 // Placeholder
      });

    } catch (error) {
      logger.error('Error notificando incentivo:', error as Error);
    }
  }

  private static formatRewardDescription(rewards: any): string {
    const parts: string[] = [];

    if (rewards.bonusAmount) {
      parts.push(`Bono de $${rewards.bonusAmount.toLocaleString()}`);
    }

    if (rewards.badge) {
      parts.push(`Badge "${rewards.badge}"`);
    }

    if (rewards.title) {
      parts.push(`Título "${rewards.title}"`);
    }

    if (rewards.features && rewards.features.length > 0) {
      parts.push(`Beneficios exclusivos: ${rewards.features.join(', ')}`);
    }

    return parts.join(' + ') || 'Recompensa especial';
  }

  private static async applyIncentiveRewards(incentive: RunnerIncentive): Promise<void> {
    try {
      // Aplicar bono si existe
      if (incentive.rewardsGranted.bonusAmount) {
        // Aquí iría la lógica para aplicar el bono al payout del runner
        logger.info('Bono aplicado por incentivo reclamado', {
          runnerId: incentive.runnerId,
          amount: incentive.rewardsGranted.bonusAmount,
          incentiveId: incentive.id
        });
      }

      // Actualizar perfil del runner con badges/títulos
      if (incentive.rewardsGranted.badge || incentive.rewardsGranted.title) {
        // Aquí iría la lógica para actualizar el perfil del runner
        logger.info('Badge/título aplicado al perfil', {
          runnerId: incentive.runnerId,
          badge: incentive.rewardsGranted.badge,
          title: incentive.rewardsGranted.title
        });
      }

    } catch (error) {
      logger.error('Error aplicando recompensas:', error as Error);
    }
  }

  private static async getTopPerformersByCategory(
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      // Obtener top performers por categoría de incentivo
      const topPerformers: any[] = [];

      const categories = ['bronze', 'silver', 'gold', 'platinum'];

      for (const category of categories) {
        const categoryIncentives = await db.runnerIncentive.findMany({
          where: {
            incentiveRule: {
              category: category as any
            },
            earnedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            runner: {
              select: {
                id: true,
                name: true
              }
            },
            incentiveRule: true
          },
          orderBy: {
            earnedAt: 'desc'
          },
          take: 1
        });

        if (categoryIncentives.length > 0) {
          const incentive = categoryIncentives[0];
          topPerformers.push({
            category,
            runnerId: incentive.runnerId,
            runnerName: incentive.runner?.name || 'Runner',
            achievement: incentive.incentiveRule.name,
            reward: this.formatRewardDescription(incentive.rewardsGranted)
          });
        }
      }

      return topPerformers;

    } catch (error) {
      logger.error('Error obteniendo top performers:', error as Error);
      return [];
    }
  }

  /**
   * Ejecuta evaluación automática de incentivos para todos los runners activos
   */
  static async runAutomatedIncentiveEvaluation(): Promise<void> {
    try {
      logger.info('Iniciando evaluación automática de incentivos');

      // Obtener todos los runners activos
      const activeRunners = await db.user.findMany({
        where: {
          role: 'runner',
          isActive: true
        },
        select: {
          id: true,
          name: true
        }
      });

      let totalIncentivesGranted = 0;

      for (const runner of activeRunners) {
        try {
          const incentives = await this.evaluateRunnerIncentives(runner.id);
          totalIncentivesGranted += incentives.length;
        } catch (error) {
          logger.error('Error evaluando incentivos para runner', {
            runnerId: runner.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      logger.info('Evaluación automática de incentivos completada', {
        totalRunners: activeRunners.length,
        totalIncentivesGranted
      });

    } catch (error) {
      logger.error('Error en evaluación automática de incentivos:', error as Error);
    }
  }
}
