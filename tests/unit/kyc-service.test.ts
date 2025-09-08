import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { KYCService } from '../../src/lib/kyc-service';
import { db } from '../../src/lib/db';
import { logger } from '../../src/lib/logger';
import { BusinessLogicError } from '../../src/lib/errors';

describe('KYCService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canReceivePayouts', () => {
    it('debería permitir payouts para usuario con KYC completo', async () => {
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

      const result = await KYCService.canReceivePayouts('user_123');

      expect(result.canReceive).toBe(true);
      expect(result.currentLevel).toBe('FULL');
      expect(result.reason).toBeUndefined();
    });

    it('debería permitir payouts para usuario con KYC básico', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'VERIFIED',
        kycLevel: 'BASIC',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        addressVerified: false,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await KYCService.canReceivePayouts('user_123');

      expect(result.canReceive).toBe(true);
      expect(result.currentLevel).toBe('BASIC');
    });

    it('debería rechazar payouts para usuario sin KYC', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'PENDING',
        kycLevel: null,
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
        identityVerified: false,
        addressVerified: false,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await KYCService.canReceivePayouts('user_123');

      expect(result.canReceive).toBe(false);
      expect(result.reason).toBe('KYC no completado');
      expect(result.requiredSteps).toContain('Verificación de email');
      expect(result.requiredSteps).toContain('Verificación de teléfono');
      expect(result.requiredSteps).toContain('Verificación de identidad');
    });

    it('debería rechazar payouts para usuario inactivo', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'VERIFIED',
        kycLevel: 'FULL',
        isActive: false,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        addressVerified: true,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await KYCService.canReceivePayouts('user_123');

      expect(result.canReceive).toBe(false);
      expect(result.reason).toBe('Usuario inactivo');
    });

    it('debería rechazar payouts para usuario suspendido', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'SUSPENDED',
        kycLevel: 'FULL',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        addressVerified: true,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await KYCService.canReceivePayouts('user_123');

      expect(result.canReceive).toBe(false);
      expect(result.reason).toBe('Cuenta suspendida');
    });

    it('debería manejar usuario no encontrado', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(KYCService.canReceivePayouts('invalid_user'))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe('initiateKYC', () => {
    it('debería iniciar proceso KYC correctamente', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'PENDING',
        email: 'user@example.com',
      };

      const mockKYCRequest = {
        id: 'kyc_123',
        userId: 'user_123',
        status: 'INITIATED',
        provider: 'trustfactory',
        sessionId: 'session_123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.signatureRequest.create as jest.Mock).mockResolvedValue(mockKYCRequest);

      const result = await KYCService.initiateKYC('user_123');

      expect(result).toEqual(mockKYCRequest);
      expect(db.signatureRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          type: 'KYC_VERIFICATION',
          status: 'INITIATED',
          provider: 'trustfactory',
        }),
      });
      expect(logger.info).toHaveBeenCalledWith(
        'KYC iniciado exitosamente',
        expect.objectContaining({ userId: 'user_123' })
      );
    });

    it('debería rechazar KYC ya completado', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'VERIFIED',
        kycLevel: 'FULL',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(KYCService.initiateKYC('user_123'))
        .rejects.toThrow(BusinessLogicError);
    });

    it('debería manejar errores de proveedor externo', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'PENDING',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.signatureRequest.create as jest.Mock).mockRejectedValue(new Error('External API error'));

      await expect(KYCService.initiateKYC('user_123'))
        .rejects.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('verifyDocument', () => {
    it('debería verificar documento exitosamente', async () => {
      const mockDocumentData = {
        type: 'CEDULA',
        number: '12345678-9',
        frontImage: 'data:image/jpeg;base64,...',
        backImage: 'data:image/jpeg;base64,...',
      };

      const mockVerification = {
        id: 'ver_123',
        userId: 'user_123',
        documentType: 'CEDULA',
        documentNumber: '12345678-9',
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verificationData: {
          confidence: 0.95,
          extractedData: {
            name: 'Juan Pérez',
            documentNumber: '12345678-9',
          },
        },
      };

      (db.signatureSigner.create as jest.Mock).mockResolvedValue(mockVerification);

      const result = await KYCService.verifyDocument('user_123', mockDocumentData);

      expect(result).toEqual(mockVerification);
      expect(db.signatureSigner.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          documentType: 'CEDULA',
          documentNumber: '12345678-9',
          status: 'VERIFIED',
        }),
      });
    });

    it('debería rechazar documento inválido', async () => {
      const mockDocumentData = {
        type: 'CEDULA',
        number: 'invalid-number',
        frontImage: 'data:image/jpeg;base64,...',
      };

      // Mock de validación fallida
      jest.doMock('../../src/lib/external-services', () => ({
        validateDocument: jest.fn().mockResolvedValue({
          valid: false,
          reason: 'Número de documento inválido',
          confidence: 0.1,
        }),
      }));

      await expect(KYCService.verifyDocument('user_123', mockDocumentData))
        .rejects.toThrow(BusinessLogicError);
    });

    it('debería manejar errores de procesamiento de imagen', async () => {
      const mockDocumentData = {
        type: 'CEDULA',
        number: '12345678-9',
        frontImage: 'invalid-base64',
      };

      await expect(KYCService.verifyDocument('user_123', mockDocumentData))
        .rejects.toThrow();
    });
  });

  describe('verifyAddress', () => {
    it('debería verificar dirección exitosamente', async () => {
      const mockAddressData = {
        street: 'Avenida Providencia 123',
        city: 'Santiago',
        commune: 'Providencia',
        region: 'Metropolitana',
        postalCode: '7500000',
        country: 'CL',
        proofDocument: 'data:image/jpeg;base64,...',
      };

      const mockVerification = {
        id: 'addr_ver_123',
        userId: 'user_123',
        type: 'ADDRESS',
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verificationData: {
          formattedAddress: 'Avenida Providencia 123, Providencia, Santiago',
          geolocation: {
            lat: -33.4489,
            lng: -70.6693,
          },
        },
      };

      (db.signatureSigner.create as jest.Mock).mockResolvedValue(mockVerification);

      const result = await KYCService.verifyAddress('user_123', mockAddressData);

      expect(result).toEqual(mockVerification);
      expect(db.signatureSigner.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          type: 'ADDRESS',
          status: 'VERIFIED',
        }),
      });
    });

    it('debería rechazar dirección incompleta', async () => {
      const mockAddressData = {
        street: '',
        city: 'Santiago',
        commune: '',
      };

      await expect(KYCService.verifyAddress('user_123', mockAddressData))
        .rejects.toThrow(BusinessLogicError);
    });

    it('debería manejar errores de geocodificación', async () => {
      const mockAddressData = {
        street: 'Dirección inexistente 999',
        city: 'Ciudad Inexistente',
        commune: 'Comuna Inexistente',
        country: 'CL',
      };

      // Mock de geocodificación fallida
      jest.doMock('../../src/lib/external-services', () => ({
        geocodeAddress: jest.fn().mockResolvedValue(null),
      }));

      await expect(KYCService.verifyAddress('user_123', mockAddressData))
        .rejects.toThrow();
    });
  });

  describe('verifyEmail', () => {
    it('debería verificar email exitosamente', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        emailVerified: false,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });

      const result = await KYCService.verifyEmail('user_123', 'verification_token_123');

      expect(result).toBe(true);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: expect.objectContaining({
          emailVerified: true,
          emailVerifiedAt: expect.any(Date),
        }),
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Email verificado exitosamente',
        expect.objectContaining({ userId: 'user_123' })
      );
    });

    it('debería rechazar token inválido', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        emailVerified: false,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(KYCService.verifyEmail('user_123', 'invalid_token'))
        .rejects.toThrow(BusinessLogicError);
    });

    it('debería manejar email ya verificado', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await KYCService.verifyEmail('user_123', 'token_123');

      expect(result).toBe(true);
      // No debería actualizar si ya está verificado
      expect(db.user.update).not.toHaveBeenCalled();
    });
  });

  describe('verifyPhone', () => {
    it('debería verificar teléfono exitosamente', async () => {
      const mockUser = {
        id: 'user_123',
        phone: '+56912345678',
        phoneVerified: false,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
      });

      const result = await KYCService.verifyPhone('user_123', '123456');

      expect(result).toBe(true);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: expect.objectContaining({
          phoneVerified: true,
          phoneVerifiedAt: expect.any(Date),
        }),
      });
    });

    it('debería rechazar código incorrecto', async () => {
      const mockUser = {
        id: 'user_123',
        phone: '+56912345678',
        phoneVerified: false,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(KYCService.verifyPhone('user_123', 'wrong_code'))
        .rejects.toThrow(BusinessLogicError);
    });

    it('debería manejar intentos de verificación excedidos', async () => {
      const mockUser = {
        id: 'user_123',
        phone: '+56912345678',
        phoneVerified: false,
        phoneVerificationAttempts: 5,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(KYCService.verifyPhone('user_123', '123456'))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe('getKYCStatus', () => {
    it('debería retornar estado KYC completo', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'VERIFIED',
        kycLevel: 'FULL',
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        addressVerified: true,
        kycCompletedAt: new Date('2024-01-01'),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await KYCService.getKYCStatus('user_123');

      expect(result.status).toBe('VERIFIED');
      expect(result.level).toBe('FULL');
      expect(result.completedAt).toBeDefined();
      expect(result.verifications.email).toBe(true);
      expect(result.verifications.phone).toBe(true);
      expect(result.verifications.identity).toBe(true);
      expect(result.verifications.address).toBe(true);
    });

    it('debería retornar estado KYC parcial', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'IN_PROGRESS',
        kycLevel: 'BASIC',
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        addressVerified: false,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await KYCService.getKYCStatus('user_123');

      expect(result.status).toBe('IN_PROGRESS');
      expect(result.level).toBe('BASIC');
      expect(result.progressPercentage).toBe(75); // 3 de 4 verificaciones
      expect(result.pendingVerifications).toContain('address');
    });

    it('debería manejar usuario sin KYC iniciado', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: null,
        emailVerified: false,
        phoneVerified: false,
        identityVerified: false,
        addressVerified: false,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await KYCService.getKYCStatus('user_123');

      expect(result.status).toBe('NOT_STARTED');
      expect(result.level).toBeNull();
      expect(result.progressPercentage).toBe(0);
      expect(result.pendingVerifications).toHaveLength(4);
    });
  });

  describe('upgradeKYCLevel', () => {
    it('debería actualizar nivel KYC exitosamente', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'VERIFIED',
        kycLevel: 'BASIC',
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        addressVerified: true,
      };

      const updatedUser = {
        ...mockUser,
        kycLevel: 'FULL',
        kycUpgradedAt: new Date(),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await KYCService.upgradeKYCLevel('user_123', 'FULL');

      expect(result).toEqual(updatedUser);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: expect.objectContaining({
          kycLevel: 'FULL',
          kycUpgradedAt: expect.any(Date),
        }),
      });
    });

    it('debería rechazar upgrade sin requisitos completos', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'VERIFIED',
        kycLevel: 'BASIC',
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        addressVerified: false, // Falta verificación de dirección
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(KYCService.upgradeKYCLevel('user_123', 'FULL'))
        .rejects.toThrow(BusinessLogicError);
    });

    it('debería manejar downgrade de nivel', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'VERIFIED',
        kycLevel: 'FULL',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(KYCService.upgradeKYCLevel('user_123', 'BASIC'))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe('resetKYC', () => {
    it('debería resetear KYC exitosamente', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'VERIFIED',
        kycLevel: 'FULL',
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        addressVerified: true,
      };

      const resetUser = {
        ...mockUser,
        kycStatus: 'PENDING',
        kycLevel: null,
        emailVerified: false,
        phoneVerified: false,
        identityVerified: false,
        addressVerified: false,
        kycResetAt: new Date(),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue(resetUser);

      const result = await KYCService.resetKYC('user_123', 'Solicitud del usuario');

      expect(result).toEqual(resetUser);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: expect.objectContaining({
          kycStatus: 'PENDING',
          kycLevel: null,
          emailVerified: false,
          phoneVerified: false,
          identityVerified: false,
          addressVerified: false,
          kycResetAt: expect.any(Date),
          kycResetReason: 'Solicitud del usuario',
        }),
      });
      expect(logger.info).toHaveBeenCalledWith(
        'KYC reseteado exitosamente',
        expect.objectContaining({ userId: 'user_123' })
      );
    });

    it('debería requerir razón para reset', async () => {
      const mockUser = {
        id: 'user_123',
        kycStatus: 'VERIFIED',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(KYCService.resetKYC('user_123', ''))
        .rejects.toThrow(BusinessLogicError);
    });
  });
});
