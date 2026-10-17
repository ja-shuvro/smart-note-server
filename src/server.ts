import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`[Server] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      console.log(`[Health] http://localhost:${env.PORT}/api/health`);
    });

    const shutdown = (signal: string) => {
      console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
