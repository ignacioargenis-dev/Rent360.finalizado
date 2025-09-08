import { sanitizeInput, sanitizePhone, sanitizeRUT, userSchema } from '../input-validation';

describe('Input Validation', () => {
  describe('sanitizeInput', () => {
    it('should sanitize basic input', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeInput(input);

      expect(result).toBe('Hello  World');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should handle empty input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should truncate long input', () => {
      const longInput = 'a'.repeat(300);
      const result = sanitizeInput(longInput);

      expect(result.length).toBeLessThanOrEqual(254);
    });
  });

  describe('sanitizePhone', () => {
    it('should sanitize phone numbers', () => {
      expect(sanitizePhone('+56 9 8765 4321')).toBe('+56987654321');
      expect(sanitizePhone('(56) 98765-4321')).toBe('56987654321');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizePhone('')).toBe('');
      expect(sanitizePhone(null as any)).toBe('');
      expect(sanitizePhone('invalid-phone')).toBe('');
    });
  });

  describe('sanitizeRUT', () => {
    it('should sanitize RUT numbers', () => {
      expect(sanitizeRUT('12.345.678-9')).toBe('123456789');
      expect(sanitizeRUT('12345678-K')).toBe('12345678K');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeRUT('')).toBe('');
      expect(sanitizeRUT(null as any)).toBe('');
      expect(sanitizeRUT('invalid-rut')).toBe('');
    });
  });

  describe('userSchema validation', () => {
    it('should validate valid user data', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        name: 'Test User',
        phone: '+56987654321',
        rut: '12345678-9'
      };

      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'ValidPass123!',
        name: 'Test User'
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('email');
    });

    it('should reject weak password', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User'
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject invalid RUT', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        name: 'Test User',
        rut: 'invalid-rut'
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });
});
