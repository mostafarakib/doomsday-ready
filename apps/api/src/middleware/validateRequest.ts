import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler.js';

interface RequestValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validateRequest(schemas: RequestValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as unknown as Request['params'];
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as unknown as Request['query'];
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((issue) => {
            const field = issue.path.join('.');
            return field ? `${field}: ${issue.message}` : issue.message;
          })
          .join(', ');
        next(new AppError(400, 'VALIDATION_ERROR', message || 'Invalid request data.'));
        return;
      }
      next(err);
    }
  };
}
