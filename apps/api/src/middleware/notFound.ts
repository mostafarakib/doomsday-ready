import { Request, Response, NextFunction } from 'express';

/**
 * Returned when no route matches the request path.
 * Always produces a 404 with a stable error code the frontend can rely on.
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found.`,
    },
  });
}
