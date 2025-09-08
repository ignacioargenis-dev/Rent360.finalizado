// Mock external dependencies
jest.mock('../../src/lib/db', () => ({
  db: {
    property: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { predictPropertyPrice, getMarketStatistics } from '../../src/lib/ml/predictions';
import { db } from '../../src/lib/db';
import { logger } from '../../src/lib/logger';

describe('ML Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('predictPropertyPrice', () => {
    test('should predict price for basic property data', async () => {
      const propertyData = {
        area: 80,
        bedrooms: 2,
        bathrooms: 1,
        city: 'Santiago',
        commune: 'Providencia'
      };

      // Mock training data
      (db.property.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prop-1',
          price: 500000,
          area: 80,
          bedrooms: 2,
          bathrooms: 1,
          city: 'Santiago',
          commune: 'Providencia',
          createdAt: new Date(),
          rentedAt: null,
          _count: { contracts: 0 }
        }
      ]);

      const prediction = await predictPropertyPrice(propertyData);

      expect(prediction).toHaveProperty('predictedPrice');
      expect(prediction).toHaveProperty('confidence');
      expect(prediction).toHaveProperty('priceRange');
      expect(prediction).toHaveProperty('marketComparison');
      expect(prediction).toHaveProperty('recommendations');
      expect(prediction).toHaveProperty('factors');

      expect(typeof prediction.predictedPrice).toBe('number');
      expect(prediction.predictedPrice).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    test('should handle missing training data gracefully', async () => {
      const propertyData = {
        area: 100,
        bedrooms: 3,
        city: 'Santiago'
      };

      // Mock empty training data
      (db.property.findMany as jest.Mock).mockResolvedValue([]);

      const prediction = await predictPropertyPrice(propertyData);

      expect(prediction.predictedPrice).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThan(0.5); // Should have lower confidence
    });

    test('should include relevant recommendations', async () => {
      const propertyData = {
        area: 50,
        bedrooms: 1,
        city: 'Santiago',
        furnished: true
      };

      (db.property.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prop-1',
          price: 300000,
          area: 50,
          bedrooms: 1,
          city: 'Santiago',
          furnished: true,
          createdAt: new Date(),
          rentedAt: null,
          _count: { contracts: 0 }
        }
      ]);

      const prediction = await predictPropertyPrice(propertyData);

      expect(Array.isArray(prediction.recommendations)).toBe(true);
      expect(prediction.recommendations.length).toBeGreaterThan(0);
      expect(prediction.recommendations[0]).toBeDefined();
    });

    test('should handle invalid input gracefully', async () => {
      const invalidData = {
        area: -10, // Invalid area
        bedrooms: -1, // Invalid bedrooms
      };

      (db.property.findMany as jest.Mock).mockResolvedValue([]);

      const prediction = await predictPropertyPrice(invalidData);

      expect(prediction.predictedPrice).toBeGreaterThan(0);
      expect(prediction.confidence).toBeDefined();
      expect(Array.isArray(prediction.recommendations)).toBe(true);
    });
  });

  describe('getMarketStatistics', () => {
    test('should return market statistics for specific location', async () => {
      const mockProperties = [
        {
          price: 500000,
          area: 80,
          status: 'AVAILABLE',
          createdAt: new Date(),
          rentedAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          _count: { contracts: 1 }
        },
        {
          price: 600000,
          area: 90,
          status: 'RENTED',
          createdAt: new Date(),
          rentedAt: new Date(),
          _count: { contracts: 2 }
        }
      ];

      (db.property.findMany as jest.Mock).mockResolvedValue(mockProperties);

      const stats = await getMarketStatistics('Santiago', 'Providencia');

      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);

      const stat = stats[0];
      expect(stat).toHaveProperty('city');
      expect(stat).toHaveProperty('commune');
      expect(stat).toHaveProperty('averagePrice');
      expect(stat).toHaveProperty('averageArea');
      expect(stat).toHaveProperty('totalProperties');
      expect(stat).toHaveProperty('occupancyRate');
      expect(stat).toHaveProperty('demandIndex');

      expect(stat.averagePrice).toBeGreaterThan(0);
      expect(stat.occupancyRate).toBeGreaterThanOrEqual(0);
      expect(stat.occupancyRate).toBeLessThanOrEqual(1);
    });

    test('should handle empty results', async () => {
      (db.property.findMany as jest.Mock).mockResolvedValue([]);

      const stats = await getMarketStatistics('NonExistentCity');

      expect(Array.isArray(stats)).toBe(true);
      // Should return default statistics
      expect(stats.length).toBeGreaterThan(0);
      expect(stats[0].averagePrice).toBeGreaterThan(0);
    });

    test('should calculate occupancy rate correctly', async () => {
      const mockProperties = [
        { status: 'AVAILABLE', price: 500000, area: 80, createdAt: new Date(), rentedAt: null, _count: { contracts: 0 } },
        { status: 'RENTED', price: 600000, area: 90, createdAt: new Date(), rentedAt: new Date(), _count: { contracts: 1 } },
        { status: 'RENTED', price: 550000, area: 85, createdAt: new Date(), rentedAt: new Date(), _count: { contracts: 1 } }
      ];

      (db.property.findMany as jest.Mock).mockResolvedValue(mockProperties);

      const stats = await getMarketStatistics();

      const stat = stats[0];
      expect(stat.totalProperties).toBe(3);
      expect(stat.availableProperties).toBe(1);
      expect(stat.occupancyRate).toBe(2/3); // 2 rented out of 3 total
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      (db.property.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const propertyData = {
        area: 80,
        bedrooms: 2,
        city: 'Santiago'
      };

      // Should not throw, should return fallback prediction
      const prediction = await predictPropertyPrice(propertyData);

      expect(prediction.predictedPrice).toBeGreaterThan(0);
      expect(logger.error).toHaveBeenCalled();
    });

    test('should log appropriate messages during processing', async () => {
      const propertyData = {
        area: 100,
        bedrooms: 3,
        city: 'Santiago'
      };

      (db.property.findMany as jest.Mock).mockResolvedValue([]);

      await predictPropertyPrice(propertyData);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Calculando estadísticas'),
        expect.any(Object)
      );
    });
  });
});
