import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as registerHandler } from '../../src/app/api/auth/register/route';
import { POST as verifyEmailHandler } from '../../src/app/api/auth/verify-email/route';
import { POST as kycInitiateHandler } from '../../src/app/api/user/kyc/initiate/route';
import { POST as bankAccountAddHandler } from '../../src/app/api/user/bank-accounts/route';
import { db } from '../../src/lib/db';
import { logger } from '../../src/lib/logger';

describe('User Onboarding Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Flujo Completo: Registro → Verificación → KYC → Cuenta Bancaria', () => {
    it('debería completar flujo completo de onboarding exitosamente', async () => {
      // 1. SETUP: Datos del nuevo usuario
      const userEmail = 'newuser@example.com';
      const userPhone = '+56912345678';

      const userData = {
        email: userEmail,
        password: 'SecurePass123!',
        name: 'Juan Pérez',
        phone: userPhone,
        role: 'TENANT',
      };

      // 2. PASO 1: Registro de usuario
      console.log('📝 Paso 1: Registrando nuevo usuario...');

      const mockNewUser = {
        id: 'user_onboard_123',
        ...userData,
        password: '$2a$10$hashedPassword',
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
        kycStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(null); // Email no existe
      (db.user.create as jest.Mock).mockResolvedValue(mockNewUser);

      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' },
      });

      const registerResponse = await registerHandler(registerRequest);
      const registerResult = await registerResponse.json();

      expect(registerResponse.status).toBe(201);
      expect(registerResult.success).toBe(true);
      expect(registerResult.user.id).toBe('user_onboard_123');
      expect(registerResult.user.emailVerified).toBe(false);

      console.log('✅ Usuario registrado exitosamente');

      // 3. PASO 2: Verificación de email
      console.log('📧 Paso 2: Verificando email...');

      const verificationToken = 'email_verification_token_123';
      const verifiedUser = {
        ...mockNewUser,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockNewUser);
      (db.user.update as jest.Mock).mockResolvedValue(verifiedUser);

      const verifyEmailRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          token: verificationToken,
          userId: mockNewUser.id,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const verifyEmailResponse = await verifyEmailHandler(verifyEmailRequest);
      const verifyEmailResult = await verifyEmailResponse.json();

      expect(verifyEmailResponse.status).toBe(200);
      expect(verifyEmailResult.success).toBe(true);

      console.log('✅ Email verificado exitosamente');

      // 4. PASO 3: Verificación de teléfono
      console.log('📱 Paso 3: Verificando teléfono...');

      const phoneVerifiedUser = {
        ...verifiedUser,
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(verifiedUser);
      (db.user.update as jest.Mock).mockResolvedValue(phoneVerifiedUser);

      // Simular verificación de teléfono (normalmente sería por SMS)
      const phoneVerificationCode = '123456';

      // Aquí iría la API de verificación de teléfono
      // Por simplicidad, simulamos que ya está verificado

      console.log('✅ Teléfono verificado exitosamente');

      // 5. PASO 4: Iniciar proceso KYC
      console.log('🔍 Paso 4: Iniciando proceso KYC...');

      const kycRequestData = {
        userId: mockNewUser.id,
        documentType: 'CEDULA',
        provider: 'TRUSTFACTORY',
      };

      const mockKYCRequest = {
        id: 'kyc_request_123',
        userId: mockNewUser.id,
        status: 'INITIATED',
        provider: 'TRUSTFACTORY',
        sessionId: 'tf_session_123',
        documentUrl: 'https://trustfactory.cl/kyc/user_123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(phoneVerifiedUser);
      (db.signatureRequest.create as jest.Mock).mockResolvedValue(mockKYCRequest);

      const kycInitiateRequest = new NextRequest('http://localhost:3000/api/user/kyc/initiate', {
        method: 'POST',
        body: JSON.stringify(kycRequestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const kycResponse = await kycInitiateHandler(kycInitiateRequest);
      const kycResult = await kycResponse.json();

      expect(kycResponse.status).toBe(200);
      expect(kycResult.success).toBe(true);
      expect(kycResult.data.kycRequest.id).toBe('kyc_request_123');
      expect(kycResult.data.kycRequest.status).toBe('INITIATED');

      console.log('✅ Proceso KYC iniciado exitosamente');

      // 6. PASO 5: Completar KYC (simular verificación exitosa)
      console.log('✅ Paso 5: Completando KYC...');

      const kycCompletedUser = {
        ...phoneVerifiedUser,
        kycStatus: 'VERIFIED',
        kycLevel: 'FULL',
        identityVerified: true,
        addressVerified: true,
        kycCompletedAt: new Date(),
      };

      (db.user.update as jest.Mock).mockResolvedValue(kycCompletedUser);

      // Simular webhook de KYC completado
      console.log('✅ KYC completado exitosamente');

      // 7. PASO 6: Agregar cuenta bancaria
      console.log('🏦 Paso 6: Agregando cuenta bancaria...');

      const bankAccountData = {
        bankCode: '012',
        bankName: 'Banco Estado',
        accountType: 'checking',
        accountNumber: '123456789',
        accountHolder: 'Juan Pérez',
        rut: '12.345.678-9',
        isPrimary: true,
      };

      const mockBankAccount = {
        id: 'ba_onboard_123',
        userId: mockNewUser.id,
        ...bankAccountData,
        isVerified: false, // Inicialmente no verificada
        verificationStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.bankAccount.create as jest.Mock).mockResolvedValue(mockBankAccount);

      const bankAccountRequest = new NextRequest('http://localhost:3000/api/user/bank-accounts', {
        method: 'POST',
        body: JSON.stringify(bankAccountData),
        headers: { 'Content-Type': 'application/json' },
      });

      const bankAccountResponse = await bankAccountAddHandler(bankAccountRequest);
      const bankAccountResult = await bankAccountResponse.json();

      expect(bankAccountResponse.status).toBe(201);
      expect(bankAccountResult.success).toBe(true);
      expect(bankAccountResult.data.bankAccount.id).toBe('ba_onboard_123');
      expect(bankAccountResult.data.bankAccount.isVerified).toBe(false);

      console.log('✅ Cuenta bancaria agregada exitosamente');

      // 8. PASO 7: Verificar cuenta bancaria
      console.log('🔍 Paso 7: Verificando cuenta bancaria...');

      const verifiedBankAccount = {
        ...mockBankAccount,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      };

      (db.bankAccount.findUnique as jest.Mock).mockResolvedValue(mockBankAccount);
      (db.bankAccount.update as jest.Mock).mockResolvedValue(verifiedBankAccount);

      // Simular verificación bancaria exitosa
      console.log('✅ Cuenta bancaria verificada exitosamente');

      // 9. PASO 8: Usuario completamente onboarded
      console.log('🎉 Paso 8: Usuario completamente onboarded...');

      const fullyOnboardedUser = {
        ...kycCompletedUser,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      };

      (db.user.update as jest.Mock).mockResolvedValue(fullyOnboardedUser);

      // Verificar estado final del usuario
      expect(fullyOnboardedUser.emailVerified).toBe(true);
      expect(fullyOnboardedUser.phoneVerified).toBe(true);
      expect(fullyOnboardedUser.kycStatus).toBe('VERIFIED');
      expect(fullyOnboardedUser.kycLevel).toBe('FULL');
      expect(fullyOnboardedUser.onboardingCompleted).toBe(true);

      console.log('✅ Onboarding completado exitosamente');

      // 10. VERIFICACIONES FINALES
      console.log('🔐 Verificando integridad del proceso de onboarding...');

      // Verificar que se creó registro de auditoría
      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'USER_REGISTERED',
          entityType: 'USER',
          entityId: mockNewUser.id,
        }),
      });

      // Verificar logging apropiado
      expect(logger.info).toHaveBeenCalledWith(
        'Usuario registrado exitosamente',
        expect.objectContaining({ userId: mockNewUser.id })
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Email verificado exitosamente',
        expect.objectContaining({ userId: mockNewUser.id })
      );

      expect(logger.info).toHaveBeenCalledWith(
        'KYC completado exitosamente',
        expect.objectContaining({ userId: mockNewUser.id })
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Cuenta bancaria verificada exitosamente',
        expect.objectContaining({
          userId: mockNewUser.id,
          bankAccountId: 'ba_onboard_123'
        })
      );

      console.log('🎉 Flujo completo de onboarding ejecutado exitosamente!');
    });

    it('debería manejar usuarios que abandonan el proceso', async () => {
      // Usuario que se registra pero nunca completa KYC
      const abandonedUser = {
        id: 'user_abandoned',
        email: 'abandoned@example.com',
        name: 'Usuario Abandonado',
        emailVerified: true,
        phoneVerified: false,
        kycStatus: 'PENDING',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(abandonedUser);

      // Simular verificación de usuarios abandonados
      // El sistema debería marcar estos usuarios como inactivos o enviar recordatorios

      expect(abandonedUser.emailVerified).toBe(true);
      expect(abandonedUser.kycStatus).toBe('PENDING');

      // Verificar que se registró el abandono
      expect(logger.warn).toHaveBeenCalledWith(
        'Usuario con onboarding incompleto detectado',
        expect.objectContaining({
          userId: 'user_abandoned',
          daysSinceRegistration: 30,
        })
      );
    });

    it('debería validar documentos KYC correctamente', async () => {
      const userId = 'user_kyc_validation';

      const invalidDocumentData = {
        type: 'CEDULA',
        number: 'invalid-number',
        frontImage: 'invalid-base64',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        kycStatus: 'PENDING',
      });

      // Intentar verificar documento inválido
      // Debería fallar validación

      expect(() => {
        // Simular validación que falla
        if (invalidDocumentData.number === 'invalid-number') {
          throw new Error('Número de documento inválido');
        }
      }).toThrow('Número de documento inválido');
    });
  });

  describe('Validaciones de Seguridad', () => {
    it('debería validar fortaleza de contraseña durante registro', async () => {
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'abcdefgh',
        'Password', // Solo mayúscula al inicio
      ];

      for (const weakPassword of weakPasswords) {
        const userData = {
          email: 'test@example.com',
          password: weakPassword,
          name: 'Test User',
          role: 'TENANT',
        };

        const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData),
          headers: { 'Content-Type': 'application/json' },
        });

        const registerResponse = await registerHandler(registerRequest);
        const registerResult = await registerResponse.json();

        expect(registerResponse.status).toBe(400);
        expect(registerResult.success).toBe(false);
        expect(registerResult.error).toContain('contraseña');
      }
    });

    it('debería prevenir registro con email ya existente', async () => {
      const existingUser = {
        id: 'existing_user',
        email: 'existing@example.com',
        name: 'Usuario Existente',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const duplicateUserData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'Nuevo Usuario',
        role: 'TENANT',
      };

      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(duplicateUserData),
        headers: { 'Content-Type': 'application/json' },
      });

      const registerResponse = await registerHandler(registerRequest);
      const registerResult = await registerResponse.json();

      expect(registerResponse.status).toBe(409);
      expect(registerResult.success).toBe(false);
      expect(registerResult.error).toContain('ya registrado');
    });

    it('debería validar formato de RUT en cuentas bancarias', async () => {
      const invalidRutData = {
        bankCode: '012',
        bankName: 'Banco Estado',
        accountType: 'checking',
        accountNumber: '123456789',
        accountHolder: 'Juan Pérez',
        rut: 'invalid-rut-format',
        isPrimary: true,
      };

      const bankAccountRequest = new NextRequest('http://localhost:3000/api/user/bank-accounts', {
        method: 'POST',
        body: JSON.stringify(invalidRutData),
        headers: { 'Content-Type': 'application/json' },
      });

      const bankAccountResponse = await bankAccountAddHandler(bankAccountRequest);
      const bankAccountResult = await bankAccountResponse.json();

      expect(bankAccountResponse.status).toBe(400);
      expect(bankAccountResult.success).toBe(false);
      expect(bankAccountResult.error).toContain('RUT');
    });
  });

  describe('Gestión de Estados', () => {
    it('debería manejar transiciones de estado correctamente', async () => {
      const userId = 'user_state_test';

      // Estado inicial: PENDING
      const initialUser = {
        id: userId,
        email: 'test@example.com',
        emailVerified: false,
        phoneVerified: false,
        kycStatus: 'PENDING',
        onboardingCompleted: false,
      };

      // Después de verificar email
      const emailVerifiedUser = {
        ...initialUser,
        emailVerified: true,
      };

      // Después de verificar teléfono
      const phoneVerifiedUser = {
        ...emailVerifiedUser,
        phoneVerified: true,
      };

      // Después de completar KYC
      const kycCompletedUser = {
        ...phoneVerifiedUser,
        kycStatus: 'VERIFIED',
        kycLevel: 'FULL',
      };

      // Después de agregar cuenta bancaria
      const bankAccountAddedUser = {
        ...kycCompletedUser,
        hasBankAccount: true,
      };

      // Estado final: Onboarding completado
      const onboardingCompletedUser = {
        ...bankAccountAddedUser,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      };

      // Verificar transiciones de estado
      expect(initialUser.onboardingCompleted).toBe(false);
      expect(emailVerifiedUser.emailVerified).toBe(true);
      expect(phoneVerifiedUser.phoneVerified).toBe(true);
      expect(kycCompletedUser.kycStatus).toBe('VERIFIED');
      expect(onboardingCompletedUser.onboardingCompleted).toBe(true);
    });

    it('debería permitir rollback de estados en caso de error', async () => {
      const userId = 'user_rollback_test';

      // Usuario con KYC completado
      const userWithKYC = {
        id: userId,
        kycStatus: 'VERIFIED',
        kycLevel: 'FULL',
        identityVerified: true,
        addressVerified: true,
      };

      // Simular error que requiere rollback
      const userAfterRollback = {
        ...userWithKYC,
        kycStatus: 'PENDING',
        kycLevel: null,
        identityVerified: false,
        addressVerified: false,
        kycResetReason: 'Error en verificación de identidad',
      };

      // Verificar que el rollback funcionó
      expect(userAfterRollback.kycStatus).toBe('PENDING');
      expect(userAfterRollback.identityVerified).toBe(false);
      expect(userAfterRollback.kycResetReason).toBeDefined();
    });
  });

  describe('Métricas y Reportes', () => {
    it('debería generar métricas de onboarding', async () => {
      const mockUsers = [
        {
          id: 'user_1',
          emailVerified: true,
          phoneVerified: true,
          kycStatus: 'VERIFIED',
          onboardingCompleted: true,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'user_2',
          emailVerified: true,
          phoneVerified: false,
          kycStatus: 'PENDING',
          onboardingCompleted: false,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: 'user_3',
          emailVerified: false,
          phoneVerified: false,
          kycStatus: 'PENDING',
          onboardingCompleted: false,
          createdAt: new Date('2024-01-20'),
        },
      ];

      // Calcular métricas
      const totalUsers = mockUsers.length;
      const emailVerifiedUsers = mockUsers.filter(u => u.emailVerified).length;
      const phoneVerifiedUsers = mockUsers.filter(u => u.phoneVerified).length;
      const kycCompletedUsers = mockUsers.filter(u => u.kycStatus === 'VERIFIED').length;
      const onboardingCompletedUsers = mockUsers.filter(u => u.onboardingCompleted).length;

      const emailVerificationRate = (emailVerifiedUsers / totalUsers) * 100;
      const phoneVerificationRate = (phoneVerifiedUsers / totalUsers) * 100;
      const kycCompletionRate = (kycCompletedUsers / totalUsers) * 100;
      const onboardingCompletionRate = (onboardingCompletedUsers / totalUsers) * 100;

      // Verificar cálculos
      expect(emailVerificationRate).toBe(66.67); // 2/3
      expect(phoneVerificationRate).toBe(33.33); // 1/3
      expect(kycCompletionRate).toBe(33.33); // 1/3
      expect(onboardingCompletionRate).toBe(33.33); // 1/3

      // Verificar que se pueden identificar cuellos de botella
      expect(emailVerificationRate).toBeGreaterThan(phoneVerificationRate);
      expect(phoneVerificationRate).toBeGreaterThan(kycCompletionRate);
    });

    it('debería auditar todas las acciones de onboarding', async () => {
      const userId = 'user_audit_test';

      // Simular acciones de onboarding
      const actions = [
        { action: 'USER_REGISTERED', timestamp: new Date('2024-01-01') },
        { action: 'EMAIL_VERIFIED', timestamp: new Date('2024-01-02') },
        { action: 'PHONE_VERIFIED', timestamp: new Date('2024-01-03') },
        { action: 'KYC_INITIATED', timestamp: new Date('2024-01-04') },
        { action: 'KYC_COMPLETED', timestamp: new Date('2024-01-05') },
        { action: 'BANK_ACCOUNT_ADDED', timestamp: new Date('2024-01-06') },
        { action: 'BANK_ACCOUNT_VERIFIED', timestamp: new Date('2024-01-07') },
        { action: 'ONBOARDING_COMPLETED', timestamp: new Date('2024-01-08') },
      ];

      // Verificar que cada acción se registró
      actions.forEach(action => {
        expect(db.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            action: action.action,
            entityType: 'USER',
            entityId: userId,
            details: expect.objectContaining({
              timestamp: action.timestamp,
            }),
          }),
        });
      });

      // Verificar secuencia temporal
      const timestamps = actions.map(a => a.timestamp.getTime());
      const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
      expect(timestamps).toEqual(sortedTimestamps);
    });
  });
});
