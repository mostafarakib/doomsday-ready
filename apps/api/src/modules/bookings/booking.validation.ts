import { z } from 'zod';
import { objectIdSchema } from '../movies/movie.validation.js';

export const createBookingSchema = z
  .object({
    cinemaId: objectIdSchema.optional(),
    cinema: objectIdSchema.optional(),
    groupSize: z
      .number('Group size is required')
      .int('Group size must be an integer')
      .min(1, 'Group size must be at least 1')
      .max(10000, 'Group size cannot exceed 10000'),
    // Potential client-supplied fields stripped to guarantee server calculation
    bundleBreakdown: z.unknown().optional(),
    totalBundles: z.unknown().optional(),
    totalSeats: z.unknown().optional(),
    bundleSizes: z.unknown().optional(),
    cinemaName: z.unknown().optional(),
    status: z.unknown().optional(),
  })
  .refine((data) => Boolean(data.cinemaId || data.cinema), {
    message: 'Cinema ID is required',
    path: ['cinemaId'],
  })
  .transform((data) => ({
    cinemaId: (data.cinemaId || data.cinema) as string,
    groupSize: data.groupSize,
  }));

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
