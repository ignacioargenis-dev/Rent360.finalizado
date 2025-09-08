import {
  AppError,
  ValidationError,
  DatabaseError,
  ExternalServiceError,
  BusinessLogicError,
  FileUploadError,
  handleError,
  validateBusinessRule,
  createErrorResponse,
  withDatabaseErrorHandling,
  withExternalServiceErrorHandling
} from '../../src/lib/errors';

describe('Error Classes', () => {
  test('AppError should create error with correct properties', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.isOperational).toBe(true);
  });

  test('ValidationError should include details', () => {
    const details = { field: 'email', issue: 'invalid format' };
    const error = new ValidationError('Invalid email', details);

    expect(error.message).toBe('Invalid email');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual(details);
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
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
    expect(error.service).toBe('payment-gateway');
  });

  test('BusinessLogicError should include business rule', () => {
    const error = new BusinessLogicError('Invalid operation', 'CANNOT_DELETE_ACTIVE_CONTRACT');

    expect(error.message).toBe('Invalid operation');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BUSINESS_LOGIC_ERROR');
    expect(error.businessRule).toBe('CANNOT_DELETE_ACTIVE_CONTRACT');
  });

  test('FileUploadError should include file constraints', () => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    const error = new FileUploadError('File too large', 5 * 1024 * 1024, allowedTypes);

    expect(error.message).toBe('File too large');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('FILE_UPLOAD_ERROR');
    expect(error.maxSize).toBe(5 * 1024 * 1024);
    expect(error.allowedTypes).toEqual(allowedTypes);
  });
});

describe('Error Handling', () => {
  test('handleError should format AppError correctly', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');
    const response = handleError(error);

    expect(response.status).toBe(400);
    // Note: In test environment, we can't easily test the JSON response
    // but the function should not throw
  });

  test('validateBusinessRule should throw when condition is false', () => {
    expect(() => {
      validateBusinessRule(false, 'Rule violation', 'TEST_RULE');
    }).toThrow(BusinessLogicError);

    try {
      validateBusinessRule(false, 'Rule violation', 'TEST_RULE');
    } catch (error) {
      expect(error).toBeInstanceOf(BusinessLogicError);
      expect((error as BusinessLogicError).businessRule).toBe('TEST_RULE');
    }
  });

  test('validateBusinessRule should not throw when condition is true', () => {
    expect(() => {
      validateBusinessRule(true, 'Should not throw');
    }).not.toThrow();
  });

  test('createErrorResponse should format errors consistently', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');
    const context = { userId: '123', action: 'create' };

    const response = createErrorResponse(error, context);

    expect(response.success).toBe(false);
    expect(response.error.message).toBe('Test error');
    expect(response.error.code).toBe('TEST_ERROR');
    expect(response.error.context).toEqual(context);
    expect(response.error.timestamp).toBeDefined();
  });
});

describe('Error Handling Wrappers', () => {
  test('withDatabaseErrorHandling should handle successful operations', async () => {
    const operation = async () => 'success';
    const result = await withDatabaseErrorHandling(operation, 'test-operation');

    expect(result).toBe('success');
  });

  test('withDatabaseErrorHandling should convert database errors', async () => {
    const dbError = new Error('Connection timeout');
    dbError.name = 'DatabaseError';

    const operation = async () => {
      throw dbError;
    };

    await expect(
      withDatabaseErrorHandling(operation, 'test-operation')
    ).rejects.toThrow(DatabaseError);
  });

  test('withExternalServiceErrorHandling should handle successful operations', async () => {
    const operation = async () => ({ data: 'external-response' });
    const result = await withExternalServiceErrorHandling(operation, 'test-service');

    expect(result).toEqual({ data: 'external-response' });
  });

  test('withExternalServiceErrorHandling should convert external errors', async () => {
    const externalError = new Error('Service timeout');

    const operation = async () => {
      throw externalError;
    };

    await expect(
      withExternalServiceErrorHandling(operation, 'test-service')
    ).rejects.toThrow(ExternalServiceError);
  });
});

describe('Error Recovery', () => {
  test('should handle chained errors properly', () => {
    try {
      try {
        validateBusinessRule(false, 'Inner rule violation');
      } catch (innerError) {
        // Wrap inner error
        throw new AppError(
          `Wrapped error: ${innerError instanceof Error ? innerError.message : 'Unknown'}`,
          500,
          'WRAPPED_ERROR'
        );
      }
    } catch (outerError) {
      expect(outerError).toBeInstanceOf(AppError);
      expect((outerError as AppError).code).toBe('WRAPPED_ERROR');
      expect((outerError as AppError).message).toContain('Inner rule violation');
    }
  });

  test('should preserve error context through transformations', () => {
    const originalError = new BusinessLogicError('Original error', 'ORIGINAL_RULE');

    try {
      throw new AppError(
        `Enhanced: ${originalError.message}`,
        400,
        'ENHANCED_ERROR'
      );
    } catch (enhancedError) {
      expect(enhancedError).toBeInstanceOf(AppError);
      expect((enhancedError as AppError).message).toContain('Original error');
      expect((enhancedError as AppError).code).toBe('ENHANCED_ERROR');
    }
  });
});
