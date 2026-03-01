import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as customerAuthService from '../services/customerAuthService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const validate = (req: Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array().map(e => e.msg).join(', '), 400);
};

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const login = asyncHandler(async (req: Request, res: Response) => {
  validate(req);
  const { username, password } = req.body;
  const result = await customerAuthService.customerLogin(username, password);
  sendSuccess(res, result, 'Login successful');
});
