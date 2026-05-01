import { Request, Response } from 'express';
import * as reportService from '../services/reportService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const summary = await reportService.getDashboardSummary();
  sendSuccess(res, summary);
});

export const getMonthlyCollection = asyncHandler(async (req: Request, res: Response) => {
  const { month } = req.query;
  const data = await reportService.getMonthlyCollection(month as string || getCurrentMonth());
  sendSuccess(res, data);
});

export const getDefaulters = asyncHandler(async (req: Request, res: Response) => {
  const defaulters = await reportService.getDefaultersList();
  sendSuccess(res, defaulters);
});

export const getCollectionSummary = asyncHandler(async (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;
  if (!fromDate || !toDate) {
    return sendSuccess(res, null, 'fromDate and toDate query params are required');
  }
  const summary = await reportService.getCollectionSummary(fromDate as string, toDate as string);
  sendSuccess(res, summary);
});

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const getGuntaDetail = asyncHandler(async (req: Request, res: Response) => {
  const { guntaId, fromMonth, toMonth } = req.query;
  if (!guntaId || !fromMonth || !toMonth) {
    return sendSuccess(res, null, 'guntaId, fromMonth, and toMonth query params are required');
  }
  const data = await reportService.getGuntaDetail(
    guntaId as string,
    fromMonth as string,
    toMonth as string
  );
  sendSuccess(res, data);
});
