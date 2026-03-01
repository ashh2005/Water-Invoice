import { Router } from 'express';
import * as guntaController from '../controllers/guntaController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.route('/')
  .get(guntaController.getAll)
  .post(authorize('admin'), guntaController.createValidation, guntaController.create);

router.route('/:id')
  .get(guntaController.getById)
  .put(authorize('admin'), guntaController.updateValidation, guntaController.update)
  .delete(authorize('admin'), guntaController.remove);

export default router;
