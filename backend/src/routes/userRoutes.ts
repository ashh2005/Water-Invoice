import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getStaffUsers } from '../controllers/userController';

const router = Router();

router.use(protect);
router.get('/staff', getStaffUsers);

export default router;
