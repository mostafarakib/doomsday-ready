import { Request, Response, NextFunction } from 'express';
import * as movieService from './movie.service.js';
import { CreateMovieInput, UpdateMovieInput } from './movie.validation.js';

export async function createMovieHandler(
  req: Request<unknown, unknown, CreateMovieInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const movie = await movieService.createMovie(req.body);
    res.status(201).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMoviesHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const movies = await movieService.getMovies();
    res.status(200).json({
      success: true,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMovieHandler(
  req: Request<{ id: string }, unknown, UpdateMovieInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const movie = await movieService.updateMovie(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRewatchOrderHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const plan = await movieService.getRewatchOrder(req.params.id);
    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
}
