module.exports = {
  ...require('./jest.config.js'),
  testMatch: [
    '**/__tests__/**/*.integration.test.ts',
    '**/?(*.)+(integration).test.ts',
    '**/integration/**/*.test.ts'
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globalSetup: '<rootDir>/tests/integration/setup.ts',
  globalTeardown: '<rootDir>/tests/integration/teardown.ts',
  testTimeout: 60000, // 60 segundos para tests de integración
  maxWorkers: 1, // Tests de integración deben ser secuenciales
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.stories.{ts,tsx}',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
    '!src/components/**/*' // Excluir componentes en tests de integración
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  // Configuración específica para testing de integración
  testEnvironmentOptions: {
    url: process.env.DATABASE_URL_TEST || 'file:./test.db'
  }
};
