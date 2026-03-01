import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { AppError } from '../utils/AppError';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const login = async (username: string, password: string) => {
  const user = await User.findOne({ username, isActive: true }).select('+password');

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(String(user._id));

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
};

export const register = async (data: { username: string; email: string; password: string; role: string }) => {
  const existingUser = await User.findOne({
    $or: [{ username: data.username }, { email: data.email }],
  });

  if (existingUser) {
    throw new AppError('Username or email already exists', 400);
  }

  const user = await User.create(data);

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

export const getProfile = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};
