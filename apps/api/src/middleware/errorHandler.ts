import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Shape of an error that our application code may throw to signal a known failure.
 * Services and controllers can throw this directly instead of calling next(err).
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Centralised error handler.  Express identifies this as an error middleware
 * because it has four parameters.
 *
 * Rules enforced here:
 * - AppError instances are forwarded with their status code and error code intact.
 * - Mongoose duplicate-key errors (11000) are translated into a 409.
 * - Everything else becomes a generic 500 in production so internal details
 *   are never exposed to callers.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Mongoose duplicate key
  if (isMongooseDuplicateKeyError(err)) {
    res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE', message: 'A resource with that value already exists.' },
    });
    return;
  }

  // Log the full error on the server but hide details from the client.
  console.error('Unhandled error:', err);

  const message =
    env.NODE_ENV === 'development' && err instanceof Error
      ? err.message
      : 'An unexpected error occurred.';

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message },
  });
}

function isMongooseDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  );
}
