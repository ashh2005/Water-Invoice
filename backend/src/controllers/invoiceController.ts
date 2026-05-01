import { Request, Response } from 'express';
import * as invoiceService from '../services/invoiceService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { Invoice } from '../models/Invoice';
import { AuthRequest } from '../middleware/auth';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, fromDate, toDate, paymentMethod, customerName } = req.query;
  const invoices = await invoiceService.getInvoices({
    customerId: customerId as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
    paymentMethod: paymentMethod as string,
    customerName: customerName as string,
  });
  sendSuccess(res, invoices);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  sendSuccess(res, invoice);
});

export const markWhatsappSent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    {
      whatsappSent: true,
      whatsappSentBy: req.user!._id,
      whatsappSentAt: new Date(),
    },
    { new: true }
  ).populate('whatsappSentBy', 'username role');
  sendSuccess(res, invoice, 'WhatsApp message marked as sent');
});
