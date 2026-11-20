export interface Cinema {
  _id: string;
  name: string;
  normalizedName: string;
  bundleSizes: number[];
  createdAt: string;
  updatedAt: string;
}

export interface BundleBreakdownItem {
  size: number;
  quantity: number;
}

export interface BookingQuotePossible {
  cinemaId: string;
  cinemaName: string;
  groupSize: number;
  possible: true;
  totalBundles: number;
  totalSeats: number;
  bundleBreakdown: BundleBreakdownItem[];
}

export interface BookingQuoteImpossible {
  cinemaId: string;
  cinemaName: string;
  groupSize: number;
  possible: false;
}

export type BookingQuote = BookingQuotePossible | BookingQuoteImpossible;

export interface BookingPlan {
  _id: string;
  cinema: string;
  cinemaName: string;
  groupSize: number;
  bundleSizes: number[];
  bundleBreakdown: BundleBreakdownItem[];
  totalBundles: number;
  totalSeats: number;
  status: 'saved';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingInput {
  cinemaId: string;
  groupSize: number;
}

export interface CreateCinemaInput {
  name: string;
  bundleSizes: number[];
}
