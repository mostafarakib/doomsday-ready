import { Request, Response, NextFunction } from 'express';
import * as bookingService from './booking.service.js';
import { CreateBookingInput } from './booking.validation.js';

export async function createBookingHandler(
  req: Request<unknown, unknown, CreateBookingInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const booking = await bookingService.createBooking(req.body);
    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookingsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bookings = await bookingService.getBookings();
    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
}
