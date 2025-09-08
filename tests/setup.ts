// Setup file for Jest tests
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Cargar configuración de entorno para tests
import '../jest.setup.env';

// Mock console methods to reduce noise during testing
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = console.warn;
  console.log = console.log;
});

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create mock dates
  mockDate: (dateString: string) => new Date(dateString),

  // Helper to generate random IDs
  generateId: () => Math.random().toString(36).substr(2, 9),

  // Helper to create mock user data
  createMockUser: (overrides = {}) => ({
    id: global.testUtils.generateId(),
    email: `test${global.testUtils.generateId()}@example.com`,
    name: 'Test User',
    role: 'TENANT',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Helper to create mock property data
  createMockProperty: (overrides = {}) => ({
    id: global.testUtils.generateId(),
    title: 'Test Property',
    address: '123 Test St',
    city: 'Santiago',
    commune: 'Providencia',
    price: 500000,
    area: 80,
    bedrooms: 2,
    bathrooms: 1,
    status: 'AVAILABLE',
    type: 'APARTMENT',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Helper to create mock contract data
  createMockContract: (overrides = {}) => ({
    id: global.testUtils.generateId(),
    contractNumber: `CNT-${global.testUtils.generateId().toUpperCase()}`,
    status: 'ACTIVE',
    monthlyRent: 500000,
    deposit: 1000000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })
};

// Custom matchers
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },

  toBePositiveNumber(received) {
    const pass = typeof received === 'number' && received > 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a positive number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a positive number`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  }
});

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't fail the test for unhandled rejections in some cases
});

// Mock external services
// Redis mock - solo si está instalado
try {
  jest.mock('redis', () => ({
    default: {
      createClient: jest.fn(() => ({
        on: jest.fn(),
        connect: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        setEx: jest.fn(),
        del: jest.fn(),
        exists: jest.fn(),
        expire: jest.fn(),
        ttl: jest.fn(),
        flushAll: jest.fn(),
        info: jest.fn(),
      }))
    }
  }));
} catch (e) {
  // Redis no está instalado, continuar sin mock
}

// Mock fetch for external API calls
global.fetch = jest.fn();

// Mock timers
jest.useFakeTimers();

// Mock Prisma client
jest.mock('../src/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contract: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    payout: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bankAccount: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    systemSetting: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    signatureRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    signatureSigner: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock external services
// External services mock - solo si existe el archivo
try {
  jest.mock('../src/lib/external-services', () => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
    sendSMS: jest.fn().mockResolvedValue({ success: true }),
    uploadFile: jest.fn().mockResolvedValue({
      url: 'https://example.com/file.pdf',
      key: 'test-file-key'
    }),
    generatePDF: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 Test PDF')),
  }));
} catch (e) {
  // External services no existe, continuar sin mock
}

// Mock bank integrations
jest.mock('../src/lib/bank-integrations/webpay-integration', () => ({
  WebPayIntegration: jest.fn().mockImplementation(() => ({
    transfer: jest.fn().mockResolvedValue({
      success: true,
      transactionId: 'wp_tx_123',
      amount: 100000
    }),
    verifyAccount: jest.fn().mockResolvedValue({
      valid: true,
      accountHolder: 'Juan Pérez'
    }),
  })),
}));

jest.mock('../src/lib/bank-integrations/banco-estado-integration', () => ({
  BancoEstadoIntegration: jest.fn().mockImplementation(() => ({
    transfer: jest.fn().mockResolvedValue({
      success: true,
      transactionId: 'be_tx_456',
      amount: 100000
    }),
    verifyAccount: jest.fn().mockResolvedValue({
      valid: true,
      accountHolder: 'María González'
    }),
  })),
}));

// Mock AI services
jest.mock('../src/lib/ai-chatbot-service', () => ({
  AIChatbotService: {
    processMessage: jest.fn().mockResolvedValue({
      response: 'Hola, ¿en qué puedo ayudarte?',
      intent: 'greeting',
      confidence: 0.95,
      provider: 'local'
    }),
  },
}));

// Mock logger to prevent console noise during tests
jest.mock('../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    logEvent: jest.fn(),
    startPerformanceMeasurement: jest.fn(),
    endPerformanceMeasurement: jest.fn(),
    measurePerformance: jest.fn(),
    checkPerformanceThresholds: jest.fn(),
    addAlertRule: jest.fn(),
    checkAlertRules: jest.fn(),
    resolveAlert: jest.fn(),
  },
}));

// Mock cache
jest.mock('../src/lib/cache', () => ({
  DistributedCacheManager: {
    getInstance: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
    }),
  },
}));

// Mock rate limiter
jest.mock('../src/lib/rate-limiter', () => ({
  rateLimiter: {
    check: jest.fn().mockResolvedValue({ allowed: true }),
    recordRequest: jest.fn(),
  },
}));

// Additional mock helpers
global.testUtils.createMockBankAccount = (overrides = {}) => ({
  id: global.testUtils.generateId(),
  userId: global.testUtils.generateId(),
  bankCode: '012',
  bankName: 'Banco Estado',
  country: 'CL',
  accountType: 'checking',
  accountNumber: '123456789',
  accountHolder: 'Test User',
  rut: '12.345.678-9',
  isPrimary: true,
  isVerified: true,
  verificationStatus: 'verified',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

global.testUtils.createMockPayout = (overrides = {}) => ({
  id: global.testUtils.generateId(),
  recipientId: global.testUtils.generateId(),
  recipientType: 'broker',
  amount: 100000,
  currency: 'CLP',
  status: 'pending',
  bankAccountId: global.testUtils.generateId(),
  description: 'Comisión por arriendo',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});
