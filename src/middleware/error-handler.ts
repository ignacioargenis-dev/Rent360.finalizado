// Error classes for API handling
export class ValidationError extends Error {
  public field?: string | undefined;
  public statusCode: number = 400;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class AuthenticationError extends Error {
  public statusCode: number = 401;

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  public statusCode: number = 403;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  public statusCode: number = 404;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  public statusCode: number = 409;

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  public statusCode: number = 429;

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ServerError extends Error {
  public statusCode: number = 500;

  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'ServerError';
  }
}

// Error handler utility
export function handleError(error: unknown): {
  message: string;
  statusCode: number;
  field?: string | undefined;
} {
  if (error instanceof ValidationError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      field: error.field
    };
  }

  if (error instanceof AuthenticationError) {
    return {
      message: error.message,
      statusCode: error.statusCode
    };
  }

  if (error instanceof AuthorizationError) {
    return {
      message: error.message,
      statusCode: error.statusCode
    };
  }

  if (error instanceof NotFoundError) {
    return {
      message: error.message,
      statusCode: error.statusCode
    };
  }

  if (error instanceof ConflictError) {
    return {
      message: error.message,
      statusCode: error.statusCode
    };
  }

  if (error instanceof RateLimitError) {
    return {
      message: error.message,
      statusCode: error.statusCode
    };
  }

  if (error instanceof ServerError) {
    return {
      message: error.message,
      statusCode: error.statusCode
    };
  }

  // Generic error
  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500
    };
  }

  return {
    message: 'An unexpected error occurred',
    statusCode: 500
  };
}
