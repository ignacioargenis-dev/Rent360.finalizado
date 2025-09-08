import { AlertSystem, AlertInstance, AlertAction } from '../alert-system';

describe('Alert System', () => {
  let alertSystem: AlertSystem;

  beforeEach(() => {
    alertSystem = new AlertSystem();
    jest.clearAllMocks();
  });

  describe('createAlert', () => {
    it('should create alerts with correct structure', () => {
      const alertData = {
        title: 'Test Alert',
        message: 'This is a test alert',
        severity: 'high' as const,
        type: 'SYSTEM_ERROR' as const,
        source: 'test-component'
      };

      const alert = alertSystem.createAlert(alertData);

      expect(alert).toMatchObject({
        id: expect.any(String),
        title: alertData.title,
        message: alertData.message,
        severity: alertData.severity,
        type: alertData.type,
        source: alertData.source,
        status: 'active',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    it('should use default severity when not provided', () => {
      const alertData = {
        title: 'Default Alert',
        message: 'Default severity test',
        type: 'INFO' as const
      };

      const alert = alertSystem.createAlert(alertData);
      expect(alert.severity).toBe('medium');
    });
  });

  describe('addAction', () => {
    it('should add actions to alerts', () => {
      const alert = alertSystem.createAlert({
        title: 'Action Test',
        message: 'Testing actions',
        type: 'WARNING' as const
      });

      const action: AlertAction = {
        type: 'email',
        target: 'admin@example.com',
        message: 'Custom action message'
      };

      alertSystem.addAction(alert.id, action);

      const actions = alertSystem.getActions(alert.id);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject(action);
    });

    it('should handle multiple actions', () => {
      const alert = alertSystem.createAlert({
        title: 'Multi Action Test',
        message: 'Testing multiple actions',
        type: 'ERROR' as const
      });

      const action1: AlertAction = {
        type: 'email',
        target: 'admin@example.com'
      };

      const action2: AlertAction = {
        type: 'slack',
        target: '#alerts',
        message: 'Slack notification'
      };

      alertSystem.addAction(alert.id, action1);
      alertSystem.addAction(alert.id, action2);

      const actions = alertSystem.getActions(alert.id);
      expect(actions).toHaveLength(2);
    });
  });

  describe('resolveAlert', () => {
    it('should resolve active alerts', () => {
      const alert = alertSystem.createAlert({
        title: 'Resolve Test',
        message: 'Testing resolution',
        type: 'WARNING' as const
      });

      expect(alert.status).toBe('active');

      alertSystem.resolveAlert(alert.id, 'Test resolution');

      const updatedAlert = alertSystem.getAlert(alert.id);
      expect(updatedAlert?.status).toBe('resolved');
      expect(updatedAlert?.resolution).toBe('Test resolution');
      expect(updatedAlert?.resolvedAt).toBeDefined();
    });

    it('should not resolve already resolved alerts', () => {
      const alert = alertSystem.createAlert({
        title: 'Already Resolved',
        message: 'Should not resolve again',
        type: 'INFO' as const
      });

      alertSystem.resolveAlert(alert.id, 'First resolution');

      // Intentar resolver nuevamente
      alertSystem.resolveAlert(alert.id, 'Second resolution');

      const updatedAlert = alertSystem.getAlert(alert.id);
      expect(updatedAlert?.resolution).toBe('First resolution');
    });
  });

  describe('getAlerts', () => {
    it('should filter alerts by status', () => {
      const alert1 = alertSystem.createAlert({
        title: 'Active Alert',
        message: 'Active',
        type: 'WARNING' as const
      });

      const alert2 = alertSystem.createAlert({
        title: 'Resolved Alert',
        message: 'Resolved',
        type: 'ERROR' as const
      });

      alertSystem.resolveAlert(alert2.id, 'Resolved');

      const activeAlerts = alertSystem.getAlerts({ status: 'active' });
      const resolvedAlerts = alertSystem.getAlerts({ status: 'resolved' });

      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].id).toBe(alert1.id);
      expect(resolvedAlerts).toHaveLength(1);
      expect(resolvedAlerts[0].id).toBe(alert2.id);
    });

    it('should filter alerts by severity', () => {
      alertSystem.createAlert({
        title: 'High Severity',
        message: 'High',
        severity: 'high',
        type: 'ERROR' as const
      });

      alertSystem.createAlert({
        title: 'Low Severity',
        message: 'Low',
        severity: 'low',
        type: 'INFO' as const
      });

      const highAlerts = alertSystem.getAlerts({ severity: 'high' });
      const lowAlerts = alertSystem.getAlerts({ severity: 'low' });

      expect(highAlerts).toHaveLength(1);
      expect(lowAlerts).toHaveLength(1);
    });

    it('should filter alerts by type', () => {
      alertSystem.createAlert({
        title: 'Error Alert',
        message: 'Error',
        type: 'ERROR' as const
      });

      alertSystem.createAlert({
        title: 'Warning Alert',
        message: 'Warning',
        type: 'WARNING' as const
      });

      const errorAlerts = alertSystem.getAlerts({ type: 'ERROR' });
      const warningAlerts = alertSystem.getAlerts({ type: 'WARNING' });

      expect(errorAlerts).toHaveLength(1);
      expect(warningAlerts).toHaveLength(1);
    });

    it('should limit results', () => {
      // Crear múltiples alertas
      for (let i = 0; i < 5; i++) {
        alertSystem.createAlert({
          title: `Alert ${i}`,
          message: `Message ${i}`,
          type: 'INFO' as const
        });
      }

      const limitedResults = alertSystem.getAlerts({}, 3);
      expect(limitedResults).toHaveLength(3);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      alertSystem.createAlert({
        title: 'High Error',
        message: 'High',
        severity: 'high',
        type: 'ERROR' as const
      });

      alertSystem.createAlert({
        title: 'Medium Warning',
        message: 'Medium',
        severity: 'medium',
        type: 'WARNING' as const
      });

      alertSystem.createAlert({
        title: 'Low Info',
        message: 'Low',
        severity: 'low',
        type: 'INFO' as const
      });

      const stats = alertSystem.getStats();

      expect(stats).toEqual({
        total: 3,
        active: 3,
        resolved: 0,
        bySeverity: {
          high: 1,
          medium: 1,
          low: 1
        },
        byType: {
          ERROR: 1,
          WARNING: 1,
          INFO: 1
        }
      });
    });

    it('should update stats when alerts are resolved', () => {
      const alert = alertSystem.createAlert({
        title: 'To Resolve',
        message: 'Will be resolved',
        type: 'WARNING' as const
      });

      alertSystem.resolveAlert(alert.id, 'Resolved');

      const stats = alertSystem.getStats();
      expect(stats.active).toBe(0);
      expect(stats.resolved).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should remove old resolved alerts', () => {
      const oldAlert = alertSystem.createAlert({
        title: 'Old Alert',
        message: 'Old',
        type: 'INFO' as const
      });

      // Simular alerta antigua
      (oldAlert as any).resolvedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 días atrás
      alertSystem.resolveAlert(oldAlert.id, 'Old resolution');

      const newAlert = alertSystem.createAlert({
        title: 'New Alert',
        message: 'New',
        type: 'WARNING' as const
      });

      alertSystem.cleanup(7); // Limpiar alertas resueltas hace más de 7 días

      expect(alertSystem.getAlert(oldAlert.id)).toBeUndefined();
      expect(alertSystem.getAlert(newAlert.id)).toBeDefined();
    });
  });

  describe('priority handling', () => {
    it('should prioritize high severity alerts', () => {
      alertSystem.createAlert({
        title: 'Low Priority',
        message: 'Low',
        severity: 'low',
        type: 'INFO' as const
      });

      alertSystem.createAlert({
        title: 'High Priority',
        message: 'High',
        severity: 'high',
        type: 'ERROR' as const
      });

      const alerts = alertSystem.getAlerts({}, 10, 'severity');

      // La alerta de alta severidad debería aparecer primero
      expect(alerts[0].severity).toBe('high');
      expect(alerts[1].severity).toBe('low');
    });
  });
});
