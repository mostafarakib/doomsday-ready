import { Router } from 'express';
import { createBookingHandler, getBookingsHandler } from './booking.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createBookingSchema } from './booking.validation.js';

const router = Router();

router.post('/', validateRequest({ body: createBookingSchema }), createBookingHandler);
router.get('/', getBookingsHandler);

export default router;
