import { Request, Response } from 'express';
import * as invoiceService from '../services/invoiceService';
import { resendInvoiceSMS } from '../services/notificationService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, fromDate, toDate, paymentMethod } = req.query;
  const invoices = await invoiceService.getInvoices({
    customerId: customerId as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
    paymentMethod: paymentMethod as string,
  });
  sendSuccess(res, invoices);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  sendSuccess(res, invoice);
});

export const resendSMS = asyncHandler(async (req: Request, res: Response) => {
  const sent = await resendInvoiceSMS(req.params.id);
  sendSuccess(res, { sent }, sent ? 'SMS sent successfully' : 'SMS delivery failed');
});
