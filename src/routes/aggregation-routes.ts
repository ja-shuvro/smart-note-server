import { Router } from 'express';
import { AggregationController } from '../controllers/aggregation-controller.js';
import { authenticateJwt } from '../middlewares/auth-middleware.js';

const router = Router();

// Endpoints protected by JWT
router.use(authenticateJwt);

// Scenario 1: Group by Interests (exactly one collection.aggregate() call)
router.get('/interests', AggregationController.getUsersByInterests);

// Scenario 2: User Posts ($lookup pipeline)
router.get('/users/:userId/posts', AggregationController.getUserPosts);

export const aggregationRoutes = router;
