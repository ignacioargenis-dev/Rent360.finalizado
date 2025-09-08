import { describe, it, expect } from '@jest/globals';

describe('Basic Test Suite', () => {
  it('debería pasar un test básico', () => {
    expect(1 + 1).toBe(2);
  });

  it('debería validar objetos', () => {
    const obj = { name: 'test', value: 123 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(123);
  });

  it('debería manejar arrays', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toHaveLength(5);
    expect(arr).toContain(3);
    expect(arr[0]).toBe(1);
  });

  it('debería validar strings', () => {
    const str = 'Hola Mundo';
    expect(str).toContain('Hola');
    expect(str).toHaveLength(10);
    expect(str.toLowerCase()).toBe('hola mundo');
  });

  it('debería manejar promesas', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });

  it('debería validar números', () => {
    expect(10).toBeGreaterThan(5);
    expect(10).toBeLessThan(20);
    expect(10.5).toBe(10.5);
  });
});
