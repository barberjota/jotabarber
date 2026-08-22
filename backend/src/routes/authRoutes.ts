import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authGuard, getProfile);

export default router;
