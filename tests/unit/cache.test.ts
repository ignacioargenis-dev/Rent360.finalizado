import { cacheManager, CacheKeys } from '../../src/lib/cache';
import { logger } from '../../src/lib/logger';

describe('Cache Manager', () => {
  beforeEach(async () => {
    await cacheManager.clear();
  });

  test('should set and get values', async () => {
    const key = 'test-key';
    const value = { message: 'Hello World' };

    await cacheManager.set(key, value);
    const retrieved = await cacheManager.get(key);

    expect(retrieved).toEqual(value);
  });

  test('should return null for non-existent keys', async () => {
    const retrieved = await cacheManager.get('non-existent-key');
    expect(retrieved).toBeNull();
  });

  test('should delete keys', async () => {
    const key = 'test-delete';
    const value = 'test-value';

    await cacheManager.set(key, value);
    let retrieved = await cacheManager.get(key);
    expect(retrieved).toBe(value);

    const deleted = await cacheManager.delete(key);
    expect(deleted).toBe(true);

    retrieved = await cacheManager.get(key);
    expect(retrieved).toBeNull();
  });

  test('should handle TTL expiration', async () => {
    const key = 'test-ttl';
    const value = 'expires-soon';

    // Set with very short TTL (1ms)
    await cacheManager.set(key, value, 1);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 2));

    const retrieved = await cacheManager.get(key);
    expect(retrieved).toBeNull();
  });

  test('should handle cache keys generation', () => {
    const userKey = CacheKeys.USER_PROFILE('user123');
    const marketKey = CacheKeys.MARKET_STATS('Santiago', 'Providencia');

    expect(userKey).toBe('user:profile:user123');
    expect(marketKey).toBe('market:stats:Santiago:Providencia');
  });

  test('should get cache statistics', async () => {
    await cacheManager.set('stat-test-1', 'value1');
    await cacheManager.set('stat-test-2', 'value2');

    const stats = await cacheManager.getStats();

    expect(stats).toHaveProperty('total');
    expect(typeof stats.total).toBe('number');
    expect(stats.total).toBeGreaterThanOrEqual(0);
  });
});

describe('Cache Integration', () => {
  test('should work with getOrSet pattern', async () => {
    const key = 'getorset-test';
    let callCount = 0;

    const fetcher = async () => {
      callCount++;
      return { data: 'fetched-value', timestamp: Date.now() };
    };

    // First call should fetch data
    const result1 = await cacheManager.getOrSet(key, fetcher);
    expect(result1.data).toBe('fetched-value');
    expect(callCount).toBe(1);

    // Second call should use cache
    const result2 = await cacheManager.getOrSet(key, fetcher);
    expect(result2.data).toBe('fetched-value');
    expect(callCount).toBe(1); // Should not have increased
    expect(result2).toEqual(result1);
  });

  test('should handle fetcher errors gracefully', async () => {
    const key = 'error-test';
    const fetcher = async () => {
      throw new Error('Fetcher failed');
    };

    await expect(cacheManager.getOrSet(key, fetcher)).rejects.toThrow('Fetcher failed');

    // Should not have cached the error
    const cached = await cacheManager.get(key);
    expect(cached).toBeNull();
  });
});
