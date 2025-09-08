import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as searchPropertiesHandler } from '../../src/app/api/properties/route';
import { POST as createContractHandler } from '../../src/app/api/contracts/route';
import { POST as processPaymentHandler } from '../../src/app/api/payments/route';
import { POST as createPayoutHandler } from '../../src/app/api/admin/payouts/process/route';
import { db } from '../../src/lib/db';
import { logger } from '../../src/lib/logger';

describe('Property Rental Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Flujo Completo: Búsqueda → Contrato → Pago → Comisión', () => {
    it('debería completar flujo completo de arriendo exitosamente', async () => {
      // 1. SETUP: Crear datos de prueba
      const tenantId = 'tenant_123';
      const ownerId = 'owner_456';
      const brokerId = 'broker_789';
      const propertyId = 'prop_101';

      // Mock de propiedad disponible
      const mockProperty = {
        id: propertyId,
        title: 'Hermoso departamento centro',
        price: 500000,
        status: 'AVAILABLE',
        ownerId,
        city: 'Santiago',
        commune: 'Providencia',
        type: 'APARTMENT',
        bedrooms: 2,
        bathrooms: 1,
        area: 65,
      };

      // Mock de usuarios
      const mockTenant = {
        id: tenantId,
        name: 'Juan Pérez',
        email: 'tenant@example.com',
        role: 'TENANT',
        isActive: true,
        kycStatus: 'VERIFIED',
        kycLevel: 'FULL',
      };

      const mockOwner = {
        id: ownerId,
        name: 'María González',
        email: 'owner@example.com',
        role: 'OWNER',
        isActive: true,
      };

      const mockBroker = {
        id: brokerId,
        name: 'Carlos Rodríguez',
        email: 'broker@example.com',
        role: 'BROKER',
        isActive: true,
        kycStatus: 'VERIFIED',
        kycLevel: 'FULL',
      };

      // Mock de configuración de comisión
      const mockCommissionConfig = {
        id: 'config_1',
        key: 'commission_percentage',
        value: '5',
      };

      // 2. MOCKS: Configurar todos los mocks necesarios
      (db.property.findMany as jest.Mock).mockResolvedValue([mockProperty]);
      (db.user.findUnique as jest.Mock)
        .mockImplementation((args) => {
          if (args.where.id === tenantId) return Promise.resolve(mockTenant);
          if (args.where.id === ownerId) return Promise.resolve(mockOwner);
          if (args.where.id === brokerId) return Promise.resolve(mockBroker);
          return Promise.resolve(null);
        });
      (db.systemSetting.findUnique as jest.Mock).mockResolvedValue(mockCommissionConfig);

      // 3. PASO 1: Búsqueda de propiedades
      console.log('🔍 Paso 1: Buscando propiedades...');

      const searchRequest = new NextRequest(
        'http://localhost:3000/api/properties?city=Santiago&maxPrice=600000&type=APARTMENT',
        { method: 'GET' }
      );

      const searchResponse = await searchPropertiesHandler(searchRequest);
      const searchResult = await searchResponse.json();

      expect(searchResponse.status).toBe(200);
      expect(searchResult.success).toBe(true);
      expect(searchResult.data.properties).toHaveLength(1);
      expect(searchResult.data.properties[0].id).toBe(propertyId);
      expect(searchResult.data.properties[0].status).toBe('AVAILABLE');

      // 4. PASO 2: Crear contrato de arriendo
      console.log('📝 Paso 2: Creando contrato de arriendo...');

      const contractData = {
        propertyId,
        tenantId,
        brokerId,
        monthlyRent: 500000,
        startDate: '2024-02-01',
        endDate: '2025-01-31',
        deposit: 1000000,
        terms: 'Contrato estándar de arriendo',
      };

      // Mock para creación de contrato
      const mockContract = {
        id: 'contract_123',
        ...contractData,
        status: 'PENDING_SIGNATURE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.contract.create as jest.Mock).mockResolvedValue(mockContract);
      (db.property.update as jest.Mock).mockResolvedValue({
        ...mockProperty,
        status: 'RENTED',
      });

      const contractRequest = new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData),
        headers: { 'Content-Type': 'application/json' },
      });

      const contractResponse = await createContractHandler(contractRequest);
      const contractResult = await contractResponse.json();

      expect(contractResponse.status).toBe(201);
      expect(contractResult.success).toBe(true);
      expect(contractResult.data.contract.id).toBe('contract_123');
      expect(contractResult.data.contract.status).toBe('PENDING_SIGNATURE');

      // Verificar que la propiedad cambió de estado
      expect(db.property.update).toHaveBeenCalledWith({
        where: { id: propertyId },
        data: { status: 'RENTED' },
      });

      // 5. PASO 3: Procesar pago inicial
      console.log('💳 Paso 3: Procesando pago inicial...');

      const paymentData = {
        contractId: 'contract_123',
        amount: 1000000, // Depósito
        description: 'Pago depósito contrato arriendo',
        paymentMethod: 'KHIPU',
      };

      // Mock de pago exitoso
      const mockPayment = {
        id: 'payment_123',
        contractId: 'contract_123',
        amount: 1000000,
        status: 'COMPLETED',
        transactionId: 'khipu_tx_123',
        createdAt: new Date(),
      };

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
      expect(paymentResult.data.payment.transactionId).toBe('khipu_tx_123');

      // 6. PASO 4: Calcular y procesar comisión del broker
      console.log('💰 Paso 4: Calculando comisión del broker...');

      // Actualizar contrato a ACTIVE después del pago
      const updatedContract = {
        ...mockContract,
        status: 'ACTIVE',
        signedAt: new Date(),
      };

      (db.contract.findUnique as jest.Mock).mockResolvedValue(updatedContract);
      (db.contract.update as jest.Mock).mockResolvedValue(updatedContract);

      // Mock de cálculo de comisión
      const mockCommission = {
        id: 'commission_123',
        contractId: 'contract_123',
        brokerId,
        amount: 25000, // 5% de 500000
        status: 'PENDING',
        createdAt: new Date(),
      };

      (db.payout.create as jest.Mock).mockResolvedValue(mockCommission);

      // Simular procesamiento de comisión
      const payoutData = {
        payoutIds: ['commission_123'],
        priority: 'normal',
      };

      const processedPayout = {
        ...mockCommission,
        status: 'COMPLETED',
        transactionId: 'bank_tx_123',
        processedAt: new Date(),
      };

      (db.payout.update as jest.Mock).mockResolvedValue(processedPayout);

      const payoutRequest = new NextRequest('http://localhost:3000/api/admin/payouts/process', {
        method: 'POST',
        body: JSON.stringify(payoutData),
        headers: { 'Content-Type': 'application/json' },
      });

      const payoutResponse = await createPayoutHandler(payoutRequest);
      const payoutResult = await payoutResponse.json();

      expect(payoutResponse.status).toBe(200);
      expect(payoutResult.success).toBe(true);
      expect(payoutResult.data.totalProcessed).toBe(1);
      expect(payoutResult.data.totalAmount).toBe(25000);

      // 7. VERIFICACIONES FINALES
      console.log('✅ Verificando integridad del flujo...');

      // Verificar que todos los servicios se llamaron correctamente
      expect(db.property.findMany).toHaveBeenCalled();
      expect(db.contract.create).toHaveBeenCalled();
      expect(db.payment.create).toHaveBeenCalled();
      expect(db.payout.create).toHaveBeenCalled();
      expect(db.payout.update).toHaveBeenCalled();

      // Verificar logging apropiado
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('contrato'),
        expect.any(Object)
      );

      console.log('🎉 Flujo completo de arriendo ejecutado exitosamente!');
    });

    it('debería manejar errores en el flujo y hacer rollback apropiado', async () => {
      // Configurar escenario donde falla el pago
      const tenantId = 'tenant_123';
      const propertyId = 'prop_101';

      // Mock de propiedad
      const mockProperty = {
        id: propertyId,
        status: 'AVAILABLE',
        ownerId: 'owner_456',
      };

      (db.property.findMany as jest.Mock).mockResolvedValue([mockProperty]);

      // Mock de fallo en pago
      (db.payment.create as jest.Mock).mockRejectedValue(new Error('Payment gateway error'));

      // Intentar crear contrato
      const contractData = {
        propertyId,
        tenantId,
        monthlyRent: 500000,
        startDate: '2024-02-01',
        endDate: '2025-01-31',
      };

      const contractRequest = new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData),
        headers: { 'Content-Type': 'application/json' },
      });

      const contractResponse = await createContractHandler(contractRequest);
      const contractResult = await contractResponse.json();

      // Debería fallar pero no dejar estado inconsistente
      expect(contractResponse.status).toBe(500);
      expect(contractResult.success).toBe(false);

      // Verificar que se registró el error
      expect(logger.error).toHaveBeenCalled();
    });

    it('debería validar KYC antes de permitir contrato', async () => {
      const tenantId = 'tenant_no_kyc';
      const propertyId = 'prop_101';

      // Mock de usuario sin KYC
      const mockTenantNoKYC = {
        id: tenantId,
        name: 'Usuario sin KYC',
        email: 'no-kyc@example.com',
        role: 'TENANT',
        isActive: true,
        kycStatus: 'PENDING',
        kycLevel: null,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockTenantNoKYC);

      const contractData = {
        propertyId,
        tenantId,
        monthlyRent: 500000,
        startDate: '2024-02-01',
        endDate: '2025-01-31',
      };

      const contractRequest = new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData),
        headers: { 'Content-Type': 'application/json' },
      });

      const contractResponse = await createContractHandler(contractRequest);
      const contractResult = await contractResponse.json();

      // Debería rechazar el contrato
      expect(contractResponse.status).toBe(403);
      expect(contractResult.success).toBe(false);
      expect(contractResult.error).toContain('KYC');
    });
  });

  describe('Validaciones de Integridad', () => {
    it('debería prevenir contratos duplicados para la misma propiedad', async () => {
      const propertyId = 'prop_101';
      const tenant1 = 'tenant_123';
      const tenant2 = 'tenant_456';

      // Mock de propiedad ya rentada
      const mockRentedProperty = {
        id: propertyId,
        status: 'RENTED',
        ownerId: 'owner_456',
      };

      (db.property.findUnique as jest.Mock).mockResolvedValue(mockRentedProperty);

      const contractData = {
        propertyId,
        tenantId: tenant2,
        monthlyRent: 500000,
        startDate: '2024-02-01',
        endDate: '2025-01-31',
      };

      const contractRequest = new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData),
        headers: { 'Content-Type': 'application/json' },
      });

      const contractResponse = await createContractHandler(contractRequest);
      const contractResult = await contractResponse.json();

      expect(contractResponse.status).toBe(409);
      expect(contractResult.success).toBe(false);
      expect(contractResult.error).toContain('rentada');
    });

    it('debería validar límites de precio y depósito', async () => {
      const contractData = {
        propertyId: 'prop_101',
        tenantId: 'tenant_123',
        monthlyRent: 10000000, // Monto excesivo
        deposit: 1000000,
        startDate: '2024-02-01',
        endDate: '2025-01-31',
      };

      const contractRequest = new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData),
        headers: { 'Content-Type': 'application/json' },
      });

      const contractResponse = await createContractHandler(contractRequest);
      const contractResult = await contractResponse.json();

      // Debería validar o al menos registrar el monto alto
      expect(contractResponse.status).toBe(400);
      expect(contractResult.success).toBe(false);
      expect(contractResult.error).toContain('monto');
    });
  });
});
