import { Response } from 'express';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';

export const getStaffUsers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const staff = await User.find({ role: 'staff', isActive: true }, 'username role _id');
  sendSuccess(res, staff);
});
