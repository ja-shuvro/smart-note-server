import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller.js';
import { validateBody } from '../middlewares/validate-middleware.js';
import { authenticateJwt } from '../middlewares/auth-middleware.js';
import { registerSchema, loginSchema } from '../validations/auth-validation.js';

const router = Router();

router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.get('/me', authenticateJwt, AuthController.getMe);

export const authRoutes = router;
