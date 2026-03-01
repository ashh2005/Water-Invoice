import { Payment } from '../models/Payment';
import { Customer } from '../models/Customer';
import { createInvoiceFromPayment } from './invoiceService';
import { createOrder, verifySignature } from './razorpayService';
import { sendPaymentConfirmationSMS } from './notificationService';
import { AppError } from '../utils/AppError';

export const recordCashPayment = async (data: {
  customerId: string;
  fromMonth: string;
  toMonth: string;
  amount: number;
}) => {
  const invoice = await createInvoiceFromPayment(
    data.customerId,
    data.fromMonth,
    data.toMonth,
    data.amount,
    'Cash'
  );

  const payment = await Payment.create({
    invoiceId: invoice._id,
    customerId: data.customerId,
    amount: data.amount,
    paymentMethod: 'Cash',
    status: 'completed',
  });

  // Auto-send SMS (non-blocking)
  sendPaymentConfirmationSMS(String(invoice._id)).catch(err =>
    console.error('SMS send failed:', err.message)
  );

  return { invoice, payment };
};

export const createOnlinePayment = async (data: {
  customerId: string;
  fromMonth: string;
  toMonth: string;
  amount: number;
}) => {
  const customer = await Customer.findById(data.customerId);
  if (!customer) throw new AppError('Customer not found', 404);

  // Create Razorpay order FIRST
  const order = await createOrder(data.amount, data.customerId);

  const invoice = await createInvoiceFromPayment(
    data.customerId,
    data.fromMonth,
    data.toMonth,
    data.amount,
    'Online'
  );

  const payment = await Payment.create({
    invoiceId: invoice._id,
    customerId: data.customerId,
    amount: data.amount,
    paymentMethod: 'Online',
    status: 'pending',
    razorpayOrderId: order.id,
  });

  return {
    invoice,
    payment,
    razorpayOrder: order,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  };
};

export const handlePaymentWebhook = async (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const isValid = verifySignature(data.razorpayOrderId, data.razorpayPaymentId, data.razorpaySignature);
  if (!isValid) throw new AppError('Invalid payment signature', 400);

  const payment = await Payment.findOne({ razorpayOrderId: data.razorpayOrderId });
  if (!payment) throw new AppError('Payment not found', 404);

  payment.razorpayPaymentId = data.razorpayPaymentId;
  payment.razorpaySignature = data.razorpaySignature;
  payment.status = 'completed';
  await payment.save();

  // Auto-send SMS
  sendPaymentConfirmationSMS(payment.invoiceId as any).catch(err =>
    console.error('SMS send failed:', err.message)
  );

  return payment;
};

export const getPayments = async (filters: { status?: string; paymentMethod?: string; customerId?: string }) => {
  const query: any = {};
  if (filters.status) query.status = filters.status;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
  if (filters.customerId) query.customerId = filters.customerId;

  return Payment.find(query)
    .populate('invoiceId', 'invoiceNumber paidFromMonth paidToMonth')
    .populate('customerId', 'nameEnglish mobile roomNumber')
    .sort({ createdAt: -1 });
};
