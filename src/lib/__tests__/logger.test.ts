import { logger } from '../logger';
import { MonitoringEvent } from '../types';

describe('Logger System', () => {
  beforeEach(() => {
    // Limpiar eventos antes de cada test
    (logger as any).events = [];
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      const context = 'test.context';

      logger.info(message, { context });

      // Verificar que se agregó al array de eventos
      expect((logger as any).events).toHaveLength(1);
      expect((logger as any).events[0]).toMatchObject({
        type: 'INFO',
        message,
        severity: 'low'
      });
    });

    it('should log error messages with high severity', () => {
      const error = new Error('Test error');
      const context = 'test.error';

      logger.error('Error occurred', { context, error });

      expect((logger as any).events).toHaveLength(1);
      expect((logger as any).events[0]).toMatchObject({
        type: 'ERROR',
        severity: 'high'
      });
    });

    it('should log warning messages with medium severity', () => {
      const message = 'Test warning';
      const context = 'test.warning';

      logger.warn(message, { context });

      expect((logger as any).events).toHaveLength(1);
      expect((logger as any).events[0]).toMatchObject({
        type: 'WARNING',
        severity: 'medium'
      });
    });
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = (logger as any).generateRequestId();
      const id2 = (logger as any).generateRequestId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });

  describe('addMonitoringEvent', () => {
    it('should add monitoring events', async () => {
      const event: Omit<MonitoringEvent, 'id' | 'timestamp'> = {
        type: 'SYSTEM_CHECK',
        message: 'System health check',
        severity: 'medium',
        metadata: { uptime: '99.9%' }
      };

      await (logger as any).addMonitoringEvent(
        event.type,
        event.message,
        event.severity,
        event.metadata
      );

      expect((logger as any).events).toHaveLength(1);
      expect((logger as any).events[0]).toMatchObject({
        ...event,
        id: expect.any(String),
        timestamp: expect.any(Date)
      });
    });

    it('should use default severity when not provided', async () => {
      await (logger as any).addMonitoringEvent(
        'TEST_EVENT',
        'Test message'
      );

      expect((logger as any).events[0].severity).toBe('medium');
    });
  });

  describe('getStats', () => {
    it('should return logger statistics', () => {
      // Agregar algunos eventos de prueba
      (logger as any).events = [
        { type: 'INFO', severity: 'low', timestamp: new Date() },
        { type: 'ERROR', severity: 'high', timestamp: new Date() },
        { type: 'WARNING', severity: 'medium', timestamp: new Date() }
      ];

      const stats = (logger as any).getStats();

      expect(stats).toEqual({
        totalEvents: 3,
        eventsByType: {
          INFO: 1,
          ERROR: 1,
          WARNING: 1
        },
        eventsBySeverity: {
          low: 1,
          high: 1,
          medium: 1
        }
      });
    });
  });

  describe('performance logging', () => {
    it('should log API performance', () => {
      const mockReq = {
        method: 'GET',
        url: '/api/test',
        headers: { 'user-agent': 'test' }
      };
      const mockRes = {
        statusCode: 200,
        getHeader: jest.fn()
      };

      // Simular logging de performance
      const startTime = Date.now() - 100; // 100ms ago
      (logger as any).logApiPerformance(mockReq as any, mockRes as any, startTime);

      expect((logger as any).events).toHaveLength(1);
      expect((logger as any).events[0].type).toBe('API_PERFORMANCE');
    });

    it('should log slow queries', () => {
      const slowQuery = 'SELECT * FROM large_table';
      const duration = 1500; // 1.5 seconds

      (logger as any).logSlowQuery(slowQuery, duration);

      expect((logger as any).events).toHaveLength(1);
      expect((logger as any).events[0].type).toBe('SLOW_QUERY');
      expect((logger as any).events[0].message).toContain('1500ms');
    });
  });
});
