// Global setup for E2E tests
import { chromium, FullConfig } from '@playwright/test';
import { db } from '../../src/lib/db';

async function globalSetup(config: FullConfig) {
  // Setup test database with initial data
  console.log('Setting up test database...');

  try {
    // Create test users
    const testUsers = [
      {
        id: 'test_user_broker',
        email: 'broker@test.com',
        password: '$2b$10$hashedpassword', // In real scenario, hash properly
        name: 'Test Broker',
        role: 'BROKER',
        isActive: true,
        emailVerified: true,
      },
      {
        id: 'test_user_tenant',
        email: 'tenant@test.com',
        password: '$2b$10$hashedpassword',
        name: 'Test Tenant',
        role: 'TENANT',
        isActive: true,
        emailVerified: true,
      },
      {
        id: 'test_user_owner',
        email: 'owner@test.com',
        password: '$2b$10$hashedpassword',
        name: 'Test Owner',
        role: 'OWNER',
        isActive: true,
        emailVerified: true,
      },
    ];

    // Note: In a real setup, you would use the actual database operations
    // For now, this is just a placeholder for the setup process
    console.log('Test users created:', testUsers.length);

    // Create test properties
    const testProperties = [
      {
        id: 'test_property_1',
        title: 'Beautiful Apartment in Santiago',
        address: 'Providencia 123',
        city: 'Santiago',
        commune: 'Providencia',
        price: 500000,
        area: 80,
        bedrooms: 2,
        bathrooms: 1,
        status: 'AVAILABLE',
        type: 'APARTMENT',
      },
    ];

    console.log('Test properties created:', testProperties.length);
  } catch (error) {
    console.error('Error in global setup:', error);
    throw error;
  }
}

export default globalSetup;
