import { NextRequest } from 'next/server';
import { GET as getPropertiesHandler } from '../properties/route';
import { POST as createPropertyHandler } from '../properties/route';
import { db } from '@/lib/db';

// Mock de la base de datos
jest.mock('@/lib/db', () => ({
  db: {
    property: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock de autenticación
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Mock de optimización de consultas
jest.mock('@/lib/db-optimizer', () => ({
  getPropertiesOptimized: jest.fn(),
}));

describe('/api/properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/properties', () => {
    it('should return properties list successfully', async () => {
      const mockProperties = [
        {
          id: '1',
          title: 'Casa en Santiago',
          address: 'Av. Providencia 123',
          price: 500000,
          status: 'AVAILABLE',
        },
      ];

      const mockOptimizedResult = {
        data: mockProperties,
        total: 1,
        page: 1,
        limit: 10,
      };

      // Mock successful auth
      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'TENANT',
      });

      // Mock database query
      const { getPropertiesOptimized } = require('@/lib/db-optimizer');
      (getPropertiesOptimized as jest.Mock).mockResolvedValue(mockOptimizedResult);

      const request = new NextRequest('http://localhost:3000/api/properties');
      const response = await getPropertiesHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProperties);
    });

    it('should handle search parameter', async () => {
      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'TENANT',
      });

      const { getPropertiesOptimized } = require('@/lib/db-optimizer');
      (getPropertiesOptimized as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      const request = new NextRequest('http://localhost:3000/api/properties?search=Santiago');
      const response = await getPropertiesHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(getPropertiesOptimized).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
        expect.any(Object),
        expect.any(Object),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should validate price range parameters', async () => {
      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'TENANT',
      });

      const { getPropertiesOptimized } = require('@/lib/db-optimizer');
      (getPropertiesOptimized as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      const request = new NextRequest('http://localhost:3000/api/properties?minPrice=100000&maxPrice=500000');
      const response = await getPropertiesHandler(request);

      expect(response.status).toBe(200);
    });

    it('should reject invalid price parameters', async () => {
      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'TENANT',
      });

      const request = new NextRequest('http://localhost:3000/api/properties?minPrice=invalid');
      const response = await getPropertiesHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
    });
  });

  describe('POST /api/properties', () => {
    it('should create property successfully for owner', async () => {
      const propertyData = {
        title: 'Nueva Propiedad',
        description: 'Hermosa casa',
        address: 'Calle Ficticia 123',
        city: 'Santiago',
        commune: 'Providencia',
        region: 'Metropolitana',
        price: 300000,
        deposit: 30000,
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        type: 'HOUSE',
      };

      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'OWNER',
      });

      (db.property.create as jest.Mock).mockResolvedValue({
        id: '1',
        ...propertyData,
        ownerId: '1',
      });

      const request = new NextRequest('http://localhost:3000/api/properties', {
        method: 'POST',
        body: JSON.stringify(propertyData),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await createPropertyHandler(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.data.title).toBe(propertyData.title);
    });

    it('should reject property creation for non-owner', async () => {
      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'TENANT',
      });

      const request = new NextRequest('http://localhost:3000/api/properties', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await createPropertyHandler(request);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const { requireAuth } = require('@/lib/auth');
      (requireAuth as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'OWNER',
      });

      const invalidData = {
        title: '',
        price: -100,
      };

      const request = new NextRequest('http://localhost:3000/api/properties', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await createPropertyHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
    });
  });
});
