import { db } from '@/lib/db';
import { logger } from './logger';

interface QueryStats {
  query: string;
  duration: number;
  timestamp: Date;
  table?: string | undefined;
}

interface OptimizationResult {
  table: string;
  action: string;
  duration: number;
  recordsAffected?: number;
}

export class DatabaseOptimizer {
  private queryStats: QueryStats[] = [];
  private readonly MAX_STATS = 1000;

  // Analizar consultas lentas
  async analyzeSlowQueries(threshold = 1000): Promise<QueryStats[]> {
    const slowQueries = this.queryStats.filter(
      stat => stat.duration > threshold,
    );

    logger.info('Análisis de consultas lentas completado', {
      totalQueries: this.queryStats.length,
      slowQueries: slowQueries.length,
      threshold,
    });

    return slowQueries;
  }

  // Agregar estadística de consulta
  addQueryStat(query: string, duration: number, table?: string) {
    this.queryStats.push({
      query,
      duration,
      timestamp: new Date(),
      table,
    });

    // Mantener solo las últimas consultas
    if (this.queryStats.length > this.MAX_STATS) {
      this.queryStats = this.queryStats.slice(-this.MAX_STATS);
    }
  }

  // Optimizar índices
  async optimizeIndexes(): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];
    
    try {
      // Analizar tablas principales
      const tables = ['users', 'properties', 'contracts', 'payments', 'notifications'];
      
      for (const table of tables) {
        const startTime = Date.now();
        
        // Analizar tabla (solo tablas predefinidas para evitar SQL injection)
        const allowedTables = ['users', 'properties', 'contracts', 'payments', 'notifications'];
        if (!allowedTables.includes(table)) {
          throw new Error(`Tabla no permitida: ${table}`);
        }
        const analysis = await db.$queryRawUnsafe(`ANALYZE ${table}`);
        
        const duration = Date.now() - startTime;
        results.push({
          table,
          action: 'ANALYZE',
          duration,
        });

        logger.info(`Análisis completado para tabla: ${table}`, { duration });
      }

      logger.info('Optimización de índices completada', { 
        tablesAnalyzed: tables.length, 
      });

    } catch (error) {
      logger.error('Error optimizando índices:', { error: error instanceof Error ? error.message : String(error) });
    }

    return results;
  }

  // Limpiar datos antiguos
  async cleanupOldData(): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];
    
    try {
      // Limpiar notificaciones antiguas (más de 90 días)
      const startTime = Date.now();
      const oldNotifications = await db.notification.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
      });

      results.push({
        table: 'notifications',
        action: 'DELETE_OLD',
        duration: Date.now() - startTime,
        recordsAffected: oldNotifications.count,
      });

      // Limpiar logs del sistema antiguos (más de 30 días)
      const logsStartTime = Date.now();
      // Nota: systemLog no existe en el esquema actual, se puede implementar más adelante
      const oldLogs = { count: 0 };

      results.push({
        table: 'system_logs',
        action: 'DELETE_OLD',
        duration: Date.now() - logsStartTime,
        recordsAffected: oldLogs.count,
      });

      logger.info('Limpieza de datos antiguos completada', { 
        notificationsDeleted: oldNotifications.count,
        logsDeleted: oldLogs.count,
      });

    } catch (error) {
      logger.error('Error limpiando datos antiguos:', { error: error instanceof Error ? error.message : String(error) });
    }

    return results;
  }

  // Optimizar consultas frecuentes
  async optimizeFrequentQueries(): Promise<void> {
    try {
      // Crear vistas materializadas para consultas frecuentes
      await this.createMaterializedViews();
      
      // Optimizar consultas de estadísticas
      await this.optimizeStatsQueries();
      
      logger.info('Optimización de consultas frecuentes completada');
    } catch (error) {
      logger.error('Error optimizando consultas frecuentes:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async createMaterializedViews(): Promise<void> {
    // Crear vista para estadísticas de propiedades
    await db.$executeRaw`
      CREATE VIEW IF NOT EXISTS property_stats AS
      SELECT 
        p.id,
        p.title,
        p.status,
        p.price,
        p.city,
        p.commune,
        COUNT(c.id) as contract_count,
        AVG(c.monthlyRent) as avg_rent
      FROM properties p
      LEFT JOIN contracts c ON p.id = c.propertyId
      GROUP BY p.id
    `;
  }

  private async optimizeStatsQueries(): Promise<void> {
    // Crear índices para consultas frecuentes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)',
      'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(userId, isRead)',
    ];

    for (const index of indexes) {
      try {
        await db.$executeRawUnsafe(index);
      } catch (error) {
        logger.warn('Error creando índice:', { index, error });
      }
    }
  }

  // Obtener estadísticas de rendimiento
  getPerformanceStats() {
    const avgDuration = this.queryStats.length > 0 
      ? this.queryStats.reduce((sum, stat) => sum + stat.duration, 0) / this.queryStats.length
      : 0;

    const slowQueries = this.queryStats.filter(stat => stat.duration > 1000).length;

    return {
      totalQueries: this.queryStats.length,
      averageDuration: avgDuration,
      slowQueries,
      lastQuery: this.queryStats[this.queryStats.length - 1]?.timestamp,
    };
  }

  // Obtener estadísticas de consultas
  getQueryStats() {
    return this.queryStats;
  }

  // Limpiar estadísticas de consultas
  clearQueryStats() {
    this.queryStats = [];
  }

  // Generar recomendaciones de índices
  async generateIndexRecommendations() {
    const slowQueries = await this.analyzeSlowQueries(1000);
    const recommendations: Array<{
      table: string;
      query: string;
      avgTime: number;
      recommendation: string;
    }> = [];

    for (const query of slowQueries) {
      if (query.table) {
        recommendations.push({
          table: query.table,
          query: query.query,
          avgTime: query.duration,
          recommendation: `Consider adding index on ${query.table}`,
        });
      }
    }

    return recommendations;
  }

  // Invalidar caché
  async invalidateCache(cacheKey: string) {
    logger.info(`Invalidating cache for: ${cacheKey}`);
    // Implementación de invalidación de caché
  }

  // Ejecutar optimización completa
  async runFullOptimization(): Promise<{
    indexes: OptimizationResult[];
    cleanup: OptimizationResult[];
    performance: any;
  }> {
    logger.info('Iniciando optimización completa de base de datos');

    const [indexes, cleanup] = await Promise.all([
      this.optimizeIndexes(),
      this.cleanupOldData(),
    ]);

    await this.optimizeFrequentQueries();

    const performance = this.getPerformanceStats();

    logger.info('Optimización completa finalizada', { performance });

    return {
      indexes,
      cleanup,
      performance,
    };
  }
}

