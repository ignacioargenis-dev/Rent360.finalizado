import { logger } from './logger';
import { db } from './db';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'threshold' | 'pattern' | 'predictive' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldown: number; // minutos
  lastTriggered?: Date;
  tags: string[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte' | 'contains' | 'regex';
  value: any;
  timeWindow?: number; // minutos
}

export interface AlertAction {
  type: 'email' | 'sms' | 'notification' | 'webhook' | 'log';
  target: string;
  template: string;
  enabled: boolean;
}

export interface AlertInstance {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  triggeredAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  data: Record<string, any>;
  tags: string[];
}

class AlertSystem {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, AlertInstance> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Reglas de sistema críticas
    this.addRule({
      id: 'system-high-memory',
      name: 'Uso de Memoria Alto',
      description: 'Alerta cuando el uso de memoria supera el 80%',
      type: 'threshold',
      severity: 'high',
      enabled: true,
      conditions: [{
        metric: 'system.memory.usage',
        operator: 'gt',
        value: 80,
      }],
      actions: [
        {
          type: 'notification',
          target: 'admin',
          template: 'La memoria del sistema está en {{value}}%',
          enabled: true,
        },
        {
          type: 'email',
          target: 'admin@rent360.com',
          template: 'ALERTA: Memoria del sistema crítica ({{value}}%)',
          enabled: true,
        }
      ],
      cooldown: 30,
      tags: ['system', 'memory', 'performance'],
    });

    // Reglas de negocio
    this.addRule({
      id: 'payments-overdue',
      name: 'Pagos Vencidos',
      description: 'Alerta cuando hay más de 10 pagos vencidos',
      type: 'threshold',
      severity: 'medium',
      enabled: true,
      conditions: [{
        metric: 'business.payments.overdue',
        operator: 'gt',
        value: 10,
      }],
      actions: [
        {
          type: 'notification',
          target: 'admin',
          template: '{{value}} pagos están vencidos',
          enabled: true,
        }
      ],
      cooldown: 60,
      tags: ['business', 'payments', 'overdue'],
    });

    // Reglas de seguridad
    this.addRule({
      id: 'failed-logins',
      name: 'Intentos de Login Fallidos',
      description: 'Alerta cuando hay más de 5 intentos de login fallidos por minuto',
      type: 'threshold',
      severity: 'high',
      enabled: true,
      conditions: [{
        metric: 'security.failed-logins',
        operator: 'gt',
        value: 5,
        timeWindow: 1,
      }],
      actions: [
        {
          type: 'notification',
          target: 'admin',
          template: 'Posible ataque de fuerza bruta detectado',
          enabled: true,
        },
        {
          type: 'log',
          target: 'security',
          template: 'Failed login attempts: {{value}}',
          enabled: true,
        }
      ],
      cooldown: 5,
      tags: ['security', 'authentication', 'attack'],
    });

    // Reglas de contratos
    this.addRule({
      id: 'contracts-expiring',
      name: 'Contratos por Vencer',
      description: 'Alerta cuando hay contratos que vencen en menos de 30 días',
      type: 'threshold',
      severity: 'medium',
      enabled: true,
      conditions: [{
        metric: 'business.contracts.expiring-30-days',
        operator: 'gt',
        value: 0,
      }],
      actions: [
        {
          type: 'notification',
          target: 'admin',
          template: '{{value}} contratos vencen en menos de 30 días',
          enabled: true,
        },
        {
          type: 'email',
          target: 'admin@rent360.com',
          template: 'Recordatorio: {{value}} contratos requieren renovación',
          enabled: true,
        }
      ],
      cooldown: 1440, // 24 horas
      tags: ['business', 'contracts', 'renewal'],
    });

    // Reglas de performance
    this.addRule({
      id: 'api-response-time',
      name: 'Tiempo de Respuesta API Alto',
      description: 'Alerta cuando el tiempo promedio de respuesta supera 2 segundos',
      type: 'threshold',
      severity: 'medium',
      enabled: true,
      conditions: [{
        metric: 'performance.api.response-time',
        operator: 'gt',
        value: 2000,
      }],
      actions: [
        {
          type: 'notification',
          target: 'admin',
          template: 'Tiempo de respuesta API: {{value}}ms',
          enabled: true,
        }
      ],
      cooldown: 15,
      tags: ['performance', 'api', 'response-time'],
    });

