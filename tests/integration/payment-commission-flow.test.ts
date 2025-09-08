import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as processPaymentHandler } from '../../src/app/api/payments/route';
import { POST as calculateCommissionHandler } from '../../src/app/api/admin/commissions/route';
import { POST as processPayoutHandler } from '../../src/app/api/admin/payouts/process/route';
import { GET as getCommissionStatsHandler } from '../../src/app/api/broker/commissions/route';
import { db } from '../../src/lib/db';
import { logger } from '../../src/lib/logger';

describe('Payment & Commission Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Flujo Completo: Pago → Comisión → Payout', () => {
    it('debería completar flujo completo de pagos y comisiones exitosamente', async () => {
      // 1. SETUP: Datos de prueba
      const contractId = 'contract_123';
      const tenantId = 'tenant_456';
      const ownerId = 'owner_789';
      const brokerId = 'broker_101';

      const mockContract = {
        id: contractId,
        propertyId: 'prop_123',
        tenantId,
        ownerId,
        brokerId,
        status: 'ACTIVE',
        monthlyRent: 500000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-01-31'),
        signedAt: new Date('2024-01-15'),
      };

      const mockCommissionConfig = {
        id: 'config_1',
        key: 'commission_percentage',
        value: '5',
      };

      const mockBrokerAccount = {
        id: 'ba_broker',
        userId: brokerId,
        bankCode: '012',
        bankName: 'Banco Estado',
        accountNumber: '123456789',
        accountHolder: 'Carlos Rodríguez',
        isVerified: true,
      };

      // 2. PASO 1: Procesar pago mensual del inquilino
      console.log('💳 Paso 1: Procesando pago mensual del inquilino...');

      const paymentData = {
        contractId,
        amount: 500000,
        description: 'Pago mensual arriendo febrero 2024',
        paymentMethod: 'KHIPU',
        reference: 'PAY_2024_02',
      };

      const mockPayment = {
        id: 'payment_123',
        contractId,
        amount: 500000,
        status: 'COMPLETED',
        transactionId: 'khipu_tx_123',
        paymentMethod: 'KHIPU',
        description: paymentData.description,
        createdAt: new Date(),
        paidAt: new Date(),
      };

      (db.contract.findUnique as jest.Mock).mockResolvedValue(mockContract);
      (db.payment.create as jest.Mock).mockResolvedValue(mockPayment);

      const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
        headers: { 'Content-Type': 'application/json' },
      });

      const paymentResponse = await processPaymentHandler(paymentRequest);
      const paymentResult = await paymentResponse.json();

      expect(paymentResponse.status).toBe(200);
      expect(paymentResult.success).toBe(true);
      expect(paymentResult.data.payment.status).toBe('COMPLETED');
      expect(paymentResult.data.payment.amount).toBe(500000);

      console.log('✅ Pago mensual procesado exitosamente');

      // 3. PASO 2: Calcular comisión por el pago recibido
      console.log('🧮 Paso 2: Calculando comisión por pago recibido...');

      (db.systemSetting.findUnique as jest.Mock).mockResolvedValue(mockCommissionConfig);
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: brokerId,
        role: 'BROKER',
        isActive: true,
      });

      // Mock de cálculo de comisión
      const mockCommission = {
        id: 'commission_123',
        contractId,
        brokerId,
        amount: 25000, // 5% de 500000
        baseCommission: 25000,
        bonuses: [],
        deductions: [],
        totalCommission: 25000,
        status: 'CALCULATED',
        period: '2024-02',
        createdAt: new Date(),
      };

      (db.payout.create as jest.Mock).mockResolvedValue({
        ...mockCommission,
        recipientId: brokerId,
        recipientType: 'broker',
        description: `Comisión por contrato ${contractId} - ${mockCommission.period}`,
      });

      const calculateCommissionRequest = new NextRequest('http://localhost:3000/api/admin/commissions', {
        method: 'POST',
        body: JSON.stringify({
          contractId,
          paymentId: 'payment_123',
          period: '2024-02',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const calculateResponse = await calculateCommissionHandler(calculateCommissionRequest);
      const calculateResult = await calculateResponse.json();

      expect(calculateResponse.status).toBe(200);
      expect(calculateResult.success).toBe(true);
      expect(calculateResult.data.commission.amount).toBe(25000);
      expect(calculateResult.data.commission.brokerId).toBe(brokerId);

      console.log('✅ Comisión calculada exitosamente');

      // 4. PASO 3: Procesar payout de la comisión
      console.log('💰 Paso 3: Procesando payout de comisión...');

      (db.bankAccount.findMany as jest.Mock).mockResolvedValue([mockBrokerAccount]);
      (db.payout.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'commission_123',
          recipientId: brokerId,
          recipientType: 'broker',
          amount: 25000,
          status: 'PENDING',
          description: 'Comisión por contrato contract_123',
        }
      ]);

      // Mock de procesamiento exitoso
      const processedPayout = {
        id: 'commission_123',
        status: 'COMPLETED',
        transactionId: 'bank_tx_123',
        processedAt: new Date(),
        bankAccountId: mockBrokerAccount.id,
      };

      (db.payout.update as jest.Mock).mockResolvedValue(processedPayout);

      const payoutRequest = new NextRequest('http://localhost:3000/api/admin/payouts/process', {
        method: 'POST',
        body: JSON.stringify({
          payoutIds: ['commission_123'],
          priority: 'normal',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const payoutResponse = await processPayoutHandler(payoutRequest);
      const payoutResult = await payoutResponse.json();

      expect(payoutResponse.status).toBe(200);
      expect(payoutResult.success).toBe(true);
      expect(payoutResult.data.totalProcessed).toBe(1);
      expect(payoutResult.data.totalAmount).toBe(25000);

      console.log('✅ Payout procesado exitosamente');

      // 5. PASO 4: Verificar estadísticas del broker
      console.log('📊 Paso 4: Verificando estadísticas del broker...');

      const mockCommissionStats = [
        {
          id: 'commission_123',
          amount: 25000,
          status: 'COMPLETED',
          createdAt: new Date('2024-02-01'),
        }
      ];

      const mockContracts = [mockContract];

      (db.payout.findMany as jest.Mock).mockResolvedValue(mockCommissionStats);
      (db.contract.findMany as jest.Mock).mockResolvedValue(mockContracts);

      const statsRequest = new NextRequest('http://localhost:3000/api/broker/commissions', {
        method: 'GET',
      });

      const statsResponse = await getCommissionStatsHandler(statsRequest);
      const statsResult = await statsResponse.json();

      expect(statsResponse.status).toBe(200);
      expect(statsResult.success).toBe(true);
      expect(statsResult.data.totalEarned).toBe(25000);
      expect(statsResult.data.totalPaid).toBe(25000);
      expect(statsResult.data.activeContracts).toBe(1);

      console.log('✅ Estadísticas verificadas exitosamente');

      // 6. VERIFICACIONES FINALES
      console.log('🔐 Verificando integridad del flujo financiero...');

      // Verificar que se creó registro de auditoría para el pago
      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'PAYMENT_COMPLETED',
          entityType: 'PAYMENT',
          entityId: 'payment_123',
        }),
      });

      // Verificar que se creó registro de auditoría para la comisión
      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'COMMISSION_CALCULATED',
          entityType: 'COMMISSION',
          entityId: 'commission_123',
        }),
      });

      // Verificar que se creó registro de auditoría para el payout
      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'PAYOUT_PROCESSED',
          entityType: 'PAYOUT',
          entityId: 'commission_123',
        }),
      });

      // Verificar logging apropiado
      expect(logger.info).toHaveBeenCalledWith(
        'Flujo de pago y comisión completado exitosamente',
        expect.objectContaining({
          contractId,
          paymentId: 'payment_123',
          commissionId: 'commission_123',
          payoutId: 'commission_123',
        })
      );

      console.log('🎉 Flujo completo de pagos y comisiones ejecutado exitosamente!');
    });

    it('debería manejar pagos parciales correctamente', async () => {
      const contractId = 'contract_partial';

      const paymentData = {
        contractId,
        amount: 300000, // Pago parcial
        description: 'Pago parcial arriendo',
        paymentMethod: 'KHIPU',
      };

      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: contractId,
        monthlyRent: 500000,
        status: 'ACTIVE',
      });

      const partialPayment = {
        id: 'payment_partial',
        contractId,
        amount: 300000,
        status: 'PARTIAL',
        transactionId: 'khipu_partial_tx',
        createdAt: new Date(),
      };

      (db.payment.create as jest.Mock).mockResolvedValue(partialPayment);

      const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
        headers: { 'Content-Type': 'application/json' },
      });

      const paymentResponse = await processPaymentHandler(paymentRequest);
      const paymentResult = await paymentResponse.json();

      expect(paymentResponse.status).toBe(200);
      expect(paymentResult.data.payment.status).toBe('PARTIAL');
      expect(paymentResult.data.payment.amount).toBe(300000);

      // Verificar que se calculó comisión proporcional
      expect(logger.info).toHaveBeenCalledWith(
        'Pago parcial procesado',
        expect.objectContaining({
          contractId,
          amount: 300000,
          remainingAmount: 200000, // 500000 - 300000
        })
      );
    });

    it('debería aplicar bonos y deducciones en cálculos de comisión', async () => {
      const contractId = 'contract_bonus';
      const brokerId = 'broker_bonus';

      // Configuraciones de bono y deducción
      const mockBonusConfig = {
        id: 'bonus_config',
        key: 'exclusive_deal_bonus',
        value: '2', // 2% adicional
      };

      const mockDeductionConfig = {
        id: 'deduction_config',
        key: 'late_payment_deduction',
        value: '1', // 1% deducción
      };

      (db.systemSetting.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: 'commission_config',
          key: 'commission_percentage',
          value: '5',
        })
        .mockResolvedValueOnce(mockBonusConfig)
        .mockResolvedValueOnce(mockDeductionConfig);

      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: contractId,
        brokerId,
        monthlyRent: 500000,
        isExclusive: true,
        hasLatePayment: true,
        status: 'ACTIVE',
      });

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: brokerId,
        role: 'BROKER',
        isActive: true,
      });

      // Cálculo esperado:
      // Base: 500000 * 0.05 = 25000
      // Bono: 500000 * 0.02 = 10000
      // Deducción: 500000 * 0.01 = 5000
      // Total: 25000 + 10000 - 5000 = 30000

      const mockCommission = {
        id: 'commission_bonus',
        contractId,
        brokerId,
        baseCommission: 25000,
        bonuses: [{ type: 'exclusive_deal', amount: 10000 }],
        deductions: [{ type: 'late_payment', amount: 5000 }],
        totalCommission: 30000,
        status: 'CALCULATED',
      };

      (db.payout.create as jest.Mock).mockResolvedValue(mockCommission);

      const calculateRequest = new NextRequest('http://localhost:3000/api/admin/commissions', {
        method: 'POST',
        body: JSON.stringify({
          contractId,
          period: '2024-02',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const calculateResponse = await calculateCommissionHandler(calculateRequest);
      const calculateResult = await calculateResponse.json();

      expect(calculateResponse.status).toBe(200);
      expect(calculateResult.data.commission.baseCommission).toBe(25000);
      expect(calculateResult.data.commission.bonuses).toHaveLength(1);
      expect(calculateResult.data.commission.deductions).toHaveLength(1);
      expect(calculateResult.data.commission.totalCommission).toBe(30000);

      // Verificar que se aplicaron correctamente
      expect(calculateResult.data.commission.bonuses[0].amount).toBe(10000);
      expect(calculateResult.data.commission.deductions[0].amount).toBe(5000);
    });
  });

  describe('Validaciones Financieras', () => {
    it('debería rechazar pagos duplicados', async () => {
      const contractId = 'contract_duplicate';
      const reference = 'PAY_2024_02_DUPLICATE';

      // Mock de pago ya existente con misma referencia
      (db.payment.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing_payment',
        contractId,
        reference,
        amount: 500000,
        status: 'COMPLETED',
      });

      const duplicatePaymentData = {
        contractId,
        amount: 500000,
        description: 'Pago duplicado',
        paymentMethod: 'KHIPU',
        reference,
      };

      const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify(duplicatePaymentData),
        headers: { 'Content-Type': 'application/json' },
      });

      const paymentResponse = await processPaymentHandler(paymentRequest);
      const paymentResult = await paymentResponse.json();

      expect(paymentResponse.status).toBe(409);
      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toContain('duplicado');
    });

    it('debería validar montos de pago contra contrato', async () => {
      const contractId = 'contract_validation';

      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: contractId,
        monthlyRent: 500000,
        status: 'ACTIVE',
      });

      const invalidPaymentData = {
        contractId,
        amount: 1000000, // Monto excesivo (doble del contrato)
        description: 'Pago con monto inválido',
        paymentMethod: 'KHIPU',
      };

      const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify(invalidPaymentData),
        headers: { 'Content-Type': 'application/json' },
      });

      const paymentResponse = await processPaymentHandler(paymentRequest);
      const paymentResult = await paymentResponse.json();

      expect(paymentResponse.status).toBe(400);
      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toContain('monto');
    });

    it('debería manejar fallos de integración bancaria', async () => {
      const contractId = 'contract_bank_error';

      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: contractId,
        monthlyRent: 500000,
        status: 'ACTIVE',
      });

      // Mock de fallo bancario
      const paymentData = {
        contractId,
        amount: 500000,
        description: 'Pago con error bancario',
        paymentMethod: 'KHIPU',
      };

      // Simular error de integración
      (db.payment.create as jest.Mock).mockRejectedValue(new Error('Bank integration failed'));

      const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
        headers: { 'Content-Type': 'application/json' },
      });

      const paymentResponse = await processPaymentHandler(paymentRequest);
      const paymentResult = await paymentResponse.json();

      expect(paymentResponse.status).toBe(500);
      expect(paymentResult.success).toBe(false);

      // Verificar que se registró el error
      expect(logger.error).toHaveBeenCalledWith(
        'Error procesando pago',
        expect.objectContaining({
          contractId,
          amount: 500000,
          error: 'Bank integration failed',
        })
      );
    });
  });

  describe('Reportes y Auditoría', () => {
    it('debería generar reportes de comisiones por período', async () => {
      const brokerId = 'broker_reports';

      const mockCommissions = [
        {
          id: 'comm_1',
          amount: 25000,
          status: 'COMPLETED',
          createdAt: new Date('2024-01-15'),
          contract: { property: { city: 'Santiago' } },
        },
        {
          id: 'comm_2',
          amount: 30000,
          status: 'COMPLETED',
          createdAt: new Date('2024-02-15'),
          contract: { property: { city: 'Providencia' } },
        },
      ];

      (db.payout.findMany as jest.Mock).mockResolvedValue(mockCommissions);
      (db.payout.count as jest.Mock).mockResolvedValue(2);

      const reportRequest = new NextRequest(
        'http://localhost:3000/api/broker/commissions?startDate=2024-01-01&endDate=2024-02-28',
        { method: 'GET' }
      );

      const reportResponse = await getCommissionStatsHandler(reportRequest);
      const reportResult = await reportResponse.json();

      expect(reportResponse.status).toBe(200);
      expect(reportResult.success).toBe(true);
      expect(reportResult.data.totalEarned).toBe(55000);
      expect(reportResult.data.commissions).toHaveLength(2);
      expect(reportResult.data.periodSummary).toBeDefined();
    });

    it('debería auditar todas las operaciones financieras', async () => {
      const contractId = 'contract_audit';

      // Procesar pago
      const paymentData = {
        contractId,
        amount: 500000,
        description: 'Pago auditado',
      };

      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: contractId,
        monthlyRent: 500000,
        status: 'ACTIVE',
      });

      (db.payment.create as jest.Mock).mockResolvedValue({
        id: 'payment_audit',
        contractId,
        amount: 500000,
        status: 'COMPLETED',
      });

      const paymentRequest = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
        headers: { 'Content-Type': 'application/json' },
      });

      await processPaymentHandler(paymentRequest);

      // Verificar que se creó registro de auditoría
      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'PAYMENT_COMPLETED',
          entityType: 'PAYMENT',
          entityId: 'payment_audit',
          details: expect.objectContaining({
            amount: 500000,
            contractId,
          }),
        }),
      });
    });
  });
});
