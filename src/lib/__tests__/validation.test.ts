// Mock the logger to avoid Next.js conflicts
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

import {
  validateRutFormat,
  validateEmail,
  validatePhone,
  validatePassword,
  validateAmount,
  validatePercentage,
} from '../validations'

describe('Validation Functions', () => {
  describe('validateRutFormat', () => {
    it('should validate correct RUT format', () => {
      // RUTs válidos según el algoritmo chileno
      expect(validateRutFormat('12345678-5')).toBe(true)
      expect(validateRutFormat('12345678-9')).toBe(false) // Este RUT no es válido
      expect(validateRutFormat('12345678-k')).toBe(false) // Este RUT no es válido
      expect(validateRutFormat('12345678-K')).toBe(false) // Este RUT no es válido
    })

    it('should reject invalid RUT format', () => {
      expect(validateRutFormat('12345678')).toBe(false)
      expect(validateRutFormat('12345678-')).toBe(false)
      expect(validateRutFormat('12345678-x')).toBe(false)
      expect(validateRutFormat('')).toBe(false)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('test+tag@example.com')).toBe(true)
    })

    it('should reject invalid email format', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate correct phone format', () => {
      expect(validatePhone('+56912345678')).toBe(true)
      expect(validatePhone('912345678')).toBe(true)
      expect(validatePhone('+56 9 1234 5678')).toBe(true)
    })

    it('should reject invalid phone format', () => {
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('invalid')).toBe(false)
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = validatePassword('StrongPass123!')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject weak password', () => {
      const result = validatePassword('weak')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateAmount(100)).toBe(true)
      expect(validateAmount(0)).toBe(true)
      expect(validateAmount(999999.99)).toBe(true)
    })

    it('should reject negative amounts', () => {
      expect(validateAmount(-100)).toBe(false)
      expect(validateAmount(-0.01)).toBe(false)
    })
  })

  describe('validatePercentage', () => {
    it('should validate valid percentages', () => {
      expect(validatePercentage(0)).toBe(true)
      expect(validatePercentage(50)).toBe(true)
      expect(validatePercentage(100)).toBe(true)
    })

    it('should reject invalid percentages', () => {
      expect(validatePercentage(-1)).toBe(false)
      expect(validatePercentage(101)).toBe(false)
    })
  })
})
