import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import * as guntaService from '../services/guntaService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError';

const validate = (req: Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array().map(e => e.msg).join(', '), 400);
};

export const createValidation = [
  body('name').trim().notEmpty().withMessage('Gunta name is required'),
  body('description').optional().trim(),
  body('assignedStaff').optional({ nullable: true }).custom((v) => v === null || v === '' || mongoose.isValidObjectId(v)).withMessage('Invalid assignedStaff ID'),
];

export const updateValidation = [
  param('id').isMongoId().withMessage('Invalid gunta ID'),
  body('name').optional().trim().notEmpty().withMessage('Gunta name cannot be empty'),
  body('description').optional().trim(),
  body('assignedStaff').optional({ nullable: true }).custom((v) => v === null || v === '' || mongoose.isValidObjectId(v)).withMessage('Invalid assignedStaff ID'),
];

export const create = asyncHandler(async (req: Request, res: Response) => {
  validate(req);
  const gunta = await guntaService.createGunta(req.body);
  sendSuccess(res, gunta, 'Gunta created successfully', 201);
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;
  const guntas = await guntaService.getGuntas(search as string);
  sendSuccess(res, guntas);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const gunta = await guntaService.getGuntaById(req.params.id);
  sendSuccess(res, gunta);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  validate(req);
  const gunta = await guntaService.updateGunta(req.params.id, req.body);
  sendSuccess(res, gunta, 'Gunta updated successfully');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await guntaService.deleteGunta(req.params.id);
  sendSuccess(res, null, 'Gunta deleted successfully');
});
