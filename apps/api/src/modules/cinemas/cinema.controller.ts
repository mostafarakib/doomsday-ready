import { Request, Response, NextFunction } from 'express';
import * as cinemaService from './cinema.service.js';
import { CreateCinemaInput } from './cinema.validation.js';

export async function createCinemaHandler(
  req: Request<unknown, unknown, CreateCinemaInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cinema = await cinemaService.createCinema(req.body);
    res.status(201).json({
      success: true,
      data: cinema,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCinemasHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cinemas = await cinemaService.getCinemas();
    res.status(200).json({
      success: true,
      data: cinemas,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookingQuoteHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const groupSize = Number(req.query.groupSize);
    const quote = await cinemaService.getBookingQuote(req.params.id, groupSize);
    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
}
