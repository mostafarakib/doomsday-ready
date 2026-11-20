import { z } from 'zod';
import { isValidObjectId } from '../../utils/objectId.js';

export const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => isValidObjectId(val), {
    message: 'Invalid ObjectId format',
  });

export const createMovieSchema = z
  .object({
    title: z
      .string('Title is required')
      .trim()
      .min(1, 'Title cannot be empty')
      .max(300, 'Title cannot exceed 300 characters'),
    releaseYear: z
      .number('Release year is required')
      .int('Release year must be an integer')
      .positive('Release year must be a positive integer'),
    runtime: z
      .number('Runtime is required')
      .int('Runtime must be an integer')
      .min(1, 'Runtime must be at least 1 minute')
      .max(300, 'Runtime cannot exceed 300 minutes'),
    prerequisites: z
      .array(objectIdSchema, 'Prerequisites must be an array of IDs')
      .optional()
      .default([])
      .refine(
        (items) => new Set(items).size === items.length,
        'Duplicate prerequisite IDs are not allowed',
      ),
    watched: z.boolean().optional().default(false),
  })
  .strict();

export const updateMovieSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty')
      .max(300, 'Title cannot exceed 300 characters')
      .optional(),
    releaseYear: z
      .number()
      .int('Release year must be an integer')
      .positive('Release year must be a positive integer')
      .optional(),
    runtime: z
      .number()
      .int('Runtime must be an integer')
      .min(1, 'Runtime must be at least 1 minute')
      .max(300, 'Runtime cannot exceed 300 minutes')
      .optional(),
    prerequisites: z
      .array(objectIdSchema, 'Prerequisites must be an array of IDs')
      .optional()
      .refine(
        (items) => !items || new Set(items).size === items.length,
        'Duplicate prerequisite IDs are not allowed',
      ),
    watched: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const movieParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
