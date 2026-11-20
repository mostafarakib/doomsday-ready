import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function start(): Promise<void> {
  // Connect to MongoDB Atlas before accepting requests.
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.info(`API running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
}

start();
