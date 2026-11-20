import { Router } from 'express';
import {
  createMovieHandler,
  getMoviesHandler,
  updateMovieHandler,
  getRewatchOrderHandler,
} from './movie.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createMovieSchema, updateMovieSchema, movieParamsSchema } from './movie.validation.js';

const router = Router();

router.post('/', validateRequest({ body: createMovieSchema }), createMovieHandler);

router.get('/', getMoviesHandler);

router.get(
  '/:id/rewatch-order',
  validateRequest({ params: movieParamsSchema }),
  getRewatchOrderHandler,
);

router.patch(
  '/:id',
  validateRequest({
    params: movieParamsSchema,
    body: updateMovieSchema,
  }),
  updateMovieHandler,
);

export default router;
