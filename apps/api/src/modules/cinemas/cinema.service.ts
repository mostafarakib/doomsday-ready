import { Cinema, ICinema } from './cinema.model.js';
import { CreateCinemaInput } from './cinema.validation.js';
import { normalizeName } from '../../utils/objectId.js';
import { AppError } from '../../middleware/errorHandler.js';
import { calculateMinimumBundles, BundleBreakdownItem } from './cinema.booking.js';

export type BookingQuoteResponse =
  | {
      cinemaId: string;
      cinemaName: string;
      groupSize: number;
      possible: true;
      totalBundles: number;
      totalSeats: number;
      bundleBreakdown: BundleBreakdownItem[];
    }
  | {
      cinemaId: string;
      cinemaName: string;
      groupSize: number;
      possible: false;
    };

export async function createCinema(input: CreateCinemaInput): Promise<ICinema> {
  const normalizedName = normalizeName(input.name);

  // Check duplicate cinema name
  const existing = await Cinema.findOne({ normalizedName });
  if (existing) {
    throw new AppError(409, 'DUPLICATE_NAME', `A cinema with name "${input.name}" already exists.`);
  }

  const cinema = await Cinema.create({
    name: input.name.trim(),
    normalizedName,
    bundleSizes: input.bundleSizes,
  });

  return cinema;
}

export async function getCinemas(): Promise<ICinema[]> {
  return Cinema.find().sort({ name: 1 });
}

export async function getBookingQuote(
  cinemaId: string,
  groupSize: number,
): Promise<BookingQuoteResponse> {
  const cinema = await Cinema.findById(cinemaId);
  if (!cinema) {
    throw new AppError(404, 'NOT_FOUND', `Cinema with ID ${cinemaId} not found.`);
  }

  const calculation = calculateMinimumBundles(cinema.bundleSizes, groupSize);

  if (!calculation.possible) {
    return {
      cinemaId: cinema._id.toString(),
      cinemaName: cinema.name,
      groupSize,
      possible: false,
    };
  }

  return {
    cinemaId: cinema._id.toString(),
    cinemaName: cinema.name,
    groupSize,
    possible: true,
    totalBundles: calculation.totalBundles,
    totalSeats: calculation.totalSeats,
    bundleBreakdown: calculation.bundleBreakdown,
  };
}
