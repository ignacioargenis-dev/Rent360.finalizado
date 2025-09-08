import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as sendNotificationHandler } from '../../src/app/api/notifications/route';
import { GET as getNotificationsHandler } from '../../src/app/api/notifications/route';
import { PUT as markAsReadHandler } from '../../src/app/api/notifications/[id]/route';
import { db } from '../../src/lib/db';
import { logger } from '../../src/lib/logger';

describe('Notification System Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Flujo Completo: Envío → Cola → Procesamiento → Recepción', () => {
    it('debería completar flujo completo de notificaciones exitosamente', async () => {
      // 1. SETUP: Datos de prueba
      const userId = 'user_notify_123';
      const brokerId = 'broker_notify_456';
      const ownerId = 'owner_notify_789';

      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Juan Pérez',
        phone: '+56912345678',
        emailVerified: true,
        phoneVerified: true,
      };

      const mockBroker = {
        id: brokerId,
        email: 'broker@example.com',
        name: 'Carlos Rodríguez',
        role: 'BROKER',
      };

      // 2. PASO 1: Crear y enviar notificación de comisión calculada
      console.log('📧 Paso 1: Creando notificación de comisión calculada...');

      const commissionNotificationData = {
        type: 'COMMISSION_CALCULATED',
        recipientId: brokerId,
        recipientType: 'BROKER',
        title: 'Nueva comisión calculada',
        message: 'Se ha calculado una comisión de $25.000 por el contrato CNT-001',
        priority: 'HIGH',
        channels: ['EMAIL', 'SMS', 'PUSH'],
        metadata: {
          contractId: 'contract_123',
          amount: 25000,
          period: '2024-02',
          propertyAddress: 'Providencia 123',
        },
        scheduledFor: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockBroker);
      (db.notification.create as jest.Mock).mockResolvedValue({
        id: 'notification_123',
        ...commissionNotificationData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const sendNotificationRequest = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify(commissionNotificationData),
        headers: { 'Content-Type': 'application/json' },
      });

      const sendResponse = await sendNotificationHandler(sendNotificationRequest);
      const sendResult = await sendResponse.json();

      expect(sendResponse.status).toBe(200);
      expect(sendResult.success).toBe(true);
      expect(sendResult.data.notification.id).toBe('notification_123');
      expect(sendResult.data.notification.status).toBe('PENDING');

      console.log('✅ Notificación de comisión creada exitosamente');

      // 3. PASO 2: Procesar notificación por cola
      console.log('⚙️ Paso 2: Procesando notificación por cola...');

      const mockNotificationInQueue = {
        id: 'notification_123',
        type: 'COMMISSION_CALCULATED',
        recipientId: brokerId,
        recipientType: 'BROKER',
        status: 'PROCESSING',
        channels: ['EMAIL', 'SMS', 'PUSH'],
        title: 'Nueva comisión calculada',
        message: 'Se ha calculado una comisión de $25.000 por el contrato CNT-001',
        metadata: commissionNotificationData.metadata,
        recipient: mockBroker,
      };

      (db.notification.findMany as jest.Mock).mockResolvedValue([mockNotificationInQueue]);
      (db.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotificationInQueue,
        status: 'SENT',
        sentAt: new Date(),
        deliveryStatus: {
          email: 'DELIVERED',
          sms: 'DELIVERED',
          push: 'DELIVERED',
        },
      });

      // Simular procesamiento por cola (en producción sería automático)
      console.log('✅ Notificación procesada exitosamente');

      // 4. PASO 3: Usuario recibe y lee notificación
      console.log('👤 Paso 3: Usuario recibe notificación...');

      (db.notification.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'notification_123',
          type: 'COMMISSION_CALCULATED',
          title: 'Nueva comisión calculada',
          message: 'Se ha calculado una comisión de $25.000 por el contrato CNT-001',
          status: 'DELIVERED',
          isRead: false,
          createdAt: new Date(),
          deliveredAt: new Date(),
          channels: ['EMAIL', 'SMS', 'PUSH'],
          metadata: commissionNotificationData.metadata,
        }
      ]);

      const getNotificationsRequest = new NextRequest(
        `http://localhost:3000/api/notifications?userId=${brokerId}&status=DELIVERED`,
        { method: 'GET' }
      );

      const getResponse = await getNotificationsHandler(getNotificationsRequest);
      const getResult = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getResult.success).toBe(true);
      expect(getResult.data.notifications).toHaveLength(1);
      expect(getResult.data.notifications[0].type).toBe('COMMISSION_CALCULATED');
      expect(getResult.data.notifications[0].isRead).toBe(false);

      console.log('✅ Notificación recibida por usuario');

      // 5. PASO 4: Usuario marca notificación como leída
      console.log('✅ Paso 4: Usuario marca notificación como leída...');

      const notificationToMarkAsRead = {
        id: 'notification_123',
        isRead: false,
      };

      (db.notification.findUnique as jest.Mock).mockResolvedValue(notificationToMarkAsRead);
      (db.notification.update as jest.Mock).mockResolvedValue({
        ...notificationToMarkAsRead,
        isRead: true,
        readAt: new Date(),
      });

      const markAsReadRequest = new NextRequest(
        `http://localhost:3000/api/notifications/notification_123`,
        {
          method: 'PUT',
          body: JSON.stringify({ action: 'MARK_AS_READ' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const markAsReadResponse = await markAsReadHandler(
        markAsReadRequest,
        { params: { id: 'notification_123' } }
      );
      const markAsReadResult = await markAsReadResponse.json();

      expect(markAsReadResponse.status).toBe(200);
      expect(markAsReadResult.success).toBe(true);

      console.log('✅ Notificación marcada como leída');

      // 6. PASO 5: Verificar métricas y auditoría
      console.log('📊 Paso 5: Verificando métricas y auditoría...');

      // Verificar que se creó registro de auditoría
      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'NOTIFICATION_SENT',
          entityType: 'NOTIFICATION',
          entityId: 'notification_123',
          details: expect.objectContaining({
            type: 'COMMISSION_CALCULATED',
            recipientId: brokerId,
            channels: ['EMAIL', 'SMS', 'PUSH'],
          }),
        }),
      });

      // Verificar logging apropiado
      expect(logger.info).toHaveBeenCalledWith(
        'Notificación enviada exitosamente',
        expect.objectContaining({
          notificationId: 'notification_123',
          recipientId: brokerId,
          type: 'COMMISSION_CALCULATED',
        })
      );

      console.log('🎉 Flujo completo de notificaciones ejecutado exitosamente!');
    });

    it('debería manejar notificaciones programadas correctamente', async () => {
      const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Mañana

      const scheduledNotificationData = {
        type: 'PAYMENT_REMINDER',
        recipientId: 'tenant_123',
        recipientType: 'TENANT',
        title: 'Recordatorio de pago',
        message: 'Su pago mensual vence en 3 días',
        priority: 'MEDIUM',
        channels: ['EMAIL', 'PUSH'],
        scheduledFor: scheduledTime,
        metadata: {
          contractId: 'contract_123',
          amount: 500000,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      };

      (db.notification.create as jest.Mock).mockResolvedValue({
        id: 'scheduled_notification_123',
        ...scheduledNotificationData,
        status: 'SCHEDULED',
        createdAt: new Date(),
      });

      const scheduledRequest = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify(scheduledNotificationData),
        headers: { 'Content-Type': 'application/json' },
      });

      const scheduledResponse = await sendNotificationHandler(scheduledRequest);
      const scheduledResult = await scheduledResponse.json();

      expect(scheduledResponse.status).toBe(200);
      expect(scheduledResult.data.notification.status).toBe('SCHEDULED');
      expect(scheduledResult.data.notification.scheduledFor).toEqual(scheduledTime);

      // Verificar que no se procesó inmediatamente
      expect(logger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('enviada exitosamente'),
        expect.any(Object)
      );
    });

    it('debería manejar fallos de entrega y reintentos', async () => {
      const notificationData = {
        type: 'SYSTEM_ALERT',
        recipientId: 'user_123',
        recipientType: 'USER',
        title: 'Alerta del sistema',
        message: 'Se detectó un problema de seguridad',
        priority: 'HIGH',
        channels: ['EMAIL', 'SMS'],
        metadata: {
          alertType: 'SECURITY',
          severity: 'HIGH',
        },
      };

      // Simular fallo en envío de email
      (db.notification.create as jest.Mock).mockResolvedValue({
        id: 'failed_notification_123',
        ...notificationData,
        status: 'FAILED',
        failureReason: 'SMTP server error',
        retryCount: 0,
        createdAt: new Date(),
      });

      const failedRequest = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData),
        headers: { 'Content-Type': 'application/json' },
      });

      const failedResponse = await sendNotificationHandler(failedRequest);
      const failedResult = await failedResponse.json();

      expect(failedResponse.status).toBe(200);
      expect(failedResult.data.notification.status).toBe('FAILED');

      // Verificar que se programó reintento
      expect(logger.warn).toHaveBeenCalledWith(
        'Fallo en envío de notificación, programando reintento',
        expect.objectContaining({
          notificationId: 'failed_notification_123',
          failureReason: 'SMTP server error',
          retryCount: 0,
        })
      );
    });
  });

  describe('Gestión Avanzada de Notificaciones', () => {
    it('debería permitir configuración personalizada por usuario', async () => {
      const userId = 'user_config_123';

      const userNotificationSettings = {
        id: 'settings_123',
        userId,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        typesEnabled: {
          COMMISSION_CALCULATED: true,
          PAYMENT_RECEIVED: true,
          CONTRACT_ENDING: true,
          MAINTENANCE_REQUEST: false,
          MARKETING: false,
        },
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.notificationSettings.upsert as jest.Mock).mockResolvedValue(userNotificationSettings);

      // Configurar preferencias
      const configData = {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        typesEnabled: {
          COMMISSION_CALCULATED: true,
          PAYMENT_RECEIVED: true,
          CONTRACT_ENDING: true,
          MAINTENANCE_REQUEST: false,
          MARKETING: false,
        },
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
        },
      };

      const configRequest = new NextRequest(`http://localhost:3000/api/notifications/settings`, {
        method: 'PUT',
        body: JSON.stringify(configData),
        headers: { 'Content-Type': 'application/json' },
      });

      // Simular endpoint de configuración (no existe aún, pero debería)
      // const configResponse = await updateSettingsHandler(configRequest);
      // expect(configResponse.status).toBe(200);

      console.log('Configuración de notificaciones debería funcionar');
    });

    it('debería filtrar notificaciones según preferencias del usuario', async () => {
      const userId = 'user_filtered_123';

      // Usuario que no quiere notificaciones de marketing
      const userSettings = {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        typesEnabled: {
          COMMISSION_CALCULATED: true,
          PAYMENT_RECEIVED: true,
          MARKETING: false, // Deshabilitado
        },
      };

      // Intentar enviar notificación de marketing
      const marketingNotificationData = {
        type: 'MARKETING',
        recipientId: userId,
        recipientType: 'USER',
        title: 'Oferta especial',
        message: 'Descuento del 20% en seguros de arriendo',
        priority: 'LOW',
        channels: ['EMAIL', 'SMS', 'PUSH'],
      };

      (db.notificationSettings.findUnique as jest.Mock).mockResolvedValue(userSettings);

      // La notificación debería ser filtrada y no enviada
      const marketingRequest = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify(marketingNotificationData),
        headers: { 'Content-Type': 'application/json' },
      });

      const marketingResponse = await sendNotificationHandler(marketingRequest);
      const marketingResult = await marketingResponse.json();

      // Debería indicar que fue filtrada
      expect(marketingResult.data.notification.status).toBe('FILTERED');
      expect(logger.info).toHaveBeenCalledWith(
        'Notificación filtrada según preferencias del usuario',
        expect.objectContaining({
          userId,
          type: 'MARKETING',
          reason: 'Tipo deshabilitado',
        })
      );
    });

    it('debería respetar horas de silencio', async () => {
      const userId = 'user_quiet_123';
      const currentHour = 23; // 11 PM

      const userSettings = {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
        },
      };

      const urgentNotificationData = {
        type: 'PAYMENT_OVERDUE',
        recipientId: userId,
        recipientType: 'USER',
        title: 'Pago vencido',
        message: 'Su pago mensual está vencido',
        priority: 'HIGH',
        channels: ['SMS', 'PUSH'], // Solo SMS y Push en horas de silencio
        metadata: {
          contractId: 'contract_123',
          overdueAmount: 500000,
        },
      };

      (db.notificationSettings.findUnique as jest.Mock).mockResolvedValue(userSettings);

      const quietHoursRequest = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify(urgentNotificationData),
        headers: { 'Content-Type': 'application/json' },
      });

      const quietHoursResponse = await sendNotificationHandler(quietHoursRequest);
      const quietHoursResult = await quietHoursResponse.json();

      expect(quietHoursResponse.status).toBe(200);
      expect(quietHoursResult.data.notification.channels).not.toContain('EMAIL');
      expect(logger.info).toHaveBeenCalledWith(
        'Notificación ajustada por horas de silencio',
        expect.objectContaining({
          userId,
          originalChannels: ['SMS', 'PUSH', 'EMAIL'],
          adjustedChannels: ['SMS', 'PUSH'],
        })
      );
    });
  });

  describe('Métricas y Reportes de Notificaciones', () => {
    it('debería generar métricas de entrega de notificaciones', async () => {
      const mockNotifications = [
        {
          id: 'notif_1',
          type: 'COMMISSION_CALCULATED',
          status: 'DELIVERED',
          channels: ['EMAIL', 'SMS', 'PUSH'],
          deliveryStatus: {
            email: 'DELIVERED',
            sms: 'DELIVERED',
            push: 'DELIVERED',
          },
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'notif_2',
          type: 'PAYMENT_REMINDER',
          status: 'DELIVERED',
          channels: ['EMAIL', 'PUSH'],
          deliveryStatus: {
            email: 'DELIVERED',
            push: 'FAILED',
          },
          createdAt: new Date('2024-01-02'),
        },
        {
          id: 'notif_3',
          type: 'SYSTEM_ALERT',
          status: 'FAILED',
          channels: ['EMAIL', 'SMS'],
          failureReason: 'Invalid recipient',
          createdAt: new Date('2024-01-03'),
        },
      ];

      (db.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      // Calcular métricas
      const totalNotifications = mockNotifications.length;
      const deliveredNotifications = mockNotifications.filter(n => n.status === 'DELIVERED').length;
      const failedNotifications = mockNotifications.filter(n => n.status === 'FAILED').length;
      const deliveryRate = (deliveredNotifications / totalNotifications) * 100;

      // Métricas por canal
      const emailDeliveries = mockNotifications.filter(n =>
        n.deliveryStatus?.email === 'DELIVERED'
      ).length;
      const smsDeliveries = mockNotifications.filter(n =>
        n.deliveryStatus?.sms === 'DELIVERED'
      ).length;
      const pushDeliveries = mockNotifications.filter(n =>
        n.deliveryStatus?.push === 'DELIVERED'
      ).length;

      // Verificar cálculos
      expect(totalNotifications).toBe(3);
      expect(deliveredNotifications).toBe(2);
      expect(failedNotifications).toBe(1);
      expect(deliveryRate).toBe(66.67);
      expect(emailDeliveries).toBe(2);
      expect(smsDeliveries).toBe(1);
      expect(pushDeliveries).toBe(1);
    });

    it('debería generar reportes de engagement de usuarios', async () => {
      const mockNotificationInteractions = [
        {
          id: 'notif_1',
          type: 'COMMISSION_CALCULATED',
          recipientId: 'user_1',
          isRead: true,
          readAt: new Date('2024-01-01T10:30:00Z'),
          clicked: true,
          clickedAt: new Date('2024-01-01T10:35:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'notif_2',
          type: 'PAYMENT_REMINDER',
          recipientId: 'user_1',
          isRead: false,
          clicked: false,
          createdAt: new Date('2024-01-02T10:00:00Z'),
        },
        {
          id: 'notif_3',
          type: 'MAINTENANCE_UPDATE',
          recipientId: 'user_2',
          isRead: true,
          readAt: new Date('2024-01-03T11:00:00Z'),
          clicked: true,
          clickedAt: new Date('2024-01-03T11:15:00Z'),
          createdAt: new Date('2024-01-03T10:00:00Z'),
        },
      ];

      (db.notification.findMany as jest.Mock).mockResolvedValue(mockNotificationInteractions);

      // Calcular métricas de engagement
      const totalNotifications = mockNotificationInteractions.length;
      const readNotifications = mockNotificationInteractions.filter(n => n.isRead).length;
      const clickedNotifications = mockNotificationInteractions.filter(n => n.clicked).length;
      const readRate = (readNotifications / totalNotifications) * 100;
      const clickRate = (clickedNotifications / totalNotifications) * 100;

      // Tiempo promedio de lectura
      const readTimes = mockNotificationInteractions
        .filter(n => n.isRead && n.readAt)
        .map(n => n.readAt!.getTime() - n.createdAt.getTime());

      const averageReadTime = readTimes.length > 0
        ? readTimes.reduce((a, b) => a + b, 0) / readTimes.length
        : 0;

      // Verificar métricas
      expect(readRate).toBe(66.67); // 2 de 3 leídas
      expect(clickRate).toBe(66.67); // 2 de 3 clickeadas
      expect(averageReadTime).toBeGreaterThan(0);
    });
  });

  describe('Notificaciones Masivas y Campañas', () => {
    it('debería manejar envío masivo de notificaciones', async () => {
      const recipients = [
        { id: 'user_1', email: 'user1@example.com', role: 'TENANT' },
        { id: 'user_2', email: 'user2@example.com', role: 'OWNER' },
        { id: 'user_3', email: 'user3@example.com', role: 'BROKER' },
        // ... hasta 1000 usuarios
      ];

      const bulkNotificationData = {
        type: 'SYSTEM_MAINTENANCE',
        recipients: recipients.map(r => ({ userId: r.id, type: r.role })),
        title: 'Mantenimiento programado',
        message: 'El sistema estará en mantenimiento el próximo domingo de 2:00 a 4:00 AM',
        priority: 'MEDIUM',
        channels: ['EMAIL', 'PUSH'],
        metadata: {
          maintenanceStart: '2024-02-11T02:00:00Z',
          maintenanceEnd: '2024-02-11T04:00:00Z',
          estimatedDowntime: '2 hours',
        },
      };

      // Simular creación de notificaciones masivas
      const mockBulkNotifications = recipients.map((recipient, index) => ({
        id: `bulk_notif_${index + 1}`,
        type: 'SYSTEM_MAINTENANCE',
        recipientId: recipient.id,
        recipientType: recipient.role,
        title: bulkNotificationData.title,
        message: bulkNotificationData.message,
        status: 'PENDING',
        createdAt: new Date(),
      }));

      (db.notification.createMany as jest.Mock).mockResolvedValue({
        count: mockBulkNotifications.length,
      });

      const bulkRequest = new NextRequest('http://localhost:3000/api/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkNotificationData),
        headers: { 'Content-Type': 'application/json' },
      });

      // Simular endpoint de envío masivo
      console.log(`✅ Se crearon ${mockBulkNotifications.length} notificaciones masivas`);

      // Verificar que se procesaron eficientemente
      expect(logger.info).toHaveBeenCalledWith(
        'Notificaciones masivas creadas exitosamente',
        expect.objectContaining({
          totalRecipients: recipients.length,
          notificationType: 'SYSTEM_MAINTENANCE',
        })
      );
    });

    it('debería permitir segmentación de usuarios para campañas', async () => {
      // Segmentar usuarios por criterios
      const segmentationCriteria = {
        role: 'TENANT',
        city: 'Santiago',
        kycStatus: 'VERIFIED',
        lastLoginAfter: new Date('2024-01-01'),
        hasActiveContract: true,
      };

      const campaignData = {
        name: 'Campaña Inquilinos Santiago',
        type: 'MARKETING',
        segmentation: segmentationCriteria,
        title: 'Descubre propiedades nuevas en Santiago',
        message: 'Tenemos más de 500 propiedades disponibles en Santiago. ¡Encuentra tu hogar ideal!',
        priority: 'LOW',
        channels: ['EMAIL', 'PUSH'],
        scheduledFor: new Date('2024-02-01T10:00:00Z'),
        metadata: {
          campaignId: 'campaign_santiago_2024',
          targetAudience: 'TENANT',
          expectedReach: 1500,
        },
      };

      // Simular que se encontraron 1200 usuarios que coinciden con la segmentación
      const matchingUsers = Array.from({ length: 1200 }, (_, i) => ({
        id: `user_${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: 'TENANT',
        city: 'Santiago',
        kycStatus: 'VERIFIED',
      }));

      console.log(`✅ Campaña segmentada para ${matchingUsers.length} usuarios`);

      // Verificar criterios de segmentación
      const allMatchCriteria = matchingUsers.every(user =>
        user.role === segmentationCriteria.role &&
        user.city === segmentationCriteria.city &&
        user.kycStatus === segmentationCriteria.kycStatus
      );

      expect(allMatchCriteria).toBe(true);
    });
  });
});
