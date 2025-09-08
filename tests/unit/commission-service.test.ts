import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CommissionService } from '../../src/lib/commission-service';
import { db } from '../../src/lib/db';
import { logger } from '../../src/lib/logger';
import { BusinessLogicError } from '../../src/lib/errors';

describe('CommissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCommissionConfig', () => {
    it('debería retornar configuración de comisión correctamente', async () => {
      const mockConfig = {
        id: 'config_1',
        key: 'commission_percentage',
        value: '5',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.systemSetting.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await CommissionService.getCommissionConfig();

      expect(result).toEqual(mockConfig);
      expect(db.systemSetting.findUnique).toHaveBeenCalledWith({
        where: { key: 'commission_percentage' },
      });
    });

    it('debería manejar configuración faltante', async () => {
      (db.systemSetting.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(CommissionService.getCommissionConfig())
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe('calculateCommission', () => {
    it('debería calcular comisión base correctamente', async () => {
      const mockContract = {
        id: 'contract_1',
        monthlyRent: 500000,
        brokerId: 'broker_123',
        status: 'ACTIVE',
      };

      const mockConfig = {
        id: 'config_1',
        key: 'commission_percentage',
        value: '5',
      };

      (db.systemSetting.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await CommissionService.calculateCommission(mockContract);

      expect(result.baseCommission).toBe(25000); // 500000 * 0.05
      expect(result.totalCommission).toBe(25000);
      expect(result.brokerId).toBe('broker_123');
      expect(result.contractId).toBe('contract_1');
    });

    it('debería aplicar bonos correctamente', async () => {
      const mockContract = {
        id: 'contract_1',
        monthlyRent: 500000,
        brokerId: 'broker_123',
        status: 'ACTIVE',
        isExclusive: true,
      };

      const mockConfig = {
        id: 'config_1',
        key: 'commission_percentage',
        value: '5',
      };

      const mockBonusConfig = {
        id: 'bonus_config',
        key: 'exclusive_deal_bonus',
        value: '2',
      };

      (db.systemSetting.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockConfig)
        .mockResolvedValueOnce(mockBonusConfig);

      const result = await CommissionService.calculateCommission(mockContract);

      expect(result.baseCommission).toBe(25000); // 500000 * 0.05
      expect(result.bonuses).toContainEqual({
        type: 'exclusive_deal',
        amount: 10000, // 500000 * 0.02
        description: 'Bono por trato exclusivo',
      });
      expect(result.totalCommission).toBe(35000); // 25000 + 10000
    });

    it('debería aplicar deducciones correctamente', async () => {
      const mockContract = {
        id: 'contract_1',
        monthlyRent: 500000,
        brokerId: 'broker_123',
        status: 'ACTIVE',
        hasDiscount: true,
      };

      const mockConfig = {
        id: 'config_1',
        key: 'commission_percentage',
        value: '5',
      };

      const mockDeductionConfig = {
        id: 'deduction_config',
        key: 'discount_deduction',
        value: '1',
      };

      (db.systemSetting.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockConfig)
        .mockResolvedValueOnce(mockDeductionConfig);

      const result = await CommissionService.calculateCommission(mockContract);

      expect(result.baseCommission).toBe(25000);
      expect(result.deductions).toContainEqual({
        type: 'discount',
        amount: 5000, // 500000 * 0.01
        description: 'Deducción por descuento aplicado',
      });
      expect(result.totalCommission).toBe(20000); // 25000 - 5000
    });

    it('debería manejar contratos sin broker', async () => {
      const mockContract = {
        id: 'contract_1',
        monthlyRent: 500000,
        brokerId: null,
        status: 'ACTIVE',
      };

      await expect(CommissionService.calculateCommission(mockContract))
        .rejects.toThrow(BusinessLogicError);
    });

    it('debería manejar contratos inactivos', async () => {
      const mockContract = {
        id: 'contract_1',
        monthlyRent: 500000,
        brokerId: 'broker_123',
        status: 'TERMINATED',
      };

      await expect(CommissionService.calculateCommission(mockContract))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe('generateCommissionPayout', () => {
    it('debería generar payout de comisión correctamente', async () => {
      const mockCommissionData = {
        contractId: 'contract_1',
        brokerId: 'broker_123',
        totalCommission: 25000,
        baseCommission: 25000,
        bonuses: [],
        deductions: [],
      };

      const mockPayout = {
        id: 'payout_1',
        recipientId: 'broker_123',
        recipientType: 'broker',
        amount: 25000,
        currency: 'CLP',
        status: 'pending',
        description: 'Comisión por contrato contract_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.payout.create as jest.Mock).mockResolvedValue(mockPayout);

      const result = await CommissionService.generateCommissionPayout(mockCommissionData);

      expect(result).toEqual(mockPayout);
      expect(db.payout.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: 'broker_123',
          recipientType: 'broker',
          amount: 25000,
          description: expect.stringContaining('contract_1'),
        }),
      });
    });

    it('debería manejar errores de base de datos', async () => {
      const mockCommissionData = {
        contractId: 'contract_1',
        brokerId: 'broker_123',
        totalCommission: 25000,
      };

      (db.payout.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(CommissionService.generateCommissionPayout(mockCommissionData))
        .rejects.toThrow();
    });
  });

  describe('processCommissionPayment', () => {
    it('debería procesar pago de comisión exitosamente', async () => {
      const mockPayout = {
        id: 'payout_1',
        recipientId: 'broker_123',
        amount: 25000,
        status: 'pending',
      };

      const mockProcessedPayout = {
        ...mockPayout,
        status: 'completed',
        transactionId: 'tx_123',
        processedAt: new Date(),
      };

      (db.payout.update as jest.Mock).mockResolvedValue(mockProcessedPayout);

      const result = await CommissionService.processCommissionPayment(mockPayout);

      expect(result).toEqual(mockProcessedPayout);
      expect(db.payout.update).toHaveBeenCalledWith({
        where: { id: 'payout_1' },
        data: expect.objectContaining({
          status: 'completed',
          transactionId: expect.any(String),
          processedAt: expect.any(Date),
        }),
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Pago de comisión procesado exitosamente',
        expect.objectContaining({ payoutId: 'payout_1' })
      );
    });

    it('debería manejar errores de procesamiento', async () => {
      const mockPayout = {
        id: 'payout_1',
        recipientId: 'broker_123',
        amount: 25000,
      };

      (db.payout.update as jest.Mock).mockRejectedValue(new Error('Processing error'));

      await expect(CommissionService.processCommissionPayment(mockPayout))
        .rejects.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getBrokerCommissionStats', () => {
    it('debería retornar estadísticas de comisión del broker', async () => {
      const mockBroker = {
        id: 'broker_123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
      };

      const mockCommissions = [
        { id: 'comm_1', amount: 25000, status: 'paid', createdAt: new Date() },
        { id: 'comm_2', amount: 30000, status: 'pending', createdAt: new Date() },
      ];

      const mockContracts = [
        { id: 'contract_1', monthlyRent: 500000, status: 'ACTIVE' },
        { id: 'contract_2', monthlyRent: 600000, status: 'ACTIVE' },
      ];

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockBroker);
      (db.payout.findMany as jest.Mock).mockResolvedValue(mockCommissions);
      (db.contract.findMany as jest.Mock).mockResolvedValue(mockContracts);

      const result = await CommissionService.getBrokerCommissionStats('broker_123');

      expect(result.brokerId).toBe('broker_123');
      expect(result.totalEarned).toBe(55000); // 25000 + 30000
      expect(result.totalPaid).toBe(25000);
      expect(result.totalPending).toBe(30000);
      expect(result.activeContracts).toBe(2);
      expect(result.monthlyPotential).toBe(55000); // (500000 + 600000) * 0.05
    });

    it('debería manejar broker no encontrado', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(CommissionService.getBrokerCommissionStats('invalid_broker'))
        .rejects.toThrow(BusinessLogicError);
    });

    it('debería manejar broker sin contratos', async () => {
      const mockBroker = {
        id: 'broker_123',
        name: 'Juan Pérez',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockBroker);
      (db.payout.findMany as jest.Mock).mockResolvedValue([]);
      (db.contract.findMany as jest.Mock).mockResolvedValue([]);

      const result = await CommissionService.getBrokerCommissionStats('broker_123');

      expect(result.totalEarned).toBe(0);
      expect(result.activeContracts).toBe(0);
      expect(result.monthlyPotential).toBe(0);
    });
  });

  describe('calculateBonus', () => {
    it('debería calcular bono por trato exclusivo', async () => {
      const mockContract = {
        id: 'contract_1',
        monthlyRent: 500000,
        isExclusive: true,
      };

      const mockBonusConfig = {
        id: 'bonus_1',
        key: 'exclusive_deal_bonus',
        value: '2',
      };

      (db.systemSetting.findUnique as jest.Mock).mockResolvedValue(mockBonusConfig);

      const result = await CommissionService.calculateBonus(mockContract);

      expect(result).toContainEqual({
        type: 'exclusive_deal',
        amount: 10000, // 500000 * 0.02
        description: 'Bono por trato exclusivo',
      });
    });

    it('debería calcular bono por volumen alto', async () => {
      const mockContract = {
        id: 'contract_1',
        monthlyRent: 2000000, // Alto valor
        isExclusive: false,
      };

      const mockBonusConfig = {
        id: 'bonus_1',
        key: 'high_value_bonus',
        value: '1',
      };

      (db.systemSetting.findUnique as jest.Mock).mockResolvedValue(mockBonusConfig);

      const result = await CommissionService.calculateBonus(mockContract);

      expect(result).toContainEqual({
        type: 'high_value',
        amount: 20000, // 2000000 * 0.01
        description: 'Bono por contrato de alto valor',
      });
    });

    it('debería retornar array vacío sin bonos aplicables', async () => {
      const mockContract = {
        id: 'contract_1',
        monthlyRent: 300000,
        isExclusive: false,
      };

      const result = await CommissionService.calculateBonus(mockContract);

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateDeduction', () => {
    it('debería calcular deducción por descuento aplicado', async () => {
      const mockContract = {
        id: 'contract_1',
        monthlyRent: 500000,
        hasDiscount: true,
      };

      const mockDeductionConfig = {
        id: 'deduction_1',
        key: 'discount_deduction',
        value: '1',
      };

      (db.systemSetting.findUnique as jest.Mock).mockResolvedValue(mockDeductionConfig);

      const result = await CommissionService.calculateDeduction(mockContract);

      expect(result).toContainEqual({
        type: 'discount',
        amount: 5000, // 500000 * 0.01
        description: 'Deducción por descuento aplicado',
      });
    });

    it('debería calcular deducción por contrato corto', async () => {
      const mockContract = {
        id: 'contract_1',
        monthlyRent: 500000,
        hasDiscount: false,
        duration: 3, // Menos de 6 meses
      };

      const mockDeductionConfig = {
        id: 'deduction_1',
        key: 'short_contract_deduction',
        value: '0.5',
      };

      (db.systemSetting.findUnique as jest.Mock).mockResolvedValue(mockDeductionConfig);

      const result = await CommissionService.calculateDeduction(mockContract);

      expect(result).toContainEqual({
        type: 'short_contract',
        amount: 2500, // 500000 * 0.005
        description: 'Deducción por contrato corto',
      });
    });

    it('debería retornar array vacío sin deducciones aplicables', async () => {
      const mockContract = {
        id: 'contract_1',
        monthlyRent: 500000,
        hasDiscount: false,
        duration: 12,
      };

      const result = await CommissionService.calculateDeduction(mockContract);

      expect(result).toHaveLength(0);
    });
  });

  describe('notifyCommissionCalculated', () => {
    it('debería enviar notificación de comisión calculada', async () => {
      const mockCommissionData = {
        contractId: 'contract_1',
        brokerId: 'broker_123',
        totalCommission: 25000,
      };

      jest.doMock('../../src/lib/notification-service', () => ({
        NotificationService: {
          notifyCommissionCalculated: jest.fn().mockResolvedValue(true),
        },
      }));

      await CommissionService.notifyCommissionCalculated(mockCommissionData);

      expect(logger.info).toHaveBeenCalledWith(
        'Notificación de comisión enviada',
        expect.objectContaining({
          brokerId: 'broker_123',
          contractId: 'contract_1',
          amount: 25000,
        })
      );
    });

    it('debería manejar errores de notificación', async () => {
      const mockCommissionData = {
        contractId: 'contract_1',
        brokerId: 'broker_123',
        totalCommission: 25000,
      };

      jest.doMock('../../src/lib/notification-service', () => ({
        NotificationService: {
          notifyCommissionCalculated: jest.fn().mockRejectedValue(new Error('Notification failed')),
        },
      }));

      await expect(CommissionService.notifyCommissionCalculated(mockCommissionData))
        .rejects.toThrow();
    });
  });

  describe('notifyCommissionPaid', () => {
    it('debería enviar notificación de comisión pagada', async () => {
      const mockPayout = {
        id: 'payout_1',
        recipientId: 'broker_123',
        amount: 25000,
        transactionId: 'tx_123',
      };

      jest.doMock('../../src/lib/notification-service', () => ({
        NotificationService: {
          notifyCommissionPaid: jest.fn().mockResolvedValue(true),
        },
      }));

      await CommissionService.notifyCommissionPaid(mockPayout);

      expect(logger.info).toHaveBeenCalledWith(
        'Notificación de pago de comisión enviada',
        expect.objectContaining({
          payoutId: 'payout_1',
          brokerId: 'broker_123',
          amount: 25000,
        })
      );
    });
  });
});
