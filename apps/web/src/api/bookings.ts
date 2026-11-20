import { apiRequest } from './client.ts';
import {
  Cinema,
  BookingQuote,
  BookingPlan,
  CreateBookingInput,
  CreateCinemaInput,
} from '../types/booking.ts';

export const bookingApi = {
  getCinemas: (): Promise<Cinema[]> => {
    return apiRequest<Cinema[]>('/api/cinemas');
  },

  createCinema: (data: CreateCinemaInput): Promise<Cinema> => {
    return apiRequest<Cinema>('/api/cinemas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getBookingQuote: (cinemaId: string, groupSize: number): Promise<BookingQuote> => {
    return apiRequest<BookingQuote>(`/api/cinemas/${cinemaId}/booking?groupSize=${groupSize}`);
  },

  saveBooking: (data: CreateBookingInput): Promise<BookingPlan> => {
    return apiRequest<BookingPlan>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getBookings: (): Promise<BookingPlan[]> => {
    return apiRequest<BookingPlan[]>('/api/bookings');
  },
};
