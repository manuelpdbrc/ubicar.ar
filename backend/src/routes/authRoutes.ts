import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { validate } from '../middleware/validateMiddleware';
import { authenticate } from '../middleware/authMiddleware';
import { registerSchema, loginSchema } from '../validators/authSchemas';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
