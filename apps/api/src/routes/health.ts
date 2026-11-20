import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/health
 *
 * Returns the current status of the API and the MongoDB connection.
 * The frontend and monitoring tools can poll this to confirm the service is up.
 */
router.get('/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;

  // Mongoose readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    },
  });
});

export default router;
