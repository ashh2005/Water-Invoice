import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/webhook', paymentController.webhookValidation, paymentController.handleWebhook);

router.use(protect);

router.get('/', paymentController.getAll);
router.post('/cash', paymentController.cashPaymentValidation, paymentController.recordCash);
router.post('/online', paymentController.onlinePaymentValidation, paymentController.createOnline);

export default router;
