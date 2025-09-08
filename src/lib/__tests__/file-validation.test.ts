import { getValidationConfig, validateFileName } from '../file-validation';

describe('File Validation', () => {
  describe('getValidationConfig', () => {
    it('should return correct config for document type', () => {
      const config = getValidationConfig('document');

      expect(config).toEqual({
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        allowedExtensions: ['.pdf', '.doc', '.docx'],
        scanContent: true,
        checkIntegrity: true
      });
    });

    it('should return correct config for image type', () => {
      const config = getValidationConfig('image');

      expect(config).toEqual({
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
        scanContent: true,
        checkIntegrity: true
      });
    });

    it('should handle unknown types gracefully', () => {
      // @ts-expect-error Testing invalid type
      expect(() => getValidationConfig('unknown')).toThrow();
    });
  });

  describe('validateFileName', () => {
    it('should validate clean file names', () => {
      const result = validateFileName('document.pdf');

      expect(result).toEqual({
        valid: true,
        errors: []
      });
    });

    it('should reject dangerous characters', () => {
      const result = validateFileName('doc<>ument.pdf');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Nombre de archivo contiene caracteres peligrosos');
    });

    it('should reject empty names', () => {
      const result = validateFileName('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Nombre de archivo requerido');
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(256);
      const result = validateFileName(longName);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Nombre de archivo demasiado largo');
    });
  });
});
