import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as processPaymentHandler } from '../../src/app/api/payments/route';
import { POST as processPayoutHandler } from '../../src/app/api/admin/payouts/process/route';
import { db } from '../../src/lib/db';
import { logger } from '../../src/lib/logger';

describe('Payment Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Data Validation', () => {
    it('debería validar montos de pago para prevenir manipulación', async () => {
      const contractId = 'contract_validation_123';

      const mockContract = {
        id: contractId,
        monthlyRent: 500000,
        status: 'ACTIVE',
      };

      (db.contract.findUnique as jest.Mock).mockResolvedValue(mockContract);

      // Intentar pago con monto manipulado
      const manipulatedAmounts = [
        -500000, // Monto negativo
        0, // Monto cero
        5000000, // Monto excesivo (10x el contrato)
        500000.999, // Decimales no permitidos
        '500000', // String en lugar de número
        NaN, // Not a number
        Infinity, // Infinito
      ];

      for (const manipulatedAmount of manipulatedAmounts) {
        const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
          method: 'POST',
          body: JSON.stringify({
            contractId,
            amount: manipulatedAmount,
            description: 'Pago manipulado',
            paymentMethod: 'KHIPU',
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await processPaymentHandler(paymentRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error).toContain('monto');
      }
    });

    it('debería prevenir manipulación de IDs de contrato', async () => {
      const validContractId = 'contract_valid_123';
      const manipulatedContractIds = [
        'contract_123; DROP TABLE payments; --', // SQL Injection
        'contract_123\' OR \'1\'=\'1', // SQL Injection
        '../../../etc/passwd', // Path Traversal
        '<script>alert("XSS")</script>', // XSS
        'contract_123\x00nullbyte', // Null byte injection
        'contract_123'.repeat(1000), // Buffer overflow attempt
      ];

      for (const manipulatedId of manipulatedContractIds) {
        const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
          method: 'POST',
          body: JSON.stringify({
            contractId: manipulatedId,
            amount: 500000,
            description: 'Pago con ID manipulado',
            paymentMethod: 'KHIPU',
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await processPaymentHandler(paymentRequest);
        const result = await response.json();

        // Debería rechazar IDs maliciosos o sanitizarlos
        expect([400, 404]).toContain(response.status);
        expect(result.success).toBe(false);
      }
    });

    it('debería validar referencias de pago únicas', async () => {
      const contractId = 'contract_duplicate_123';
      const reference = 'PAY_2024_02_DUPLICATE';

      // Mock de pago existente con misma referencia
      (db.payment.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'existing_payment_123',
        contractId,
        reference,
        amount: 500000,
        status: 'COMPLETED',
      });

      const duplicatePaymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          contractId,
          amount: 500000,
          description: 'Pago duplicado',
          paymentMethod: 'KHIPU',
          reference,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await processPaymentHandler(duplicatePaymentRequest);
      const result = await response.json();

      expect(response.status).toBe(409);
      expect(result.success).toBe(false);
      expect(result.error).toContain('referencia');
      expect(result.error).toContain('duplicada');
    });
  });

  describe('Fraud Prevention', () => {
    it('debería detectar patrones de fraude en pagos', async () => {
      const contractId = 'contract_fraud_123';

      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: contractId,
        monthlyRent: 500000,
        status: 'ACTIVE',
      });

      // Simular patrones de fraude
      const fraudulentPayments = [
        {
          amount: 500000,
          description: 'Pago normal',
          metadata: { velocity: 10 }, // Múltiples pagos en poco tiempo
        },
        {
          amount: 500000,
          description: 'Pago sospechoso',
          metadata: { unusualAmount: true }, // Monto inusual
        },
        {
          amount: 500000,
          description: 'Pago desde ubicación sospechosa',
          metadata: { highRiskLocation: true }, // Ubicación de alto riesgo
        },
      ];

      for (const fraudulentPayment of fraudulentPayments) {
        const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
          method: 'POST',
          body: JSON.stringify({
            contractId,
            ...fraudulentPayment,
            paymentMethod: 'KHIPU',
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await processPaymentHandler(paymentRequest);

        // Debería marcar como sospechoso o rechazar
        expect([400, 402]).toContain(response.status);

        if (response.status === 402) {
          const result = await response.json();
          expect(result.error).toContain('sospechoso');
        }
      }
    });

    it('debería validar identidad del pagador', async () => {
      const contractId = 'contract_identity_123';

      const mockContract = {
        id: contractId,
        tenantId: 'tenant_legitimate_123',
        monthlyRent: 500000,
        status: 'ACTIVE',
      };

      (db.contract.findUnique as jest.Mock).mockResolvedValue(mockContract);

      // Intentar pago desde usuario no autorizado
      const unauthorizedPaymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          contractId,
          amount: 500000,
          description: 'Pago desde usuario no autorizado',
          paymentMethod: 'KHIPU',
          payerId: 'unauthorized_user_456', // Usuario diferente al tenant del contrato
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await processPaymentHandler(unauthorizedPaymentRequest);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.error).toContain('autorización');
    });

    it('debería detectar manipulación de timestamps', async () => {
      const contractId = 'contract_timestamp_123';

      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: contractId,
        monthlyRent: 500000,
        status: 'ACTIVE',
      });

      // Intentar pago con timestamp manipulado
      const manipulatedTimestamps = [
        new Date('2020-01-01').toISOString(), // Fecha muy antigua
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Fecha futura
        'invalid-timestamp',
        new Date().toISOString() + 'extra', // Timestamp corrupto
      ];

      for (const manipulatedTimestamp of manipulatedTimestamps) {
        const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
          method: 'POST',
          body: JSON.stringify({
            contractId,
            amount: 500000,
            description: 'Pago con timestamp manipulado',
            paymentMethod: 'KHIPU',
            timestamp: manipulatedTimestamp,
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await processPaymentHandler(paymentRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error).toContain('timestamp');
      }
    });
  });

  describe('Payout Security', () => {
    it('debería validar cuentas bancarias antes de payouts', async () => {
      const payoutData = {
        payoutIds: ['payout_secure_123'],
      };

      // Mock de payout con cuenta no verificada
      const mockPayout = {
        id: 'payout_secure_123',
        recipientId: 'recipient_123',
        amount: 25000,
        status: 'PENDING',
      };

      (db.payout.findMany as jest.Mock).mockResolvedValue([mockPayout]);

      // Mock de cuenta bancaria no verificada
      (db.bankAccount.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'ba_unverified_123',
          userId: 'recipient_123',
          isVerified: false,
          verificationStatus: 'PENDING',
        },
      ]);

      const payoutRequest = new NextRequest('http://localhost:3000/api/admin/payouts/process', {
        method: 'POST',
        body: JSON.stringify(payoutData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await processPayoutHandler(payoutRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('cuenta');
      expect(result.error).toContain('verificada');
    });

    it('debería prevenir payouts duplicados', async () => {
      const payoutId = 'payout_duplicate_123';

      // Mock de payout ya procesado
      const mockProcessedPayout = {
        id: payoutId,
        status: 'COMPLETED',
        transactionId: 'tx_completed_123',
        processedAt: new Date('2024-01-15'),
      };

      (db.payout.findMany as jest.Mock).mockResolvedValue([mockProcessedPayout]);

      const duplicatePayoutRequest = new NextRequest('http://localhost:3000/api/admin/payouts/process', {
        method: 'POST',
        body: JSON.stringify({
          payoutIds: [payoutId],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await processPayoutHandler(duplicatePayoutRequest);
      const result = await response.json();

      expect(response.status).toBe(409);
      expect(result.success).toBe(false);
      expect(result.error).toContain('procesado');
    });

    it('debería validar límites de montos de payout', async () => {
      const excessiveAmounts = [
        10000000, // 10 millones (muy alto para un payout normal)
        0, // Monto cero
        -50000, // Monto negativo
        50000.99, // Decimales no permitidos
      ];

      for (const excessiveAmount of excessiveAmounts) {
        const payoutData = {
          payoutIds: [`payout_excessive_${excessiveAmount}`],
        };

        (db.payout.findMany as jest.Mock).mockResolvedValue([
          {
            id: `payout_excessive_${excessiveAmount}`,
            recipientId: 'recipient_123',
            amount: excessiveAmount,
            status: 'PENDING',
          },
        ]);

        (db.bankAccount.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'ba_verified_123',
            userId: 'recipient_123',
            isVerified: true,
          },
        ]);

        const payoutRequest = new NextRequest('http://localhost:3000/api/admin/payouts/process', {
          method: 'POST',
          body: JSON.stringify(payoutData),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await processPayoutHandler(payoutRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error).toContain('monto');
      }
    });
  });

  describe('Rate Limiting for Financial Operations', () => {
    it('debería limitar frecuencia de operaciones financieras', async () => {
      const contractId = 'contract_rate_limit_123';

      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: contractId,
        monthlyRent: 500000,
        status: 'ACTIVE',
      });

      // Simular múltiples pagos en poco tiempo
      const rapidPayments = Array.from({ length: 10 }, (_, i) => ({
        contractId,
        amount: 50000, // Pagos pequeños para evadir detección
        description: `Pago rápido ${i + 1}`,
        paymentMethod: 'KHIPU',
        timestamp: new Date(Date.now() + i * 1000).toISOString(), // Cada segundo
      }));

      // Los primeros pagos deberían ser aceptados
      for (let i = 0; i < 5; i++) {
        const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
          method: 'POST',
          body: JSON.stringify(rapidPayments[i]),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await processPaymentHandler(paymentRequest);
        expect([200, 201]).toContain(response.status);
      }

      // Los pagos posteriores deberían ser rate limited
      for (let i = 5; i < rapidPayments.length; i++) {
        const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
          method: 'POST',
          body: JSON.stringify(rapidPayments[i]),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await processPaymentHandler(paymentRequest);
        expect(response.status).toBe(429); // Too Many Requests

        const result = await response.json();
        expect(result.error).toContain('demasiados');
        expect(result.retryAfter).toBeDefined();
      }
    });
  });

  describe('Audit Trail for Financial Transactions', () => {
    it('debería mantener registro completo de todas las transacciones', async () => {
      const contractId = 'contract_audit_123';
      const paymentAmount = 500000;

      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: contractId,
        monthlyRent: paymentAmount,
        status: 'ACTIVE',
        tenantId: 'tenant_123',
        ownerId: 'owner_456',
      });

      (db.payment.create as jest.Mock).mockResolvedValue({
        id: 'payment_audit_123',
        contractId,
        amount: paymentAmount,
        status: 'COMPLETED',
        transactionId: 'khipu_audit_123',
      });

      const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          contractId,
          amount: paymentAmount,
          description: 'Pago auditado',
          paymentMethod: 'KHIPU',
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.100',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-Request-ID': 'req_audit_123',
        },
      });

      await processPaymentHandler(paymentRequest);

      // Verificar registro de auditoría completo
      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'PAYMENT_COMPLETED',
          entityType: 'PAYMENT',
          entityId: 'payment_audit_123',
          details: expect.objectContaining({
            contractId,
            amount: paymentAmount,
            paymentMethod: 'KHIPU',
            transactionId: 'khipu_audit_123',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            requestId: 'req_audit_123',
            timestamp: expect.any(Date),
          }),
        }),
      });
    });

    it('debería registrar intentos de manipulación financiera', async () => {
      const contractId = 'contract_manipulation_123';

      // Intentar manipulación de datos financieros
      const manipulatedPayment = {
        contractId,
        amount: 500000,
        description: 'Pago manipulado',
        paymentMethod: 'KHIPU',
        // Campos adicionales sospechosos
        manipulatedField: 'suspicious_value',
        bypassValidation: true,
        adminOverride: 'fake_override',
      };

      const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify(manipulatedPayment),
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.100',
        },
      });

      await processPaymentHandler(paymentRequest);

      // Verificar que se registró el intento de manipulación
      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'PAYMENT_MANIPULATION_ATTEMPT',
          entityType: 'PAYMENT',
          severity: 'HIGH',
          details: expect.objectContaining({
            contractId,
            suspiciousFields: ['manipulatedField', 'bypassValidation', 'adminOverride'],
            ipAddress: '192.168.1.100',
            reason: 'Campos sospechosos detectados',
          }),
        }),
      });
    });
  });

  describe('Data Encryption & Privacy', () => {
    it('debería encriptar datos sensibles en base de datos', async () => {
      const paymentData = {
        contractId: 'contract_encryption_123',
        amount: 500000,
        description: 'Pago con datos sensibles',
        paymentMethod: 'KHIPU',
        cardNumber: '4111111111111111', // Número de tarjeta (debería estar encriptado)
        cardExpiry: '12/25',
        cardCVV: '123',
      };

      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: 'contract_encryption_123',
        monthlyRent: 500000,
        status: 'ACTIVE',
      });

      (db.payment.create as jest.Mock).mockImplementation((data) => {
        // Verificar que los datos sensibles están encriptados antes de guardar
        expect(data.data.cardNumber).not.toBe('4111111111111111');
        expect(data.data.cardNumber).toMatch(/^enc_\w+/); // Formato encriptado
        expect(data.data.cardCVV).not.toBe('123');
        expect(data.data.cardCVV).toMatch(/^enc_\w+/);

        return Promise.resolve({
          id: 'payment_encrypted_123',
          ...data.data,
        });
      });

      const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await processPaymentHandler(paymentRequest);
      expect(response.status).toBe(200);
    });

    it('debería anonimizar datos en logs de pago', async () => {
      const paymentData = {
        contractId: 'contract_privacy_123',
        amount: 500000,
        description: 'Pago con datos personales',
        paymentMethod: 'KHIPU',
        cardNumber: '4111111111111111',
        cardHolderName: 'Juan Pérez González',
        billingAddress: 'Providencia 123, Santiago',
      };

      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: 'contract_privacy_123',
        monthlyRent: 500000,
        status: 'ACTIVE',
      });

      (db.payment.create as jest.Mock).mockResolvedValue({
        id: 'payment_privacy_123',
        ...paymentData,
      });

      const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
        headers: { 'Content-Type': 'application/json' },
      });

      await processPaymentHandler(paymentRequest);

      // Verificar que los logs no contienen datos sensibles
      expect(logger.info).toHaveBeenCalledWith(
        'Pago procesado exitosamente',
        expect.objectContaining({
          paymentId: 'payment_privacy_123',
          contractId: 'contract_privacy_123',
          amount: 500000,
          // Datos sensibles deberían estar anonimizados
          cardNumber: '4111****1111', // Anonimizado
          cardHolderName: 'Juan P. González', // Anonimizado
          billingAddress: 'Providencia ***, Santiago', // Anonimizado
        })
      );
    });
  });
});
