import { Request, Response } from 'express';
import { body } from 'express-validator';
import { validationResult } from 'express-validator';
import * as paymentService from '../services/paymentService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const validate = (req: Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array().map(e => e.msg).join(', '), 400);
};

export const cashPaymentValidation = [
  body('customerId').isMongoId().withMessage('Valid customer ID is required'),
  body('fromMonth').matches(/^\d{4}-\d{2}$/).withMessage('fromMonth must be YYYY-MM'),
  body('toMonth').matches(/^\d{4}-\d{2}$/).withMessage('toMonth must be YYYY-MM'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
];

export const onlinePaymentValidation = [
  body('customerId').isMongoId().withMessage('Valid customer ID is required'),
  body('fromMonth').matches(/^\d{4}-\d{2}$/).withMessage('fromMonth must be YYYY-MM'),
  body('toMonth').matches(/^\d{4}-\d{2}$/).withMessage('toMonth must be YYYY-MM'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
];

export const webhookValidation = [
  body('razorpayOrderId').notEmpty().withMessage('Order ID is required'),
  body('razorpayPaymentId').notEmpty().withMessage('Payment ID is required'),
  body('razorpaySignature').notEmpty().withMessage('Signature is required'),
];

export const recordCash = asyncHandler(async (req: Request, res: Response) => {
  validate(req);
  const result = await paymentService.recordCashPayment(req.body);
  sendSuccess(res, result, 'Cash payment recorded successfully', 201);
});

export const createOnline = asyncHandler(async (req: Request, res: Response) => {
  validate(req);
  const result = await paymentService.createOnlinePayment(req.body);
  sendSuccess(res, result, 'Online payment order created', 201);
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  validate(req);
  const result = await paymentService.handlePaymentWebhook(req.body);
  sendSuccess(res, result, 'Payment verified successfully');
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { status, paymentMethod, customerId } = req.query;
  const payments = await paymentService.getPayments({
    status: status as string,
    paymentMethod: paymentMethod as string,
    customerId: customerId as string,
  });
  sendSuccess(res, payments);
});
