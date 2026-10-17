import { Router } from 'express';
import { AiController } from '../controllers/ai-controller.js';
import { authenticateJwt } from '../middlewares/auth-middleware.js';
import { validateBody } from '../middlewares/validate-middleware.js';
import { suggestTagsSchema } from '../validations/ai-validation.js';

const router = Router();

router.use(authenticateJwt);

router.post('/suggest-tags', validateBody(suggestTagsSchema), AiController.suggestTags);

export const aiRoutes = router;
