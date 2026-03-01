import { Router } from 'express';
import * as customerPortalController from '../controllers/customerPortalController';
import { protectCustomer } from '../middleware/auth';

const router = Router();

router.use(protectCustomer as any);

router.get('/dashboard', customerPortalController.getDashboard as any);
router.get('/invoices', customerPortalController.getInvoices as any);
router.post('/pay', customerPortalController.payValidation, customerPortalController.pay as any);

export default router;
