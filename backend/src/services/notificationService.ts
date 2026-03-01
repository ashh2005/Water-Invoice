import { Invoice } from '../models/Invoice';
import { Customer } from '../models/Customer';
import { sendSMS } from './smsService';
import { AppError } from '../utils/AppError';

export const sendPaymentConfirmationSMS = async (invoiceId: string): Promise<boolean> => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new AppError('Invoice not found', 404);

  const customer = await Customer.findById(invoice.customerId);
  if (!customer) throw new AppError('Customer not found', 404);

  const message =
    `Payment Confirmed! ` +
    `Invoice: ${invoice.invoiceNumber}, ` +
    `Room: ${customer.roomNumber}, ` +
    `Name: ${customer.nameEnglish}, ` +
    `Period: ${invoice.paidFromMonth} to ${invoice.paidToMonth}, ` +
    `Amount: Rs.${invoice.amountPaid}, ` +
    `Method: ${invoice.paymentMethod}` +
    (invoice.pendingAmount > 0 ? `, Pending: Rs.${invoice.pendingAmount}` : '');

  const sent = await sendSMS(customer.mobile, message);

  await Invoice.findByIdAndUpdate(invoiceId, {
    smsSent: sent,
    smsError: sent ? undefined : 'SMS delivery failed',
  });

  return sent;
};

export const resendInvoiceSMS = async (invoiceId: string): Promise<boolean> => {
  return sendPaymentConfirmationSMS(invoiceId);
};
