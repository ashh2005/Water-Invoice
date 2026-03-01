import { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import * as authService from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'staff']).withMessage('Role must be admin or staff'),
];

const handleValidationErrors = (req: AuthRequest, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map(e => e.msg).join(', '), 400);
  }
};

export const loginController = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  handleValidationErrors(req, next);
  const { username, password } = req.body;
  const result = await authService.login(username, password);
  sendSuccess(res, result, 'Login successful');
});

export const registerController = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  handleValidationErrors(req, next);
  const result = await authService.register(req.body);
  sendSuccess(res, result, 'User registered successfully', 201);
});

export const getProfileController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.getProfile(String(req.user!._id));
  sendSuccess(res, result);
});