    logger.info('Alert system initialized with default rules', {
      context: 'alerts.init',
      ruleCount: this.rules.size,
    });
  }

  public addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info('Alert rule added', {
      context: 'alerts.rule-added',
      ruleId: rule.id,
      ruleName: rule.name,
    });
  }

  public removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      logger.info('Alert rule removed', {
        context: 'alerts.rule-removed',
        ruleId,
      });
    }
    return removed;
  }

  public getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  public getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  public enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      logger.info('Alert rule enabled', {
        context: 'alerts.rule-enabled',
        ruleId,
      });
      return true;
    }
    return false;
  }

  public disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      logger.info('Alert rule disabled', {
        context: 'alerts.rule-disabled',
        ruleId,
      });
      return true;
    }
    return false;
  }

  public async checkMetrics(metrics: Record<string, any>): Promise<void> {
    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      // Verificar cooldown
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldown * 60 * 1000) {
          continue;
        }
      }

      // Evaluar condiciones
      if (this.evaluateConditions(rule.conditions, metrics)) {
        await this.triggerAlert(rule, metrics);
      }
    }
  }

  private evaluateConditions(conditions: AlertCondition[], metrics: Record<string, any>): boolean {
    return conditions.every(condition => {
      const metricValue = this.getNestedValue(metrics, condition.metric);

      if (metricValue === undefined) {
        return false;
      }

      switch (condition.operator) {
        case 'gt':
          return metricValue > condition.value;
        case 'lt':
          return metricValue < condition.value;
        case 'eq':
          return metricValue === condition.value;
        case 'ne':
          return metricValue !== condition.value;
        case 'gte':
          return metricValue >= condition.value;
        case 'lte':
          return metricValue <= condition.value;
        case 'contains':
          return String(metricValue).includes(String(condition.value));
        case 'regex':
          return new RegExp(condition.value).test(String(metricValue));
        default:
          return false;
      }
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async triggerAlert(rule: AlertRule, metrics: Record<string, any>): Promise<void> {
    const alertId = `${rule.id}_${Date.now()}`;

    const alert: AlertInstance = {
      id: alertId,
      ruleId: rule.id,
      title: rule.name,
      message: this.interpolateTemplate(rule.name, metrics),
      severity: rule.severity,
      status: 'active',
      triggeredAt: new Date(),
      data: metrics,
      tags: rule.tags,
    };

    this.activeAlerts.set(alertId, alert);
    rule.lastTriggered = new Date();

    // Ejecutar acciones
    await this.executeActions(rule.actions, alert, metrics);

    logger.warn('Alert triggered', {
      context: 'alerts.triggered',
      alertId,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      metrics: JSON.stringify(metrics),
    });
  }

  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return this.getNestedValue(data, key) || match;
    });
  }

  private async executeActions(actions: AlertAction[], alert: AlertInstance, metrics: Record<string, any>): Promise<void> {
    for (const action of actions) {
      if (!action.enabled) continue;

      try {
        switch (action.type) {
          case 'notification':
            await this.sendNotification(action, alert);
            break;
          case 'email':
            await this.sendEmail(action, alert);
            break;
          case 'sms':
            await this.sendSMS(action, alert);
            break;
          case 'webhook':
            await this.sendWebhook(action, alert);
            break;
          case 'log':
            this.logAlert(action, alert);
            break;
        }
      } catch (error) {
        logger.error('Error executing alert action', {
          context: 'alerts.action-error',
          alertId: alert.id,
          actionType: action.type,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private async sendNotification(action: AlertAction, alert: AlertInstance): Promise<void> {
    // Crear notificación en la base de datos
    await db.notification.create({
      data: {
        userId: action.target === 'admin' ? 'admin-user-id' : action.target,
        type: 'system_alert',
        title: alert.title,
        message: alert.message,
        data: JSON.stringify({ alertId: alert.id, severity: alert.severity }),
        createdAt: new Date(),
      },
    });

    logger.info('Notification sent', {
      context: 'alerts.notification-sent',
      alertId: alert.id,
      target: action.target,
    });
  }

  private async sendEmail(action: AlertAction, alert: AlertInstance): Promise<void> {
    // Aquí iría la lógica para enviar email
    // Por ahora solo loggear
    logger.info('Email alert sent', {
      context: 'alerts.email-sent',
      alertId: alert.id,
      target: action.target,
      subject: alert.title,
      message: alert.message,
    });
  }

  private async sendSMS(action: AlertAction, alert: AlertInstance): Promise<void> {
    // Aquí iría la lógica para enviar SMS
    logger.info('SMS alert sent', {
      context: 'alerts.sms-sent',
      alertId: alert.id,
      target: action.target,
      message: alert.message,
    });
  }

  private async sendWebhook(action: AlertAction, alert: AlertInstance): Promise<void> {
    try {
      await fetch(action.target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: alert,
          timestamp: new Date().toISOString(),
        }),
      });

      logger.info('Webhook alert sent', {
        context: 'alerts.webhook-sent',
        alertId: alert.id,
        target: action.target,
      });
    } catch (error) {
      logger.error('Webhook alert failed', {
        context: 'alerts.webhook-error',
        alertId: alert.id,
        target: action.target,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private logAlert(action: AlertAction, alert: AlertInstance): void {
    logger.error('Security Alert', {
      context: `alerts.${action.target}`,
      alertId: alert.id,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      data: alert.data,
    });
  }

  public acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = userId;

      logger.info('Alert acknowledged', {
        context: 'alerts.acknowledged',
        alertId,
        userId,
      });

      return true;
    }
    return false;
  }

  public resolveAlert(alertId: string, userId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert && alert.status !== 'resolved') {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();

      logger.info('Alert resolved', {
        context: 'alerts.resolved',
        alertId,
        userId,
      });

      return true;
    }
    return false;
  }

  public getActiveAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values()).filter(
      alert => alert.status === 'active'
    );
  }

  public getAllAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values());
  }

  public getAlert(alertId: string): AlertInstance | undefined {
    return this.activeAlerts.get(alertId);
  }

  // Integración con el sistema de monitoreo
  public async checkBusinessMetrics(): Promise<void> {
    try {
      // Obtener métricas de negocio
      const [
        overduePayments,
        expiringContracts,
        activeUsers,
        failedPayments,
      ] = await Promise.all([
        // Pagos vencidos
        db.payment.count({
          where: {
            status: 'PENDING',
            dueDate: { lt: new Date() },
          },
        }),

        // Contratos que expiran en 30 días
        db.contract.count({
          where: {
            status: 'ACTIVE',
            endDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Usuarios activos
        db.user.count({
          where: { isActive: true },
        }),

        // Pagos fallidos en las últimas 24 horas
        db.payment.count({
          where: {
            status: 'FAILED',
            updatedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const businessMetrics = {
        'business.payments.overdue': overduePayments,
        'business.contracts.expiring-30-days': expiringContracts,
        'business.users.active': activeUsers,
        'business.payments.failed-24h': failedPayments,
      };

      await this.checkMetrics(businessMetrics);

    } catch (error) {
      logger.error('Error checking business metrics', {
        context: 'alerts.business-metrics-error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Método para iniciar el sistema de alertas
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    // Verificar métricas cada 5 minutos
    setInterval(async () => {
      await this.checkBusinessMetrics();
    }, 5 * 60 * 1000);

    logger.info('Alert system started', {
      context: 'alerts.started',
      activeRules: this.rules.size,
    });
  }

  // Método para detener el sistema de alertas
  public stop(): void {
    this.isRunning = false;
    logger.info('Alert system stopped', {
      context: 'alerts.stopped',
    });
  }

  // Método para limpiar alertas antiguas
  public cleanup(): void {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 días

    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.triggeredAt < cutoffDate && alert.status === 'resolved') {
        this.activeAlerts.delete(alertId);
      }
    }

    logger.info('Alert cleanup completed', {
      context: 'alerts.cleanup',
      remainingAlerts: this.activeAlerts.size,
    });
  }
}

// Instancia singleton
export const alertSystem = new AlertSystem();

// Iniciar el sistema de alertas automáticamente
alertSystem.start();

// Funciones de conveniencia
export const addAlertRule = (rule: AlertRule) => alertSystem.addRule(rule);
export const removeAlertRule = (ruleId: string) => alertSystem.removeRule(ruleId);
export const getAlertRules = () => alertSystem.getAllRules();
export const acknowledgeAlert = (alertId: string, userId: string) => alertSystem.acknowledgeAlert(alertId, userId);
export const resolveAlert = (alertId: string, userId: string) => alertSystem.resolveAlert(alertId, userId);
export const getActiveAlerts = () => alertSystem.getActiveAlerts();
