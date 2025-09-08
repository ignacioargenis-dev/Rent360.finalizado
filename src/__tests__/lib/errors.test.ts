import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
  FileUploadError,
  BusinessLogicError,
  validateFileUpload,
  validateBusinessRule,
  createErrorResponse,
  isValidEmail,
  isValidPassword
} from '@/lib/errors';

describe('Error Classes', () => {
  test('AppError should create error with correct properties', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.isOperational).toBe(true);
  });

  test('ValidationError should extend AppError', () => {
    const details = { field: 'email', value: 'invalid' };
    const error = new ValidationError('Invalid email', details);
    expect(error.message).toBe('Invalid email');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toBe(details);
  });

  test('AuthenticationError should have correct defaults', () => {
    const error = new AuthenticationError();
    expect(error.message).toBe('Authentication required');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('AUTHENTICATION_ERROR');
  });

  test('AuthorizationError should have correct defaults', () => {
    const error = new AuthorizationError();
    expect(error.message).toBe('Insufficient permissions');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('AUTHORIZATION_ERROR');
  });

  test('NotFoundError should have correct defaults', () => {
    const error = new NotFoundError();
    expect(error.message).toBe('Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND_ERROR');
  });

  test('DatabaseError should have correct defaults', () => {
    const error = new DatabaseError();
    expect(error.message).toBe('Database operation failed');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('DATABASE_ERROR');
  });

  test('ExternalServiceError should include service name', () => {
    const error = new ExternalServiceError('Service unavailable', 'payment-gateway');
    expect(error.message).toBe('Service unavailable');
    expect(error.service).toBe('payment-gateway');
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
  });

  test('FileUploadError should include file constraints', () => {
    const error = new FileUploadError('File too large', 5 * 1024 * 1024, ['image/jpeg']);
    expect(error.message).toBe('File too large');
    expect(error.maxSize).toBe(5 * 1024 * 1024);
    expect(error.allowedTypes).toEqual(['image/jpeg']);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('FILE_UPLOAD_ERROR');
  });

  test('BusinessLogicError should include business rule', () => {
    const error = new BusinessLogicError('Invalid contract dates', 'contract_end_before_start');
    expect(error.message).toBe('Invalid contract dates');
    expect(error.businessRule).toBe('contract_end_before_start');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BUSINESS_LOGIC_ERROR');
  });
});

describe('Validation Functions', () => {
  describe('validateFileUpload', () => {
    test('should not throw for valid file', () => {
      const validFile = {
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg'
      } as File;

      expect(() => validateFileUpload(validFile)).not.toThrow();
    });

    test('should throw for file too large', () => {
      const largeFile = {
        size: 10 * 1024 * 1024, // 10MB
        type: 'image/jpeg'
      } as File;

      expect(() => validateFileUpload(largeFile)).toThrow(FileUploadError);
    });

    test('should throw for invalid file type', () => {
      const invalidFile = {
        size: 1024 * 1024, // 1MB
        type: 'application/exe'
      } as File;

      expect(() => validateFileUpload(invalidFile)).toThrow(FileUploadError);
    });
  });

  describe('validateBusinessRule', () => {
    test('should not throw for valid condition', () => {
      expect(() => validateBusinessRule(true, 'Valid condition')).not.toThrow();
    });

    test('should throw for invalid condition', () => {
      expect(() => validateBusinessRule(false, 'Invalid condition')).toThrow(BusinessLogicError);
    });
  });

  describe('isValidEmail', () => {
    test('should return true for valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.email+tag@domain.co.uk')).toBe(true);
    });

    test('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    test('should return valid for strong password', () => {
      const result = isValidPassword('StrongPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return invalid for weak password', () => {
      const result = isValidPassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should validate all password requirements', () => {
      const result = isValidPassword('weakpass');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });
});

describe('Error Response Creation', () => {
  test('createErrorResponse should format AppError correctly', () => {
    const error = new ValidationError('Test validation error', { field: 'email' });
    const response = createErrorResponse(error);

    expect(response.success).toBe(false);
    expect(response.error.message).toBe('Test validation error');
    expect(response.error.code).toBe('VALIDATION_ERROR');
    expect(response.error.timestamp).toBeDefined();
  });

  test('createErrorResponse should format generic error correctly', () => {
    const error = new Error('Generic error');
    const context = { userId: '123' };
    const response = createErrorResponse(error, context);

    expect(response.success).toBe(false);
    expect(response.error.message).toBe('Error interno del servidor');
    expect(response.error.code).toBe('INTERNAL_ERROR');
    expect(response.error.context).toBe(context);
  });

  test('createErrorResponse should handle unknown errors', () => {
    const error = 'String error';
    const response = createErrorResponse(error);

    expect(response.success).toBe(false);
    expect(response.error.message).toBe('Error desconocido');
    expect(response.error.code).toBe('UNKNOWN_ERROR');
  });
});
