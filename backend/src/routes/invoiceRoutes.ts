import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', invoiceController.getAll);
router.get('/:id', invoiceController.getById);
router.post('/:id/resend-sms', invoiceController.resendSMS);

export default router;
