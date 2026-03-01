import { Router } from 'express';
import {
  loginController,
  registerController,
  getProfileController,
  loginValidation,
  registerValidation,
} from '../controllers/authController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.post('/login', loginValidation, loginController);
router.post('/register', protect, authorize('admin'), registerValidation, registerController);
router.get('/profile', protect, getProfileController);

export default router;
