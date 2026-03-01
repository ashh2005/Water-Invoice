import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.route('/')
  .get(customerController.getAll)
  .post(customerController.createValidation, customerController.create);

router.route('/:id')
  .get(customerController.getById)
  .put(customerController.updateValidation, customerController.update)
  .delete(customerController.remove);

export default router;
