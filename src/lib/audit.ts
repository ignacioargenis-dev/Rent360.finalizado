// Sistema de Auditoría - Rent360
// Servicio centralizado para registro y consulta de logs de auditoría

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface AuditLogData {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  /**
   * Registra un evento de auditoría
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          ...(data.userId && { userId: data.userId }),
          action: data.action,
          entityType: data.entityType,
          ...(data.entityId && { entityId: data.entityId }),
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          ...(data.ipAddress && { ipAddress: data.ipAddress }),
          ...(data.userAgent && { userAgent: data.userAgent }),
        }
      });

      logger.info('Audit log created', {
        action: data.action,
        entityType: data.entityType,
        userId: data.userId,
        entityId: data.entityId
      });
    } catch (error) {
      logger.error('Error creating audit log:', { error, data });
      // No lanzamos error para no interrumpir el flujo principal
    }
  }

  /**
   * Registra login de usuario
   */
  static async logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: 'login',
      entityType: 'user',
      entityId: userId,
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent }),
      metadata: { event: 'successful_login' }
    });
  }

  /**
   * Registra logout de usuario
   */
  static async logLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: 'logout',
      entityType: 'user',
      entityId: userId,
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent }),
      metadata: { event: 'logout' }
    });
  }

  /**
   * Registra creación de entidad
   */
  static async logCreate(
    userId: string,
    entityType: string,
    entityId: string,
    newValues: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'create',
      entityType,
      entityId,
      newValues,
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent })
    });
  }

  /**
   * Registra actualización de entidad
   */
  static async logUpdate(
    userId: string,
    entityType: string,
    entityId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'update',
      entityType,
      entityId,
      oldValues,
      newValues,
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent })
    });
  }

  /**
   * Registra eliminación de entidad
   */
  static async logDelete(
    userId: string,
    entityType: string,
    entityId: string,
    oldValues: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'delete',
      entityType,
      entityId,
      oldValues,
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent })
    });
  }

  /**
   * Registra intento de acceso no autorizado
   */
  static async logUnauthorizedAccess(
    userId: string | null,
    action: string,
    entityType: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      ...(userId && { userId }),
      action: `unauthorized_${action}`,
      entityType,
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent }),
      metadata: { event: 'unauthorized_access' }
    });
  }

  /**
   * Registra cambio de contraseña
   */
  static async logPasswordChange(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'password_change',
      entityType: 'user',
      entityId: userId,
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent }),
      metadata: { event: 'password_changed' }
    });
  }

  /**
   * Consulta logs de auditoría con filtros
   */
  static async queryLogs(query: AuditQuery = {}): Promise<any[]> {
    try {
      const whereClause: any = {};

      if (query.userId) {
        whereClause.userId = query.userId;
      }

      if (query.action) {
        whereClause.action = query.action;
      }

      if (query.entityType) {
        whereClause.entityType = query.entityType;
      }

      if (query.entityId) {
        whereClause.entityId = query.entityId;
      }

      if (query.startDate || query.endDate) {
        whereClause.createdAt = {};
        if (query.startDate) {
          whereClause.createdAt.gte = query.startDate;
        }
        if (query.endDate) {
          whereClause.createdAt.lte = query.endDate;
        }
      }

      const logs = await db.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit || 50,
        skip: query.offset || 0
      });

      return logs.map(log => ({
        id: log.id,
        userId: log.userId,
        userName: log.user?.name || 'Unknown',
        userEmail: log.user?.email || '',
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
        newValues: log.newValues ? JSON.parse(log.newValues) : null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        timestamp: log.createdAt.toISOString()
      }));
    } catch (error) {
      logger.error('Error querying audit logs:', { error, query });
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  static async getAuditStats(timeframe: '24h' | '7d' | '30d' = '7d'): Promise<any> {
    try {
      const now = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      const [
        totalLogs,
        userActions,
        securityEvents,
        recentLogs
      ] = await Promise.all([
        db.auditLog.count({
          where: { createdAt: { gte: startDate } }
        }),
        db.auditLog.count({
          where: {
            createdAt: { gte: startDate },
            entityType: 'user'
          }
        }),
        db.auditLog.count({
          where: {
            createdAt: { gte: startDate },
            action: { contains: 'unauthorized' }
          }
        }),
        db.auditLog.findMany({
          where: { createdAt: { gte: startDate } },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      return {
        timeframe,
        totalLogs,
        userActions,
        securityEvents,
        recentLogs: recentLogs.map(log => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          userName: log.user?.name || 'System',
          timestamp: log.createdAt.toISOString()
        }))
      };
    } catch (error) {
      logger.error('Error getting audit stats:', { error, timeframe });
      throw error;
    }
  }
}

// Exportar instancia por defecto
export const auditService = AuditService;
