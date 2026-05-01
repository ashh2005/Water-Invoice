import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { getStaffUsers } from '../controllers/userController';

const router = Router();

router.use(protect);
router.use(authorize('admin'));
router.get('/staff', getStaffUsers);

export default router;
