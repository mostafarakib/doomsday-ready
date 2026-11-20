import { z } from 'zod';
import { objectIdSchema } from '../movies/movie.validation.js';

export const createCinemaSchema = z
  .object({
    name: z
      .string('Cinema name is required')
      .trim()
      .min(1, 'Cinema name cannot be empty')
      .max(300, 'Cinema name cannot exceed 300 characters'),
    bundleSizes: z
      .array(
        z
          .number('Each bundle size must be a number')
          .int('Each bundle size must be an integer')
          .min(1, 'Each bundle size must be at least 1')
          .max(500, 'Each bundle size cannot exceed 500'),
        'bundleSizes must be an array of integers',
      )
      .min(1, 'At least 1 bundle size is required')
      .max(10, 'A maximum of 10 bundle sizes is allowed')
      .refine(
        (items) => new Set(items).size === items.length,
        'Duplicate bundle sizes are not allowed',
      ),
  })
  .strict();

export const cinemaParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

export const bookingQuerySchema = z
  .object({
    groupSize: z.coerce
      .number('groupSize must be a valid number')
      .int('Group size must be an integer')
      .min(1, 'Group size must be at least 1')
      .max(10000, 'Group size cannot exceed 10000'),
  })
  .strict();

export type CreateCinemaInput = z.infer<typeof createCinemaSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
