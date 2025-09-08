import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as createSignatureHandler } from '../../src/app/api/signatures/route';
import { GET as getSignatureStatusHandler, PUT as updateSignatureHandler } from '../../src/app/api/signatures/[id]/route';
import { POST as sendSignatureHandler } from '../../src/app/api/signatures/[id]/send/route';
import { db } from '../../src/lib/db';
import { logger } from '../../src/lib/logger';

describe('Contract Signature Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Flujo Completo: Creación → Envío → Firma → Validación', () => {
    it('debería completar flujo completo de firma electrónica exitosamente', async () => {
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
        status: 'PENDING_SIGNATURE',
        monthlyRent: 500000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-01-31'),
        createdAt: new Date(),
      };

      const mockSigners = [
        {
          id: 'signer_tenant',
          userId: tenantId,
          role: 'TENANT',
          email: 'tenant@example.com',
          name: 'Juan Pérez',
          status: 'PENDING',
        },
        {
          id: 'signer_owner',
          userId: ownerId,
          role: 'OWNER',
          email: 'owner@example.com',
          name: 'María González',
          status: 'PENDING',
        },
        {
          id: 'signer_broker',
          userId: brokerId,
          role: 'BROKER',
          email: 'broker@example.com',
          name: 'Carlos Rodríguez',
          status: 'PENDING',
        },
      ];

      // 2. PASO 1: Crear solicitud de firma
      console.log('📝 Paso 1: Creando solicitud de firma electrónica...');

      const signatureData = {
        contractId,
        documentType: 'CONTRACT',
        provider: 'TRUSTFACTORY',
        signers: [
          { userId: tenantId, role: 'TENANT', email: 'tenant@example.com' },
          { userId: ownerId, role: 'OWNER', email: 'owner@example.com' },
          { userId: brokerId, role: 'BROKER', email: 'broker@example.com' },
        ],
        metadata: {
          contractValue: 500000,
          propertyAddress: 'Providencia 123',
          duration: 12,
        },
      };

      // Mock de creación de firma
      const mockSignatureRequest = {
        id: 'signature_123',
        contractId,
        status: 'CREATED',
        provider: 'TRUSTFACTORY',
        sessionId: 'tf_session_123',
        documentUrl: 'https://trustfactory.cl/doc/sig_123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.contract.findUnique as jest.Mock).mockResolvedValue(mockContract);
      (db.signatureRequest.create as jest.Mock).mockResolvedValue(mockSignatureRequest);
      (db.signatureSigner.create as jest.Mock)
        .mockResolvedValueOnce({ ...mockSigners[0], signatureRequestId: 'signature_123' })
        .mockResolvedValueOnce({ ...mockSigners[1], signatureRequestId: 'signature_123' })
        .mockResolvedValueOnce({ ...mockSigners[2], signatureRequestId: 'signature_123' });

      const createSignatureRequest = new NextRequest('http://localhost:3000/api/signatures', {
        method: 'POST',
        body: JSON.stringify(signatureData),
        headers: { 'Content-Type': 'application/json' },
      });

      const createResponse = await createSignatureHandler(createSignatureRequest);
      const createResult = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createResult.success).toBe(true);
      expect(createResult.data.signature.id).toBe('signature_123');
      expect(createResult.data.signature.status).toBe('CREATED');
      expect(createResult.data.signers).toHaveLength(3);

      console.log('✅ Solicitud de firma creada exitosamente');

      // 3. PASO 2: Enviar invitaciones de firma
      console.log('📧 Paso 2: Enviando invitaciones de firma...');

      (db.signatureRequest.findUnique as jest.Mock).mockResolvedValue({
        ...mockSignatureRequest,
        signers: mockSigners,
      });
      (db.signatureSigner.findMany as jest.Mock).mockResolvedValue(mockSigners);

      const sendSignatureRequest = new NextRequest(
        `http://localhost:3000/api/signatures/${mockSignatureRequest.id}/send`,
        { method: 'POST' }
      );

      // Mock del envío de emails
      const sendSignatureResponse = await sendSignatureHandler(sendSignatureRequest);
      const sendResult = await sendSignatureResponse.json();

      expect(sendSignatureResponse.status).toBe(200);
      expect(sendResult.success).toBe(true);
      expect(sendResult.data.sentTo).toHaveLength(3);

      console.log('✅ Invitaciones enviadas exitosamente');

      // 4. PASO 3: Simular firma del inquilino
      console.log('✍️ Paso 3: Simulando firma del inquilino...');

      const tenantSigner = mockSigners[0];
      const signedTenantSigner = {
        ...tenantSigner,
        status: 'SIGNED',
        signedAt: new Date(),
        signatureData: {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          geolocation: { lat: -33.4489, lng: -70.6693 },
        },
      };

      (db.signatureSigner.findUnique as jest.Mock).mockResolvedValue(tenantSigner);
      (db.signatureSigner.update as jest.Mock).mockResolvedValue(signedTenantSigner);

      const tenantSignRequest = new NextRequest(
        `http://localhost:3000/api/signatures/${mockSignatureRequest.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            signerId: tenantSigner.id,
            action: 'SIGN',
            signature: 'base64_signature_data',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const tenantSignResponse = await updateSignatureHandler(
        tenantSignRequest,
        { params: { id: mockSignatureRequest.id } }
      );
      const tenantSignResult = await tenantSignResponse.json();

      expect(tenantSignResponse.status).toBe(200);
      expect(tenantSignResult.success).toBe(true);

      console.log('✅ Inquilino firmó exitosamente');

      // 5. PASO 4: Simular firma del propietario
      console.log('✍️ Paso 4: Simulando firma del propietario...');

      const ownerSigner = mockSigners[1];
      const signedOwnerSigner = {
        ...ownerSigner,
        status: 'SIGNED',
        signedAt: new Date(),
        signatureData: {
          ipAddress: '192.168.1.200',
          userAgent: 'Mozilla/5.0...',
          geolocation: { lat: -33.4489, lng: -70.6693 },
        },
      };

      (db.signatureSigner.findUnique as jest.Mock).mockResolvedValue(ownerSigner);
      (db.signatureSigner.update as jest.Mock).mockResolvedValue(signedOwnerSigner);

      const ownerSignRequest = new NextRequest(
        `http://localhost:3000/api/signatures/${mockSignatureRequest.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            signerId: ownerSigner.id,
            action: 'SIGN',
            signature: 'base64_signature_data',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const ownerSignResponse = await updateSignatureHandler(
        ownerSignRequest,
        { params: { id: mockSignatureRequest.id } }
      );

      expect(ownerSignResponse.status).toBe(200);

      console.log('✅ Propietario firmó exitosamente');

      // 6. PASO 5: Simular firma del broker
      console.log('✍️ Paso 5: Simulando firma del broker...');

      const brokerSigner = mockSigners[2];
      const signedBrokerSigner = {
        ...brokerSigner,
        status: 'SIGNED',
        signedAt: new Date(),
        signatureData: {
          ipAddress: '192.168.1.300',
          userAgent: 'Mozilla/5.0...',
          geolocation: { lat: -33.4489, lng: -70.6693 },
        },
      };

      (db.signatureSigner.findUnique as jest.Mock).mockResolvedValue(brokerSigner);
      (db.signatureSigner.update as jest.Mock).mockResolvedValue(signedBrokerSigner);

      const brokerSignRequest = new NextRequest(
        `http://localhost:3000/api/signatures/${mockSignatureRequest.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            signerId: brokerSigner.id,
            action: 'SIGN',
            signature: 'base64_signature_data',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const brokerSignResponse = await updateSignatureHandler(
        brokerSignRequest,
        { params: { id: mockSignatureRequest.id } }
      );

      expect(brokerSignResponse.status).toBe(200);

      console.log('✅ Broker firmó exitosamente');

      // 7. PASO 6: Verificar estado final
      console.log('🔍 Paso 6: Verificando estado final...');

      const allSignedSigners = [
        signedTenantSigner,
        signedOwnerSigner,
        signedBrokerSigner,
      ];

      const completedSignatureRequest = {
        ...mockSignatureRequest,
        status: 'COMPLETED',
        completedAt: new Date(),
        signers: allSignedSigners,
      };

      (db.signatureRequest.findUnique as jest.Mock).mockResolvedValue(completedSignatureRequest);
      (db.signatureSigner.findMany as jest.Mock).mockResolvedValue(allSignedSigners);
      (db.contract.update as jest.Mock).mockResolvedValue({
        ...mockContract,
        status: 'ACTIVE',
        signedAt: new Date(),
      });

      const statusRequest = new NextRequest(
        `http://localhost:3000/api/signatures/${mockSignatureRequest.id}`,
        { method: 'GET' }
      );

      const statusResponse = await getSignatureStatusHandler(
        statusRequest,
        { params: { id: mockSignatureRequest.id } }
      );
      const statusResult = await statusResponse.json();

      expect(statusResponse.status).toBe(200);
      expect(statusResult.success).toBe(true);
      expect(statusResult.data.signature.status).toBe('COMPLETED');
      expect(statusResult.data.signers.every((s: any) => s.status === 'SIGNED')).toBe(true);

      // Verificar que el contrato se actualizó
      expect(db.contract.update).toHaveBeenCalledWith({
        where: { id: contractId },
        data: expect.objectContaining({
          status: 'ACTIVE',
          signedAt: expect.any(Date),
        }),
      });

      console.log('✅ Contrato completado exitosamente');

      // 8. VERIFICACIONES FINALES
      console.log('🔐 Verificando integridad y auditoría...');

      // Verificar que se creó registro de auditoría
      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CONTRACT_SIGNED',
          entityType: 'CONTRACT',
          entityId: contractId,
        }),
      });

      // Verificar logging apropiado
      expect(logger.info).toHaveBeenCalledWith(
        'Proceso de firma completado exitosamente',
        expect.objectContaining({
          signatureId: mockSignatureRequest.id,
          contractId,
        })
      );

      console.log('🎉 Flujo completo de firma electrónica ejecutado exitosamente!');
    });

    it('debería manejar firma rechazada y actualizar estados', async () => {
      const signatureId = 'signature_123';
      const signerId = 'signer_456';

      // Mock de firmante que rechaza
      const mockSigner = {
        id: signerId,
        userId: 'user_456',
        role: 'TENANT',
        status: 'PENDING',
      };

      const rejectedSigner = {
        ...mockSigner,
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: 'No estoy de acuerdo con los términos',
      };

      (db.signatureSigner.findUnique as jest.Mock).mockResolvedValue(mockSigner);
      (db.signatureSigner.update as jest.Mock).mockResolvedValue(rejectedSigner);
      (db.signatureRequest.update as jest.Mock).mockResolvedValue({
        id: signatureId,
        status: 'REJECTED',
        rejectedAt: new Date(),
      });

      const rejectRequest = new NextRequest(
        `http://localhost:3000/api/signatures/${signatureId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            signerId,
            action: 'REJECT',
            reason: 'No estoy de acuerdo con los términos',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const rejectResponse = await updateSignatureHandler(
        rejectRequest,
        { params: { id: signatureId } }
      );
      const rejectResult = await rejectResponse.json();

      expect(rejectResponse.status).toBe(200);
      expect(rejectResult.success).toBe(true);

      // Verificar que se registró el rechazo
      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'SIGNATURE_REJECTED',
          entityType: 'SIGNATURE',
          entityId: signatureId,
          details: expect.objectContaining({
            signerId,
            reason: 'No estoy de acuerdo con los términos',
          }),
        }),
      });
    });

    it('debería manejar expiración de firma y notificar', async () => {
      const signatureId = 'signature_expired';

      const expiredSignature = {
        id: signatureId,
        status: 'EXPIRED',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expiró hace 1 día
        signers: [
          { id: 'signer_1', status: 'PENDING', email: 'user1@example.com' },
          { id: 'signer_2', status: 'SIGNED', email: 'user2@example.com' },
        ],
      };

      (db.signatureRequest.findUnique as jest.Mock).mockResolvedValue(expiredSignature);
      (db.signatureRequest.update as jest.Mock).mockResolvedValue({
        ...expiredSignature,
        status: 'EXPIRED',
        expiredAt: new Date(),
      });

      const statusRequest = new NextRequest(
        `http://localhost:3000/api/signatures/${signatureId}`,
        { method: 'GET' }
      );

      const statusResponse = await getSignatureStatusHandler(
        statusRequest,
        { params: { id: signatureId } }
      );
      const statusResult = await statusResponse.json();

      expect(statusResponse.status).toBe(200);
      expect(statusResult.data.signature.status).toBe('EXPIRED');

      // Verificar que se notificó la expiración
      expect(logger.warn).toHaveBeenCalledWith(
        'Firma expirada detectada',
        expect.objectContaining({ signatureId })
      );
    });
  });

  describe('Validaciones de Seguridad', () => {
    it('debería validar identidad del firmante', async () => {
      const signatureId = 'signature_123';
      const invalidSignerId = 'invalid_signer';

      (db.signatureSigner.findUnique as jest.Mock).mockResolvedValue(null);

      const signRequest = new NextRequest(
        `http://localhost:3000/api/signatures/${signatureId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            signerId: invalidSignerId,
            action: 'SIGN',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const signResponse = await updateSignatureHandler(
        signRequest,
        { params: { id: signatureId } }
      );
      const signResult = await signResponse.json();

      expect(signResponse.status).toBe(404);
      expect(signResult.success).toBe(false);
      expect(signResult.error).toContain('firmante');
    });

    it('debería prevenir firma duplicada', async () => {
      const signatureId = 'signature_123';
      const signerId = 'signer_456';

      const alreadySignedSigner = {
        id: signerId,
        status: 'SIGNED',
        signedAt: new Date('2024-01-15'),
      };

      (db.signatureSigner.findUnique as jest.Mock).mockResolvedValue(alreadySignedSigner);

      const duplicateSignRequest = new NextRequest(
        `http://localhost:3000/api/signatures/${signatureId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            signerId,
            action: 'SIGN',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const duplicateSignResponse = await updateSignatureHandler(
        duplicateSignRequest,
        { params: { id: signatureId } }
      );
      const duplicateSignResult = await duplicateSignResponse.json();

      expect(duplicateSignResponse.status).toBe(409);
      expect(duplicateSignResult.success).toBe(false);
      expect(duplicateSignResult.error).toContain('ya firmó');
    });

    it('debería validar orden de firma requerido', async () => {
      const signatureId = 'signature_123';
      const brokerSignerId = 'broker_signer';

      // Intentar que broker firme antes que inquilino/propietario
      const brokerSigner = {
        id: brokerSignerId,
        userId: 'broker_123',
        role: 'BROKER',
        status: 'PENDING',
        order: 3, // Broker firma último
      };

      (db.signatureSigner.findUnique as jest.Mock).mockResolvedValue(brokerSigner);
      (db.signatureSigner.findMany as jest.Mock).mockResolvedValue([
        { id: 'tenant_signer', status: 'PENDING', order: 1 },
        { id: 'owner_signer', status: 'PENDING', order: 2 },
        brokerSigner,
      ]);

      const earlySignRequest = new NextRequest(
        `http://localhost:3000/api/signatures/${signatureId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            signerId: brokerSignerId,
            action: 'SIGN',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const earlySignResponse = await updateSignatureHandler(
        earlySignRequest,
        { params: { id: signatureId } }
      );
      const earlySignResult = await earlySignResponse.json();

      expect(earlySignResponse.status).toBe(400);
      expect(earlySignResult.success).toBe(false);
      expect(earlySignResult.error).toContain('orden');
    });
  });
});
