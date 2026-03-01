import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/dashboard', reportController.getDashboard);
router.get('/monthly-collection', reportController.getMonthlyCollection);
router.get('/defaulters', reportController.getDefaulters);
router.get('/collection-summary', reportController.getCollectionSummary);

export default router;
