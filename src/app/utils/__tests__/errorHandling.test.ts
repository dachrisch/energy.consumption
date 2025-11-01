import {
  ApplicationError,
  ErrorCode,
  success,
  failure,
  getErrorMessage,
  isErrorCode,
  tryCatch,
} from '../errorHandling';

describe('ApplicationError', () => {
  it('should create error with all properties', () => {
    const error = new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      400,
      { field: 'email' }
    );

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: 'email' });
    expect(error.name).toBe('ApplicationError');
  });

  it('should use default status code 500 if not provided', () => {
    const error = new ApplicationError(
      ErrorCode.DATABASE_ERROR,
      'Database connection failed'
    );

    expect(error.statusCode).toBe(500);
  });

  it('should serialize to JSON correctly', () => {
    const error = new ApplicationError(
      ErrorCode.NOT_FOUND,
      'Resource not found',
      404
    );

    const json = error.toJSON();

    expect(json).toEqual({
      code: ErrorCode.NOT_FOUND,
      message: 'Resource not found',
      statusCode: 404,
      details: undefined,
    });
  });
});

describe('Result type helpers', () => {
  describe('success', () => {
    it('should create success result with data', () => {
      const result = success({ id: 1, name: 'Test' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: 1, name: 'Test' });
      }
    });

    it('should handle primitive data types', () => {
      const stringResult = success('test string');
      const numberResult = success(42);
      const boolResult = success(true);

      expect(stringResult.success).toBe(true);
      expect(numberResult.success).toBe(true);
      expect(boolResult.success).toBe(true);
    });
  });

  describe('failure', () => {
    it('should create failure result with error', () => {
      const error = new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid input'
      );
      const result = failure(error);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });

    it('should handle string errors', () => {
      const result = failure('Simple error message');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Simple error message');
      }
    });
  });
});

describe('getErrorMessage', () => {
  it('should extract message from ApplicationError', () => {
    const error = new ApplicationError(
      ErrorCode.DATABASE_ERROR,
      'Connection failed'
    );

    expect(getErrorMessage(error)).toBe('Connection failed');
  });

  it('should extract message from Error', () => {
    const error = new Error('Standard error');

    expect(getErrorMessage(error)).toBe('Standard error');
  });

  it('should return string error as-is', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('should return default message for unknown error types', () => {
    expect(getErrorMessage(null)).toBe('An unknown error occurred');
    expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
    expect(getErrorMessage(42)).toBe('An unknown error occurred');
    expect(getErrorMessage({})).toBe('An unknown error occurred');
  });
});

describe('isErrorCode', () => {
  it('should return true for matching error code', () => {
    const error = new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed'
    );

    expect(isErrorCode(error, ErrorCode.VALIDATION_ERROR)).toBe(true);
  });

  it('should return false for non-matching error code', () => {
    const error = new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed'
    );

    expect(isErrorCode(error, ErrorCode.NOT_FOUND)).toBe(false);
  });

  it('should return false for non-ApplicationError', () => {
    const error = new Error('Standard error');

    expect(isErrorCode(error, ErrorCode.VALIDATION_ERROR)).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isErrorCode('error', ErrorCode.VALIDATION_ERROR)).toBe(false);
    expect(isErrorCode(null, ErrorCode.VALIDATION_ERROR)).toBe(false);
    expect(isErrorCode(undefined, ErrorCode.VALIDATION_ERROR)).toBe(false);
  });
});

describe('tryCatch', () => {
  it('should return success for successful operation', async () => {
    const operation = async () => {
      return { data: 'success' };
    };

    const result = await tryCatch(operation);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ data: 'success' });
    }
  });

  it('should return failure for throwing operation', async () => {
    const operation = async () => {
      throw new Error('Operation failed');
    };

    const result = await tryCatch(operation, ErrorCode.DATABASE_ERROR);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(result.error.message).toBe('Operation failed');
    }
  });

  it('should use default error code if not provided', async () => {
    const operation = async () => {
      throw new Error('Unknown error');
    };

    const result = await tryCatch(operation);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCode.UNKNOWN_ERROR);
    }
  });

  it('should handle ApplicationError thrown from operation', async () => {
    const operation = async () => {
      throw new ApplicationError(
        ErrorCode.NOT_FOUND,
        'Resource not found',
        404
      );
    };

    const result = await tryCatch(operation);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Resource not found');
    }
  });

  it('should handle string errors', async () => {
    const operation = async () => {
      throw 'String error';
    };

    const result = await tryCatch(operation, ErrorCode.NETWORK_ERROR);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('String error');
      expect(result.error.code).toBe(ErrorCode.NETWORK_ERROR);
    }
  });

  it('should handle promises that resolve', async () => {
    const result = await tryCatch(() => Promise.resolve(42));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(42);
    }
  });

  it('should handle promises that reject', async () => {
    const result = await tryCatch(() =>
      Promise.reject(new Error('Rejected'))
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Rejected');
    }
  });
});
