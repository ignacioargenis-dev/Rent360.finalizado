import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as getPayoutsHandler, POST as createPayoutHandler } from '../../src/app/api/admin/payouts/route';
import { POST as processPayoutsHandler } from '../../src/app/api/admin/payouts/process/route';
import { db } from '../../src/lib/db';
import { logger } from '../../src/lib/logger';

describe('Payouts API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/payouts', () => {
    it('debería retornar lista de payouts correctamente', async () => {
      const mockPayouts = [
        {
          id: 'payout_1',
          recipientId: 'broker_123',
          recipientType: 'broker',
          amount: 25000,
          status: 'completed',
          transactionId: 'tx_123',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          recipient: {
            id: 'broker_123',
            name: 'Juan Pérez',
            email: 'juan@example.com',
          },
        },
        {
          id: 'payout_2',
          recipientId: 'owner_456',
          recipientType: 'owner',
          amount: 50000,
          status: 'pending',
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-16'),
          recipient: {
            id: 'owner_456',
            name: 'María González',
            email: 'maria@example.com',
          },
        },
      ];

      const mockStats = {
        totalPayouts: 2,
        totalAmount: 75000,
        completedAmount: 25000,
        pendingAmount: 50000,
        completedCount: 1,
        pendingCount: 1,
      };

      (db.payout.findMany as jest.Mock).mockResolvedValue(mockPayouts);
      (db.payout.count as jest.Mock).mockResolvedValue(2);
      (db.payout.aggregate as jest.Mock).mockResolvedValue([
        { _sum: { amount: 75000 }, _count: { status: 2 } },
        { _sum: { amount: 25000 }, _count: { status: 1 } },
      ]);

      const request = new NextRequest('http://localhost:3000/api/admin/payouts?page=1&limit=10', {
        method: 'GET',
      });

      const response = await getPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.payouts).toHaveLength(2);
      expect(result.data.stats.totalPayouts).toBe(2);
      expect(result.data.stats.totalAmount).toBe(75000);
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.limit).toBe(10);
    });

    it('debería filtrar payouts por estado', async () => {
      const mockPendingPayouts = [
        {
          id: 'payout_2',
          recipientId: 'owner_456',
          recipientType: 'owner',
          amount: 50000,
          status: 'pending',
          recipient: {
            id: 'owner_456',
            name: 'María González',
          },
        },
      ];

      (db.payout.findMany as jest.Mock).mockResolvedValue(mockPendingPayouts);
      (db.payout.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/payouts?status=pending', {
        method: 'GET',
      });

      const response = await getPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.payouts).toHaveLength(1);
      expect(result.data.payouts[0].status).toBe('pending');
      expect(db.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'pending',
          }),
        })
      );
    });

    it('debería filtrar payouts por tipo de destinatario', async () => {
      const mockBrokerPayouts = [
        {
          id: 'payout_1',
          recipientId: 'broker_123',
          recipientType: 'broker',
          amount: 25000,
          status: 'completed',
          recipient: {
            id: 'broker_123',
            name: 'Juan Pérez',
          },
        },
      ];

      (db.payout.findMany as jest.Mock).mockResolvedValue(mockBrokerPayouts);
      (db.payout.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/payouts?recipientType=broker', {
        method: 'GET',
      });

      const response = await getPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.payouts).toHaveLength(1);
      expect(result.data.payouts[0].recipientType).toBe('broker');
    });

    it('debería manejar paginación correctamente', async () => {
      const mockPayouts = Array.from({ length: 5 }, (_, i) => ({
        id: `payout_${i + 1}`,
        recipientId: `user_${i + 1}`,
        recipientType: 'broker',
        amount: 10000 * (i + 1),
        status: 'completed',
        recipient: {
          id: `user_${i + 1}`,
          name: `User ${i + 1}`,
        },
      }));

      (db.payout.findMany as jest.Mock).mockResolvedValue(mockPayouts.slice(0, 3));
      (db.payout.count as jest.Mock).mockResolvedValue(5);

      const request = new NextRequest('http://localhost:3000/api/admin/payouts?page=1&limit=3', {
        method: 'GET',
      });

      const response = await getPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.payouts).toHaveLength(3);
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.limit).toBe(3);
      expect(result.data.pagination.totalPages).toBe(2);
      expect(result.data.pagination.hasNext).toBe(true);
      expect(result.data.pagination.hasPrev).toBe(false);
    });

    it('debería ordenar payouts por fecha correctamente', async () => {
      const mockPayouts = [
        {
          id: 'payout_2',
          recipientId: 'user_2',
          amount: 30000,
          status: 'completed',
          createdAt: new Date('2024-01-16'),
          recipient: { id: 'user_2', name: 'User 2' },
        },
        {
          id: 'payout_1',
          recipientId: 'user_1',
          amount: 25000,
          status: 'completed',
          createdAt: new Date('2024-01-15'),
          recipient: { id: 'user_1', name: 'User 1' },
        },
      ];

      (db.payout.findMany as jest.Mock).mockResolvedValue(mockPayouts);
      (db.payout.count as jest.Mock).mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/admin/payouts?sortBy=createdAt&sortOrder=desc', {
        method: 'GET',
      });

      const response = await getPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.payouts[0].id).toBe('payout_2');
      expect(result.data.payouts[1].id).toBe('payout_1');
    });

    it('debería manejar errores de base de datos', async () => {
      (db.payout.findMany as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'GET',
      });

      const response = await getPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Error interno');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('POST /api/admin/payouts', () => {
    it('debería crear payout manual correctamente', async () => {
      const payoutData = {
        recipientId: 'broker_123',
        recipientType: 'broker',
        amount: 25000,
        description: 'Pago de comisión manual',
        currency: 'CLP',
      };

      const mockCreatedPayout = {
        id: 'payout_manual_1',
        ...payoutData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.payout.create as jest.Mock).mockResolvedValue(mockCreatedPayout);

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'POST',
        body: JSON.stringify(payoutData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createPayoutHandler(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('payout_manual_1');
      expect(result.data.amount).toBe(25000);
      expect(result.data.status).toBe('pending');
      expect(logger.info).toHaveBeenCalledWith(
        'Payout manual creado exitosamente',
        expect.objectContaining({ payoutId: 'payout_manual_1' })
      );
    });

    it('debería validar campos requeridos', async () => {
      const invalidPayoutData = {
        recipientId: 'broker_123',
        // Falta recipientType, amount, etc.
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'POST',
        body: JSON.stringify(invalidPayoutData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createPayoutHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('requeridos');
    });

    it('debería validar monto positivo', async () => {
      const invalidPayoutData = {
        recipientId: 'broker_123',
        recipientType: 'broker',
        amount: -1000,
        description: 'Monto inválido',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'POST',
        body: JSON.stringify(invalidPayoutData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createPayoutHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('monto');
    });

    it('debería validar tipo de destinatario válido', async () => {
      const invalidPayoutData = {
        recipientId: 'broker_123',
        recipientType: 'invalid_type',
        amount: 25000,
        description: 'Tipo inválido',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'POST',
        body: JSON.stringify(invalidPayoutData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createPayoutHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('destinatario');
    });

    it('debería validar existencia del destinatario', async () => {
      const payoutData = {
        recipientId: 'nonexistent_user',
        recipientType: 'broker',
        amount: 25000,
        description: 'Usuario inexistente',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'POST',
        body: JSON.stringify(payoutData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createPayoutHandler(request);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toContain('destinatario');
    });
  });

  describe('POST /api/admin/payouts/process', () => {
    it('debería procesar lote de payouts exitosamente', async () => {
      const processData = {
        payoutIds: ['payout_1', 'payout_2'],
        priority: 'normal',
      };

      const mockPayouts = [
        {
          id: 'payout_1',
          recipientId: 'broker_123',
          recipientType: 'broker',
          amount: 25000,
          status: 'pending',
        },
        {
          id: 'payout_2',
          recipientId: 'owner_456',
          recipientType: 'owner',
          amount: 50000,
          status: 'pending',
        },
      ];

      (db.payout.findMany as jest.Mock).mockResolvedValue(mockPayouts);
      (db.payout.update as jest.Mock).mockResolvedValue({
        id: 'payout_1',
        status: 'processing',
      });

      // Mock del servicio de payouts
      jest.doMock('../../src/lib/payout-service', () => ({
        PayoutService: {
          processPayoutBatch: jest.fn().mockResolvedValue({
            success: true,
            totalProcessed: 2,
            totalAmount: 75000,
            processedPayouts: mockPayouts,
            failedPayouts: [],
          }),
        },
      }));

      const request = new NextRequest('http://localhost:3000/api/admin/payouts/process', {
        method: 'POST',
        body: JSON.stringify(processData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await processPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.totalProcessed).toBe(2);
      expect(result.data.totalAmount).toBe(75000);
      expect(logger.info).toHaveBeenCalledWith(
        'Procesamiento de payouts iniciado',
        expect.objectContaining({ payoutCount: 2 })
      );
    });

    it('debería manejar procesamiento parcial', async () => {
      const processData = {
        payoutIds: ['payout_1', 'payout_2', 'payout_3'],
      };

      const mockPayouts = [
        {
          id: 'payout_1',
          recipientId: 'broker_123',
          amount: 25000,
          status: 'pending',
        },
        {
          id: 'payout_2',
          recipientId: 'owner_456',
          amount: 50000,
          status: 'pending',
        },
        {
          id: 'payout_3',
          recipientId: 'broker_789',
          amount: 30000,
          status: 'pending',
        },
      ];

      (db.payout.findMany as jest.Mock).mockResolvedValue(mockPayouts);

      // Mock procesamiento con algunos fallos
      jest.doMock('../../src/lib/payout-service', () => ({
        PayoutService: {
          processPayoutBatch: jest.fn().mockResolvedValue({
            success: true,
            totalProcessed: 2,
            totalAmount: 55000,
            processedPayouts: [mockPayouts[0], mockPayouts[1]],
            failedPayouts: [mockPayouts[2]],
            errors: ['Cuenta bancaria no verificada para payout_3'],
          }),
        },
      }));

      const request = new NextRequest('http://localhost:3000/api/admin/payouts/process', {
        method: 'POST',
        body: JSON.stringify(processData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await processPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(207); // Multi-Status
      expect(result.success).toBe(true);
      expect(result.data.totalProcessed).toBe(2);
      expect(result.data.failedPayouts).toHaveLength(1);
      expect(result.data.errors).toHaveLength(1);
    });

    it('debería validar que se proporcionen IDs de payout', async () => {
      const invalidProcessData = {
        // Sin payoutIds
        priority: 'high',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts/process', {
        method: 'POST',
        body: JSON.stringify(invalidProcessData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await processPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('IDs');
    });

    it('debería rechazar payouts ya procesados', async () => {
      const processData = {
        payoutIds: ['payout_1'],
      };

      const mockPayout = {
        id: 'payout_1',
        status: 'completed', // Ya procesado
        recipientId: 'broker_123',
        amount: 25000,
      };

      (db.payout.findMany as jest.Mock).mockResolvedValue([mockPayout]);

      const request = new NextRequest('http://localhost:3000/api/admin/payouts/process', {
        method: 'POST',
        body: JSON.stringify(processData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await processPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('procesados');
    });

    it('debería manejar errores de procesamiento completo', async () => {
      const processData = {
        payoutIds: ['payout_1'],
      };

      (db.payout.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/payouts/process', {
        method: 'POST',
        body: JSON.stringify(processData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await processPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Error interno');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Authentication & Authorization', () => {
    it('debería requerir autenticación de administrador', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'GET',
        // Sin headers de autenticación
      });

      const response = await getPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain('autenticación');
    });

    it('debería verificar permisos de administrador', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer user_token', // Token de usuario regular
        },
      });

      const response = await getPayoutsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.error).toContain('permisos');
    });
  });

  describe('Rate Limiting & Security', () => {
    it('debería aplicar rate limiting a operaciones de payout', async () => {
      // Simular múltiples requests rápidas
      const requests = Array.from({ length: 10 }, () =>
        new NextRequest('http://localhost:3000/api/admin/payouts', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer admin_token',
            'X-Forwarded-For': '127.0.0.1',
          },
        })
      );

      // Mock rate limiter que bloquea después de cierto límite
      jest.doMock('../../src/lib/rate-limiter', () => ({
        rateLimiter: {
          check: jest.fn()
            .mockResolvedValueOnce({ allowed: true })
            .mockResolvedValueOnce({ allowed: true })
            .mockResolvedValueOnce({ allowed: false, remainingTime: 60 }),
        },
      }));

      // Primeras requests permitidas
      for (let i = 0; i < 2; i++) {
        const response = await getPayoutsHandler(requests[i]);
        expect(response.status).toBe(200);
      }

      // Tercera request bloqueada
      const blockedResponse = await getPayoutsHandler(requests[2]);
      expect(blockedResponse.status).toBe(429);
      const result = await blockedResponse.json();
      expect(result.error).toContain('rate limit');
    });

    it('debería validar y sanitizar entrada de usuario', async () => {
      const maliciousData = {
        recipientId: 'broker_123',
        recipientType: 'broker',
        amount: 25000,
        description: '<script>alert("XSS")</script>',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'POST',
        body: JSON.stringify(maliciousData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createPayoutHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('contenido malicioso');
    });
  });
});
