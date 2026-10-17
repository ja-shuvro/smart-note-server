import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middlewares/error-middleware.js';
import { apiRouter } from './routes/index.js';

export const createApp = (): Application => {
  const app = express();

  // Security & HTTP Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => callback(null, true),
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // Ensure DB connection for serverless invocations (e.g., Vercel)
  app.use(async (_req, _res, next) => {
    try {
      await connectDatabase();
      next();
    } catch (err) {
      next(err);
    }
  });

  // Master API router
  app.use('/api', apiRouter);

  // Root welcome / health check
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Secure Note-Taking API is running on Vercel',
      health: '/api/health',
    });
  });

  // Catch unhandled routes
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

const app = createApp();

export default app;

