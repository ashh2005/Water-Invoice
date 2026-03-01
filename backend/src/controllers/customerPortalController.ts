import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as customerPortalService from '../services/customerPortalService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { CustomerAuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';

const validate = (req: CustomerAuthRequest) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array().map(e => e.msg).join(', '), 400);
};

export const getDashboard = asyncHandler(async (req: CustomerAuthRequest, res: Response) => {
  const result = await customerPortalService.getCustomerDashboard(String(req.customer!._id));
  sendSuccess(res, result);
});

export const getInvoices = asyncHandler(async (req: CustomerAuthRequest, res: Response) => {
  const invoices = await customerPortalService.getCustomerInvoices(String(req.customer!._id));
  sendSuccess(res, invoices);
});

export const payValidation = [
  body('fromMonth').matches(/^\d{4}-\d{2}$/).withMessage('fromMonth must be YYYY-MM'),
  body('toMonth').matches(/^\d{4}-\d{2}$/).withMessage('toMonth must be YYYY-MM'),
];

export const pay = asyncHandler(async (req: CustomerAuthRequest, res: Response) => {
  validate(req);
  const { fromMonth, toMonth } = req.body;
  const result = await customerPortalService.initiateCustomerPayment(
    String(req.customer!._id),
    fromMonth,
    toMonth
  );
  sendSuccess(res, result, 'Payment initiated', 201);
});
