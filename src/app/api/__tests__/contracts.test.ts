import { NextRequest } from 'next/server';
import { GET as getContractsHandler, POST as createContractHandler } from '../contracts/route';
import { db } from '@/lib/db';

// Mock de la base de datos
jest.mock('@/lib/db', () => ({
  db: {
    contract: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock de autenticación
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}));

describe('/api/contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/contracts', () => {
    it('should return contracts list successfully', async () => {
      const mockContracts = [
        {
          id: '1',
          contractNumber: 'CON-001',
          status: 'ACTIVE',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          monthlyRent: 500000,
          property: {
            title: 'Casa en Santiago',
            address: 'Av. Providencia 123',
          },
        },
      ];

      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'TENANT',
      });

      (db.contract.findMany as jest.Mock).mockResolvedValue(mockContracts);
      (db.contract.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/contracts');
      const response = await getContractsHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockContracts);
    });

    it('should handle status filter with multiple values', async () => {
      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'TENANT',
      });

      (db.contract.findMany as jest.Mock).mockResolvedValue([]);
      (db.contract.count as jest.Mock).mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/contracts?status=ACTIVE,COMPLETED');
      const response = await getContractsHandler(request);

      expect(response.status).toBe(200);
      expect(db.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['ACTIVE', 'COMPLETED'] },
          }),
        })
      );
    });

    it('should apply role-based filtering', async () => {
      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'TENANT',
      });

      (db.contract.findMany as jest.Mock).mockResolvedValue([]);
      (db.contract.count as jest.Mock).mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/contracts');
      await getContractsHandler(request);

      expect(db.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: '1',
          }),
        })
      );
    });
  });

  describe('POST /api/contracts', () => {
    it('should create contract successfully', async () => {
      const contractData = {
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        rentAmount: 500000,
        depositAmount: 50000,
      };

      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'OWNER',
      });

      // Mock property lookup
      (db.property.findUnique as jest.Mock).mockResolvedValue({
        id: 'prop-1',
        ownerId: '1',
        status: 'AVAILABLE',
      });

      // Mock existing contract check
      (db.contract.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock contract creation
      (db.contract.create as jest.Mock).mockResolvedValue({
        id: 'contract-1',
        ...contractData,
        status: 'DRAFT',
      });

      const request = new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await createContractHandler(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.data.contractNumber).toMatch(/^CON-/);
    });

    it('should validate date range', async () => {
      const invalidData = {
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        startDate: '2024-12-31', // Fecha de inicio posterior a fin
        endDate: '2024-01-01',
        rentAmount: 500000,
        depositAmount: 50000,
      };

      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'OWNER',
      });

      (db.property.findUnique as jest.Mock).mockResolvedValue({
        id: 'prop-1',
        ownerId: '1',
        status: 'AVAILABLE',
      });

      const request = new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await createContractHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('fecha de fin debe ser posterior');
    });

    it('should prevent contract creation for past start dates', async () => {
      const pastDateData = {
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        startDate: '2020-01-01', // Fecha en el pasado
        endDate: '2024-12-31',
        rentAmount: 500000,
        depositAmount: 50000,
      };

      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'OWNER',
      });

      (db.property.findUnique as jest.Mock).mockResolvedValue({
        id: 'prop-1',
        ownerId: '1',
        status: 'AVAILABLE',
      });

      const request = new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(pastDateData),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await createContractHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('no puede ser en el pasado');
    });

    it('should prevent duplicate active contracts', async () => {
      const contractData = {
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        rentAmount: 500000,
        depositAmount: 50000,
      };

      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'OWNER',
      });

      (db.property.findUnique as jest.Mock).mockResolvedValue({
        id: 'prop-1',
        ownerId: '1',
        status: 'AVAILABLE',
      });

      // Mock existing active contract
      (db.contract.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-contract',
        status: 'ACTIVE',
      });

      const request = new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await createContractHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Ya existe un contrato activo');
    });
  });
});
