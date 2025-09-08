// Mock database for testing
jest.mock('../../src/lib/db', () => ({
  db: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    property: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    contract: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

import { db } from '../../src/lib/db';
import { UserQueries, PropertyQueries, ContractQueries, PaymentQueries } from '../../src/lib/query-optimization';

describe('UserQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getUsersWithFilters should build correct query', async () => {
    const mockUsers = [
      { id: '1', email: 'user1@test.com', name: 'User 1' },
      { id: '2', email: 'user2@test.com', name: 'User 2' }
    ];

    (db.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
    (db.user.count as jest.Mock).mockResolvedValue(2);

    const filters = {
      role: 'TENANT',
      isActive: true,
      limit: 10,
      offset: 0
    };

    const result = await UserQueries.getUsersWithFilters(filters);

    expect(db.user.findMany).toHaveBeenCalledWith({
      where: {
        role: 'TENANT',
        isActive: true
      },
      select: expect.any(Object),
      orderBy: { createdAt: 'desc' },
      take: 10,
      skip: 0
    });

    expect(result.users).toEqual(mockUsers);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.hasNext).toBe(false);
  });

  test('getUsersWithFilters should handle empty filters', async () => {
    const mockUsers = [];
    (db.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
    (db.user.count as jest.Mock).mockResolvedValue(0);

    const result = await UserQueries.getUsersWithFilters({});

    expect(result.users).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(false);
  });
});

describe('PropertyQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getPropertiesWithFilters should apply price range filter', async () => {
    const mockProperties = [
      { id: '1', title: 'Property 1', price: 500000 },
      { id: '2', title: 'Property 2', price: 750000 }
    ];

    (db.property.findMany as jest.Mock).mockResolvedValue(mockProperties);
    (db.property.count as jest.Mock).mockResolvedValue(2);

    const filters = {
      minPrice: 400000,
      maxPrice: 800000,
      city: 'Santiago',
      limit: 20
    };

    const result = await PropertyQueries.getPropertiesWithFilters(filters);

    expect(db.property.findMany).toHaveBeenCalledWith({
      where: {
        price: {
          gte: 400000,
          lte: 800000
        },
        city: 'Santiago'
      },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: 0
    });

    expect(result.properties).toEqual(mockProperties);
  });

  test('getPropertiesWithFilters should handle area range filter', async () => {
    const mockProperties = [
      { id: '1', title: 'Small Property', area: 60 },
      { id: '2', title: 'Large Property', area: 120 }
    ];

    (db.property.findMany as jest.Mock).mockResolvedValue(mockProperties);
    (db.property.count as jest.Mock).mockResolvedValue(2);

    const filters = {
      minArea: 50,
      maxArea: 150
    };

    const result = await PropertyQueries.getPropertiesWithFilters(filters);

    expect(db.property.findMany).toHaveBeenCalledWith({
      where: {
        area: {
          gte: 50,
          lte: 150
        }
      },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: 0
    });
  });
});

describe('PaymentQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getPendingPayments should filter by date and status', async () => {
    const mockPayments = [
      { id: '1', amount: 500000, dueDate: new Date('2024-02-01'), status: 'PENDING' },
      { id: '2', amount: 750000, dueDate: new Date('2024-02-15'), status: 'PENDING' }
    ];

    (db.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);

    const result = await PaymentQueries.getPendingPayments();

    expect(db.payment.findMany).toHaveBeenCalledWith({
      where: {
        status: 'PENDING',
        dueDate: {
          lte: expect.any(Date)
        }
      },
      include: expect.any(Object),
      orderBy: { dueDate: 'asc' },
      take: 50
    });

    expect(result).toEqual(mockPayments);
  });

  test('getPaymentStats should calculate statistics correctly', async () => {
    (db.payment.count as jest.Mock)
      .mockResolvedValueOnce(10) // Total
      .mockResolvedValueOnce(8)  // Paid
      .mockResolvedValueOnce(2); // Pending

    (db.payment.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: 5000000 }
    });

    const stats = await PaymentQueries.getPaymentStats();

    expect(stats.total).toBe(10);
    expect(stats.paid).toBe(8);
    expect(stats.pending).toBe(2);
    expect(stats.totalPaidAmount).toBe(5000000);
    expect(stats.paymentRate).toBe(80); // 8/10 * 100
  });

  test('getPaymentStats should handle empty results', async () => {
    (db.payment.count as jest.Mock).mockResolvedValue(0);
    (db.payment.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: null }
    });

    const stats = await PaymentQueries.getPaymentStats();

    expect(stats.total).toBe(0);
    expect(stats.paid).toBe(0);
    expect(stats.pending).toBe(0);
    expect(stats.totalPaidAmount).toBe(0);
    expect(stats.paymentRate).toBe(0);
  });
});

describe('ContractQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getContractsWithDetails should filter by user and status', async () => {
    const mockContracts = [
      {
        id: '1',
        contractNumber: 'CNT-001',
        status: 'ACTIVE',
        monthlyRent: 500000,
        property: { id: 'p1', title: 'Property 1' },
        tenant: { id: 't1', name: 'Tenant 1' },
        owner: { id: 'o1', name: 'Owner 1' }
      }
    ];

    (db.contract.findMany as jest.Mock).mockResolvedValue(mockContracts);
    (db.contract.count as jest.Mock).mockResolvedValue(1);

    const filters = {
      userId: 'user123',
      status: 'ACTIVE',
      limit: 10
    };

    const result = await ContractQueries.getContractsWithDetails(filters);

    expect(db.contract.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { ownerId: 'user123' },
          { tenantId: 'user123' }
        ],
        status: 'ACTIVE'
      },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
      take: 10,
      skip: 0
    });

    expect(result.contracts).toEqual(mockContracts);
    expect(result.pagination.total).toBe(1);
  });

  test('getContractsWithDetails should handle pagination', async () => {
    const mockContracts = Array(15).fill(null).map((_, i) => ({
      id: `contract-${i}`,
      contractNumber: `CNT-${i}`,
      status: 'ACTIVE'
    }));

    (db.contract.findMany as jest.Mock).mockResolvedValue(mockContracts.slice(10, 15));
    (db.contract.count as jest.Mock).mockResolvedValue(15);

    const result = await ContractQueries.getContractsWithDetails({
      limit: 5,
      offset: 10
    });

    expect(result.contracts).toHaveLength(5);
    expect(result.pagination.total).toBe(15);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(true);
  });
});
