import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import * as customerService from '../services/customerService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError';

const validate = (req: Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array().map(e => e.msg).join(', '), 400);
};

export const createValidation = [
  body('nameEnglish').trim().notEmpty().withMessage('Customer name (English) is required'),
  body('nameHindi').optional().trim(),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number is required'),
  body('address').optional().trim(),
  body('guntaId').isMongoId().withMessage('Valid gunta ID is required'),
  body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
  body('monthlyCharge').isFloat({ gt: 0 }).withMessage('Monthly charge must be greater than 0'),
  body('status').optional().isIn(['Rented', 'Vacant', 'Closed', 'Unsold']).withMessage('Invalid status'),
  body('notes').optional().trim(),
];

export const updateValidation = [
  param('id').isMongoId().withMessage('Invalid customer ID'),
  body('nameEnglish').optional().trim().notEmpty(),
  body('nameHindi').optional().trim(),
  body('mobile').optional().matches(/^[6-9]\d{9}$/),
  body('address').optional().trim(),
  body('roomNumber').optional().trim().notEmpty(),
  body('monthlyCharge').optional().isFloat({ gt: 0 }),
  body('status').optional().isIn(['Rented', 'Vacant', 'Closed', 'Unsold']),
  body('username').optional().trim().isLength({ min: 3 }),
  body('password').optional().isLength({ min: 4 }),
  body('notes').optional().trim(),
];

export const create = asyncHandler(async (req: Request, res: Response) => {
  validate(req);
  const customer = await customerService.createCustomer(req.body);
  sendSuccess(res, customer, 'Customer created successfully', 201);
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { search, guntaId, status } = req.query;
  const customers = await customerService.getCustomers({
    search: search as string,
    guntaId: guntaId as string,
    status: status as string,
  });
  sendSuccess(res, customers);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomerById(req.params.id);
  sendSuccess(res, customer);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  validate(req);
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  sendSuccess(res, customer, 'Customer updated successfully');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await customerService.deleteCustomer(req.params.id);
  sendSuccess(res, null, 'Customer deleted successfully');
});
