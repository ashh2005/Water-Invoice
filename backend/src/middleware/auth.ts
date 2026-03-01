import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Customer, ICustomer } from '../models/Customer';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface CustomerAuthRequest extends Request {
  customer?: ICustomer;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized, no token', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: string; type?: string };

    // Reject customer tokens on admin routes
    if (decoded.type === 'customer') {
      return next(new AppError('Not authorized, customer token cannot access admin routes', 401));
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new AppError('Not authorized, user not found or inactive', 401));
    }

    req.user = user;
    next();
  } catch {
    return next(new AppError('Not authorized, invalid token', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Not authorized for this action', 403));
    }
    next();
  };
};

export const protectCustomer = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized, no token', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: string; type?: string };

    if (decoded.type !== 'customer') {
      return next(new AppError('Not authorized, invalid token type', 401));
    }

    const customer = await Customer.findById(decoded.id);

    if (!customer) {
      return next(new AppError('Not authorized, customer not found', 401));
    }

    req.customer = customer;
    next();
  } catch {
    return next(new AppError('Not authorized, invalid token', 401));
  }
};
