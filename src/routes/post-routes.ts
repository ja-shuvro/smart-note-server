import { Router } from 'express';
import { PostController } from '../controllers/post-controller.js';
import { authenticateJwt } from '../middlewares/auth-middleware.js';
import { authorizeRoles } from '../middlewares/role-middleware.js';
import { validateBody, validateQuery } from '../middlewares/validate-middleware.js';
import {
  createPostSchema,
  listPostsQuerySchema,
  updatePostStatusSchema,
} from '../validations/post-validation.js';

const router = Router();

router.use(authenticateJwt);

router.post('/', validateBody(createPostSchema), PostController.createPost);
router.get('/', validateQuery(listPostsQuerySchema), PostController.getPosts);
router.patch(
  '/:id/status',
  authorizeRoles('admin'),
  validateBody(updatePostStatusSchema),
  PostController.updateStatus
);
router.delete('/:id', PostController.deletePost);

export const postRoutes = router;


