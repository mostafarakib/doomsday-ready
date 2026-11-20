import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import healthRouter from './routes/health.js';
import movieRouter from './modules/movies/movie.routes.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// --- Core middleware ---
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());

// --- Routes ---
app.use('/api', healthRouter);
app.use('/api/movies', movieRouter);

// --- Fallback middleware (order matters: 404 before error handler) ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
