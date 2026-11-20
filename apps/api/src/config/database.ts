import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    // Log the failure but keep the server running so the health endpoint and
    // other non-database routes remain reachable.  API endpoints that need the
    // database will fail gracefully with their own error handling.
    console.error('MongoDB connection failed — server will continue without a database:', error);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB error:', error);
});
