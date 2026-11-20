import { Booking, IBooking } from './booking.model.js';
import { Cinema } from '../cinemas/cinema.model.js';
import { calculateMinimumBundles } from '../cinemas/cinema.booking.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateBookingInput } from './booking.validation.js';

export async function createBooking(input: CreateBookingInput): Promise<IBooking> {
  const cinema = await Cinema.findById(input.cinemaId);
  if (!cinema) {
    throw new AppError(404, 'NOT_FOUND', `Cinema with ID ${input.cinemaId} not found.`);
  }

  // Recalculate optimal bundle combination on the server
  const calculation = calculateMinimumBundles(cinema.bundleSizes, input.groupSize);

  if (!calculation.possible) {
    throw new AppError(
      400,
      'IMPOSSIBLE_BOOKING',
      `No exact bundle combination exists for group size ${input.groupSize} at ${cinema.name}.`,
    );
  }

  // Persist the calculated booking plan with snapshots of cinema details
  const booking = await Booking.create({
    cinema: cinema._id,
    cinemaName: cinema.name,
    groupSize: input.groupSize,
    bundleSizes: [...cinema.bundleSizes],
    bundleBreakdown: calculation.bundleBreakdown,
    totalBundles: calculation.totalBundles,
    totalSeats: calculation.totalSeats,
    status: 'saved',
  });

  return booking;
}

export async function getBookings(): Promise<IBooking[]> {
  return Booking.find().sort({ createdAt: -1 });
}
