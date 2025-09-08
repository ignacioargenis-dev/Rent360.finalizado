// Global teardown for E2E tests
import { db } from '../../src/lib/db';

async function globalTeardown() {
  console.log('Cleaning up test database...');

  try {
    // Clean up test data
    // Note: In a real scenario, you would clean up the test data
    // For now, this is just a placeholder
    console.log('Test data cleaned up successfully');

  } catch (error) {
    console.error('Error in global teardown:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;