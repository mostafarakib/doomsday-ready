import { Router } from 'express';
import {
  createCinemaHandler,
  getCinemasHandler,
  getBookingQuoteHandler,
} from './cinema.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createCinemaSchema, cinemaParamsSchema, bookingQuerySchema } from './cinema.validation.js';

const router = Router();

router.post('/', validateRequest({ body: createCinemaSchema }), createCinemaHandler);

router.get('/', getCinemasHandler);

router.get(
  '/:id/booking',
  validateRequest({
    params: cinemaParamsSchema,
    query: bookingQuerySchema,
  }),
  getBookingQuoteHandler,
);

export default router;
