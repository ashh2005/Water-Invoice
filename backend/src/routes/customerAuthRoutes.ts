import { Router } from 'express';
import * as customerAuthController from '../controllers/customerAuthController';

const router = Router();

router.post('/login', customerAuthController.loginValidation, customerAuthController.login);

export default router;
