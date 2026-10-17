import { Router } from 'express';
import { PostController } from '../controllers/post-controller.js';
import { authenticateJwt } from '../middlewares/auth-middleware.js';
import { validateBody, validateQuery } from '../middlewares/validate-middleware.js';
import { createPostSchema, listPostsQuerySchema } from '../validations/post-validation.js';

const router = Router();

router.use(authenticateJwt);

router.post('/', validateBody(createPostSchema), PostController.createPost);
router.get('/', validateQuery(listPostsQuerySchema), PostController.getPosts);

export const postRoutes = router;
