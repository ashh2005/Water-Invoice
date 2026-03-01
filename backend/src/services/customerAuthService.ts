import jwt from 'jsonwebtoken';
import { Customer } from '../models/Customer';
import { AppError } from '../utils/AppError';

const generateCustomerToken = (id: string): string => {
  return jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const customerLogin = async (username: string, password: string) => {
  const customer = await Customer.findOne({ username }).select('+password');

  if (!customer) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await customer.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateCustomerToken(String(customer._id));

  return {
    token,
    customer: {
      id: customer._id,
      nameEnglish: customer.nameEnglish,
      username: customer.username,
      roomNumber: customer.roomNumber,
      mobile: customer.mobile,
    },
  };
};
