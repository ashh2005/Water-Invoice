import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { Customer } from '../models/Customer';
import { createOrder } from './razorpayService';
import { getNextInvoiceNumber } from './counterService';
import { sendPaymentConfirmationSMS } from './notificationService';
import { getEarliestUnpaidMonth } from './invoiceService';
import { AppError } from '../utils/AppError';

function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm) + 1;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const getCustomerDashboard = async (customerId: string) => {
  const customer = await Customer.findById(customerId).populate('guntaId', 'name');
  if (!customer) throw new AppError('Customer not found', 404);

  const currentMonth = getCurrentMonth();

  // Check if current month is paid
  const currentMonthInvoice = await Invoice.findOne({
    customerId,
    paidFromMonth: { $lte: currentMonth },
    paidToMonth: { $gte: currentMonth },
  });

  let pendingFrom: string | null = null;
  let pendingMonths = 0;
  let pendingAmount = 0;

  if (!currentMonthInvoice) {
    pendingFrom = await getEarliestUnpaidMonth(customerId);
    const [fy, fm] = pendingFrom.split('-').map(Number);
    const [ty, tm] = currentMonth.split('-').map(Number);
    pendingMonths = Math.max((ty - fy) * 12 + (tm - fm) + 1, 0);
    pendingAmount = pendingMonths * customer.monthlyCharge;
  }

  // Recent invoices
  const recentInvoices = await Invoice.find({ customerId })
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    customer: {
      nameEnglish: customer.nameEnglish,
      roomNumber: customer.roomNumber,
      gunta: customer.guntaId,
      monthlyCharge: customer.monthlyCharge,
      mobile: customer.mobile,
    },
    billing: {
      isPaid: !!currentMonthInvoice,
      pendingFrom: currentMonthInvoice ? null : pendingFrom,
      pendingMonths,
      pendingAmount,
      currentMonth,
    },
    recentInvoices,
  };
};

export const getCustomerInvoices = async (customerId: string) => {
  return Invoice.find({ customerId }).sort({ createdAt: -1 });
};

export const initiateCustomerPayment = async (
  customerId: string,
  fromMonth: string,
  toMonth: string
) => {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new AppError('Customer not found', 404);

  const monthsCovered = monthDiff(fromMonth, toMonth);
  if (monthsCovered < 1) throw new AppError('Invalid month range', 400);

  // No future month payments
  const currentMonth = getCurrentMonth();
  if (fromMonth > currentMonth) {
    throw new AppError('Customer is fully paid up through the current month. No payment needed.', 400);
  }
  if (toMonth > currentMonth) {
    throw new AppError(`Cannot make payments for future months. Current month is ${currentMonth}`, 400);
  }

  // Check for overlapping invoices
  const overlapping = await Invoice.findOne({
    customerId,
    paidFromMonth: { $lte: toMonth },
    paidToMonth: { $gte: fromMonth },
  });
  if (overlapping) {
    throw new AppError(
      `Payment already exists for overlapping period ${overlapping.paidFromMonth} to ${overlapping.paidToMonth}`,
      409
    );
  }

  // Enforce oldest-first: payment must start from the earliest unpaid month
  const earliestUnpaid = await getEarliestUnpaidMonth(customerId);
  if (fromMonth !== earliestUnpaid) {
    throw new AppError(
      `Payment must start from the earliest unpaid month: ${earliestUnpaid}`,
      400
    );
  }

  const amount = monthsCovered * customer.monthlyCharge;

  // Create Razorpay order
  const order = await createOrder(amount, String(customer._id));

  // Calculate pending after this payment
  let pendingMonths = 0;
  let pendingAmount = 0;
  if (toMonth < currentMonth) {
    pendingMonths = monthDiff(toMonth, currentMonth) - 1;
    pendingAmount = pendingMonths * customer.monthlyCharge;
  }

  const invoiceNumber = await getNextInvoiceNumber();

  const invoice = await Invoice.create({
    invoiceNumber,
    customerId,
    paidFromMonth: fromMonth,
    paidToMonth: toMonth,
    monthsCovered,
    amountPaid: amount,
    paymentMethod: 'Online',
    pendingMonths,
    pendingAmount,
  });

  const payment = await Payment.create({
    invoiceId: invoice._id,
    customerId,
    amount,
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
