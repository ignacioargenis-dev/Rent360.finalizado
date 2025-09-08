import { CacheManager } from '../cache-manager';

describe('Cache Manager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
    jest.clearAllTimers();
  });

  afterEach(() => {
    cacheManager.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      cacheManager.set(key, value);
      const retrieved = cacheManager.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent keys', () => {
      const result = cacheManager.get('non-existent-key');
      expect(result).toBeUndefined();
    });

    it('should handle different data types', () => {
      cacheManager.set('string', 'test');
      cacheManager.set('number', 42);
      cacheManager.set('boolean', true);
      cacheManager.set('object', { nested: { value: 'test' } });
      cacheManager.set('array', [1, 2, 3]);

      expect(cacheManager.get('string')).toBe('test');
      expect(cacheManager.get('number')).toBe(42);
      expect(cacheManager.get('boolean')).toBe(true);
      expect(cacheManager.get('object')).toEqual({ nested: { value: 'test' } });
      expect(cacheManager.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', () => {
      jest.useFakeTimers();

      const key = 'ttl-test';
      const value = 'test-value';
      const ttl = 5000; // 5 seconds

      cacheManager.set(key, value, ttl);

      // Avanzar tiempo pero no lo suficiente para expirar
      jest.advanceTimersByTime(3000);
      expect(cacheManager.get(key)).toBe(value);

      // Avanzar tiempo suficiente para expirar
      jest.advanceTimersByTime(3000);
      expect(cacheManager.get(key)).toBeUndefined();

      jest.useRealTimers();
    });

    it('should use default TTL when not specified', () => {
      const key = 'default-ttl';
      const value = 'test';

      cacheManager.set(key, value);
      expect(cacheManager.get(key)).toBe(value);
    });
  });

  describe('delete and clear', () => {
    it('should delete specific entries', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');

      cacheManager.delete('key1');

      expect(cacheManager.get('key1')).toBeUndefined();
      expect(cacheManager.get('key2')).toBe('value2');
    });

    it('should clear all entries', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.set('key3', 'value3');

      cacheManager.clear();

      expect(cacheManager.get('key1')).toBeUndefined();
      expect(cacheManager.get('key2')).toBeUndefined();
      expect(cacheManager.get('key3')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should check if key exists', () => {
      cacheManager.set('existing-key', 'value');

      expect(cacheManager.has('existing-key')).toBe(true);
      expect(cacheManager.has('non-existing-key')).toBe(false);
    });

    it('should return false for expired entries', () => {
      jest.useFakeTimers();

      cacheManager.set('expired-key', 'value', 1000);

      expect(cacheManager.has('expired-key')).toBe(true);

      jest.advanceTimersByTime(1500);

      expect(cacheManager.has('expired-key')).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('size and stats', () => {
    it('should return correct size', () => {
      expect(cacheManager.size()).toBe(0);

      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');

      expect(cacheManager.size()).toBe(2);
    });

    it('should return cache statistics', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2', 5000);

      const stats = cacheManager.getStats();

      expect(stats).toEqual({
        size: 2,
        maxSize: expect.any(Number),
        defaultTtl: expect.any(Number),
        hits: 0,
        misses: 0,
        hitRate: 0
      });
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries during cleanup', () => {
      jest.useFakeTimers();

      cacheManager.set('short-ttl', 'value1', 1000);
      cacheManager.set('long-ttl', 'value2', 10000);

      expect(cacheManager.size()).toBe(2);

      // Avanzar tiempo para expirar la primera entrada
      jest.advanceTimersByTime(2000);

      // Ejecutar cleanup
      cacheManager.cleanup();

      expect(cacheManager.size()).toBe(1);
      expect(cacheManager.get('long-ttl')).toBe('value2');
      expect(cacheManager.get('short-ttl')).toBeUndefined();

      jest.useRealTimers();
    });
  });

  describe('performance tracking', () => {
    it('should track cache hits and misses', () => {
      cacheManager.set('test-key', 'test-value');

      // Hit
      cacheManager.get('test-key');
      // Miss
      cacheManager.get('non-existent');

      const stats = cacheManager.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
  });

  describe('max size limit', () => {
    it('should respect max size limit', () => {
      const smallCache = new CacheManager({ maxSize: 2 });

      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3'); // Should evict oldest

      expect(smallCache.size()).toBe(2);
      expect(smallCache.get('key1')).toBeUndefined(); // Should be evicted
      expect(smallCache.get('key2')).toBe('value2');
      expect(smallCache.get('key3')).toBe('value3');
    });
  });
});
