import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PayoutService } from '../../src/lib/payout-service';
import { db } from '../../src/lib/db';
import { BusinessLogicError } from '../../src/lib/errors';

describe('PayoutService - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePendingPayouts', () => {
    it('debería calcular payouts correctamente para brokers', async () => {
      // Mock de contratos con comisiones pendientes
      const mockContracts = [
        {
          id: 'contract_1',
          brokerId: 'broker_123',
          monthlyRent: 500000,
          status: 'ACTIVE',
          startDate: new Date('2024-01-01'),
          createdAt: new Date(),
        }
      ];

      // Mock de configuraciones de comisión
      const mockCommissionConfig = {
        id: 'config_1',
        key: 'commission_percentage',
        value: '5',
      };

      (db.contract.findMany as jest.Mock).mockResolvedValue(mockContracts);
      (db.systemSetting.findUnique as jest.Mock).mockResolvedValue(mockCommissionConfig);
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'broker_123',
        role: 'BROKER',
        isActive: true,
      });

      const result = await PayoutService.calculatePendingPayouts('broker');

      expect(result).toHaveLength(1);
      expect(result[0].recipientId).toBe('broker_123');
      expect(result[0].recipientType).toBe('broker');
      expect(result[0].amount).toBe(25000); // 500000 * 0.05
      expect(result[0].status).toBe('pending');
    });

    it('debería retornar array vacío cuando no hay contratos', async () => {
      (db.contract.findMany as jest.Mock).mockResolvedValue([]);

      const result = await PayoutService.calculatePendingPayouts('broker');

      expect(result).toHaveLength(0);
    });

    it('debería validar recipientType válido', async () => {
      await expect(PayoutService.calculatePendingPayouts('invalid'))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe('validateKYCEligibility', () => {
    it('debería validar KYC exitosamente para usuario completo', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'VERIFIED',
        kycLevel: 'FULL',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        addressVerified: true,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await PayoutService.validateKYCEligibility('user_123');

      expect(result).toBeUndefined(); // No debería lanzar error
    });

    it('debería rechazar usuario sin KYC', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'PENDING',
        isActive: true,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(PayoutService.validateKYCEligibility('user_123'))
        .rejects.toThrow(BusinessLogicError);
    });

    it('debería rechazar usuario inactivo', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'VERIFIED',
        isActive: false,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(PayoutService.validateKYCEligibility('user_123'))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe('getRecipientBankAccount', () => {
    it('debería retornar cuenta primaria verificada', async () => {
      const mockAccounts = [
        {
          id: 'ba_1',
          userId: 'user_123',
          isPrimary: false,
          isVerified: true,
          bankCode: '012',
        },
        {
          id: 'ba_2',
          userId: 'user_123',
          isPrimary: true,
          isVerified: true,
          bankCode: '012',
        }
      ];

      (db.bankAccount.findMany as jest.Mock).mockResolvedValue(mockAccounts);

      const result = await PayoutService.getRecipientBankAccount('user_123');

      expect(result?.id).toBe('ba_2');
    });

    it('debería retornar null si no hay cuentas verificadas', async () => {
      const mockAccounts = [
        {
          id: 'ba_1',
          userId: 'user_123',
          isPrimary: false,
          isVerified: false,
          bankCode: '012',
        }
      ];

      (db.bankAccount.findMany as jest.Mock).mockResolvedValue(mockAccounts);

      const result = await PayoutService.getRecipientBankAccount('user_123');

      expect(result).toBeNull();
    });
  });

  describe('recordPayout', () => {
    it('debería registrar payout exitosamente', async () => {
      const mockPayout = {
        id: 'payout_1',
        recipientId: 'user_123',
        amount: 100000,
        status: 'completed',
      };

      const mockTransferResult = {
        success: true,
        transactionId: 'tx_123',
        errorMessage: null,
      };

      (db.payout.create as jest.Mock).mockResolvedValue({
        id: 'payout_record_1',
        ...mockPayout,
        transactionId: 'tx_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await PayoutService.recordPayout(
        mockPayout,
        'batch_1',
        mockTransferResult,
        {}
      );

      expect(result).toBeDefined();
      expect(db.payout.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'payout_1',
          recipientId: 'user_123',
          amount: 100000,
          status: 'completed',
          transactionId: 'tx_123',
        }),
      });
    });
  });
});
