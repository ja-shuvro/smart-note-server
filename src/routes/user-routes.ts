import { Router } from 'express';
import { UserController } from '../controllers/user-controller.js';
import { authenticateJwt } from '../middlewares/auth-middleware.js';
import { authorizeRoles } from '../middlewares/role-middleware.js';
import { validateBody, validateQuery } from '../middlewares/validate-middleware.js';
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  listUsersQuerySchema,
} from '../validations/user-validation.js';

const router = Router();

// Guard: All user management endpoints require Admin role
router.use(authenticateJwt);
router.use(authorizeRoles('admin'));

router.get('/', validateQuery(listUsersQuerySchema), UserController.getUsers);
router.post('/', validateBody(adminCreateUserSchema), UserController.createUser);
router.get('/:id', UserController.getUser);
router.put('/:id', validateBody(adminUpdateUserSchema), UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

export const userRoutes = router;