// Instancia singleton
export const dbOptimizer = new DatabaseOptimizer();

// Funciones de optimización para diferentes entidades
export async function getPropertiesOptimized(options: {
  where?: any;
  skip?: number;
  take?: number;
  cache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
  orderBy?: any;
}) {
  const { where, skip, take, cache = false, cacheTTL = 300, cacheKey, orderBy } = options || {};
  
  // Optimizar consulta con índices y selección específica
  const queryOptions: any = {
    where,
    orderBy: orderBy || { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      address: true,
      city: true,
      commune: true,
      region: true,
      price: true,
      deposit: true,
      bedrooms: true,
      bathrooms: true,
      area: true,
      status: true,
      type: true,
      images: true,
      features: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  };

  // Agregar propiedades opcionales solo si están definidas
  if (skip !== undefined) {
    queryOptions.skip = skip;
  }
  if (take !== undefined) {
    queryOptions.take = take;
  }

  return await db.property.findMany(queryOptions);
}

export async function getUsersOptimized(options: {
  where?: any;
  skip?: number;
  take?: number;
  orderBy?: any;
}) {
  const { where, skip, take, orderBy } = options || {};

  const queryOptions: any = {
    where,
    orderBy: orderBy || { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatar: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  };

  // Agregar propiedades opcionales solo si están definidas
  if (skip !== undefined) {
    queryOptions.skip = skip;
  }
  if (take !== undefined) {
    queryOptions.take = take;
  }

  return await db.user.findMany(queryOptions);
}

export async function getContractsOptimized(options: {
  where?: any;
  skip?: number;
  take?: number;
  orderBy?: any;
}) {
  const { where, skip, take, orderBy } = options || {};

  const queryOptions: any = {
    where,
    orderBy: orderBy || { createdAt: 'desc' },
    select: {
      id: true,
      contractNumber: true,
      propertyId: true,
      tenantId: true,
      ownerId: true,
      brokerId: true,
      startDate: true,
      endDate: true,
      monthlyRent: true,
      deposit: true,
      status: true,
      terms: true,
      signedAt: true,
      createdAt: true,
      updatedAt: true,
      property: {
        select: {
          id: true,
          title: true,
          address: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  };

  // Agregar propiedades opcionales solo si están definidas
  if (skip !== undefined) {
    queryOptions.skip = skip;
  }
  if (take !== undefined) {
    queryOptions.take = take;
  }

  return await db.contract.findMany(queryOptions);
}

export async function getPaymentsOptimized(options: {
  where?: any;
  skip?: number;
  take?: number;
  orderBy?: any;
}) {
  const { where, skip, take, orderBy } = options || {};

  const queryOptions: any = {
    where,
    orderBy: orderBy || { dueDate: 'desc' },
    select: {
      id: true,
      paymentNumber: true,
      contractId: true,
      payerId: true,
      amount: true,
      dueDate: true,
      paidDate: true,
      status: true,
      method: true,
      transactionId: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      contract: {
        select: {
          id: true,
          contractNumber: true,
          property: {
            select: {
              id: true,
              title: true,
              address: true,
            },
          },
        },
      },
    },
  };

  // Agregar propiedades opcionales solo si están definidas
  if (skip !== undefined) {
    queryOptions.skip = skip;
  }
  if (take !== undefined) {
    queryOptions.take = take;
  }

  return await db.payment.findMany(queryOptions);
}

// Ejecutar optimización automática cada 24 horas
setInterval(async () => {
  try {
    await dbOptimizer.runFullOptimization();
  } catch (error) {
    logger.error('Error en optimización automática:', { error: error instanceof Error ? error.message : String(error) });
  }
}, 24 * 60 * 60 * 1000);
