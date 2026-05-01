import { Invoice } from '../models/Invoice';
import { Customer } from '../models/Customer';
import { getNextInvoiceNumber } from './counterService';
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

function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

export async function getEarliestUnpaidMonth(customerId: string): Promise<string> {
  const invoices = await Invoice.find({ customerId });

  if (invoices.length === 0) {
    const customer = await Customer.findById(customerId);
    if (customer?.createdAt) {
      const d = new Date(customer.createdAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    return getCurrentMonth();
  }

  // Build set of all paid months
  const paidMonths = new Set<string>();
  for (const inv of invoices) {
    const [fy, fm] = inv.paidFromMonth.split('-').map(Number);
    const [ty, tm] = inv.paidToMonth.split('-').map(Number);
    let y = fy, m = fm;
    while (y < ty || (y === ty && m <= tm)) {
      paidMonths.add(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) { m = 1; y++; }
    }
  }

  // Start from the earliest paid month and scan for first gap
  const sorted = Array.from(paidMonths).sort();
  let cursor = sorted[0];
  for (let i = 0; i < 120; i++) {
    if (!paidMonths.has(cursor)) return cursor;
    cursor = nextMonth(cursor);
  }

  return cursor;
}

export const createInvoiceFromPayment = async (
  customerId: string,
  fromMonth: string,
  toMonth: string,
  amount: number,
  paymentMethod: 'Cash' | 'Online'
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

  // Check for overlapping invoices (any existing invoice whose range overlaps with the new one)
  const overlapping = await Invoice.findOne({
    customerId,
    paidFromMonth: { $lte: toMonth },
    paidToMonth: { $gte: fromMonth },
  });
  if (overlapping) {
    throw new AppError(
      `Payment already exists for overlapping period ${overlapping.paidFromMonth} to ${overlapping.paidToMonth} (Invoice #${overlapping.invoiceNumber})`,
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

  const expectedAmount = monthsCovered * customer.monthlyCharge;
  if (amount !== expectedAmount) {
    throw new AppError(
      `Amount must be ${expectedAmount} for ${monthsCovered} month(s) at ${customer.monthlyCharge}/month`,
      400
    );
  }

  // Calculate pending: months from toMonth+1 to current month
  let pendingMonths = 0;
  let pendingAmount = 0;

  if (toMonth < currentMonth) {
    pendingMonths = monthDiff(toMonth, currentMonth) - 1; // exclude toMonth itself
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
    paymentMethod,
    pendingMonths,
    pendingAmount,
  });

  return invoice;
};

export const getInvoices = async (filters: {
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  paymentMethod?: string;
  customerName?: string;
}) => {
  const query: any = {};
  if (filters.customerId) query.customerId = filters.customerId;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
  if (filters.fromDate || filters.toDate) {
    query.createdAt = {};
    if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
    if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate + 'T23:59:59.999Z');
  }
  if (filters.customerName) {
    const matchingCustomers = await Customer.find(
      { nameEnglish: { $regex: filters.customerName, $options: 'i' } },
      '_id'
    );
    query.customerId = { $in: matchingCustomers.map((c: any) => c._id) };
  }

  return Invoice.find(query)
    .populate({
      path: 'customerId',
      select: 'nameEnglish nameHindi mobile roomNumber guntaId monthlyCharge',
      populate: { path: 'guntaId', select: 'name' },
    })
    .populate('whatsappSentBy', 'username role')
    .sort({ createdAt: -1 });
};

export const getInvoiceById = async (id: string) => {
  const invoice = await Invoice.findById(id)
    .populate({
      path: 'customerId',
      select: 'nameEnglish nameHindi mobile address roomNumber guntaId monthlyCharge',
      populate: { path: 'guntaId', select: 'name' },
    })
    .populate('whatsappSentBy', 'username role');
  if (!invoice) throw new AppError('Invoice not found', 404);
  return invoice;
};
