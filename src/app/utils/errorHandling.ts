/**
 * Standardized error handling utilities
 * Provides consistent error types and handling across the application
 */

/**
 * Application error codes
 */
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  DUPLICATE = "DUPLICATE",
  DATABASE_ERROR = "DATABASE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Custom application error class
 */
export class ApplicationError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApplicationError";
    Object.setPrototypeOf(this, ApplicationError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = ApplicationError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful result
 */
export const success = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

/**
 * Create a failed result
 */
export const failure = <E = ApplicationError>(error: E): Result<never, E> => ({
  success: false,
  error,
});

/**
 * Extract error message from unknown error
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApplicationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unknown error occurred";
};

/**
 * Check if an error is of a specific error code
 */
export const isErrorCode = (error: unknown, code: ErrorCode): boolean => {
  return error instanceof ApplicationError && error.code === code;
};

/**
 * Wrap async operations with error handling
 */
export async function tryCatch<T>(
  operation: () => Promise<T>,
  errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR
): Promise<Result<T>> {
  try {
    const data = await operation();
    return success(data);
  } catch (error) {
    const message = getErrorMessage(error);
    const appError = new ApplicationError(errorCode, message);
    return failure(appError);
  }
}
