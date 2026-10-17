import { Router, Request, Response } from 'express';
import { authRoutes } from './auth-routes.js';
import { userRoutes } from './user-routes.js';
import { noteRoutes } from './note-routes.js';
import { postRoutes } from './post-routes.js';
import { aggregationRoutes } from './aggregation-routes.js';
import { ApiResponse } from '../utils/api-response.js';

const apiRouter = Router();

apiRouter.get('/health', (req: Request, res: Response) => {
  ApiResponse.success(res, 'Secure Notes API operational', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/notes', noteRoutes);
apiRouter.use('/posts', postRoutes);
apiRouter.use('/aggregations', aggregationRoutes);

export { apiRouter };
