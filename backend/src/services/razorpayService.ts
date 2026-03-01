import crypto from 'crypto';
import { AppError } from '../utils/AppError';

let Razorpay: any;
let razorpayInstance: any;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    try {
      Razorpay = require('razorpay');
      razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } catch {
      throw new AppError('Razorpay not configured', 500);
    }
  }
  return razorpayInstance;
};

export const createOrder = async (amount: number, invoiceId: string) => {
  const instance = getRazorpayInstance();

  const options = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency: 'INR',
    receipt: invoiceId,
    notes: { invoiceId },
  };

  const order = await instance.orders.create(options);
  return order;
};

export const verifySignature = (orderId: string, paymentId: string, signature: string): boolean => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new AppError('Razorpay not configured', 500);

  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
};
