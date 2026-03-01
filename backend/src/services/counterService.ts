import { Counter } from '../models/Counter';

export const getNextInvoiceNumber = async (): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { name: 'invoice' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `INV-${String(counter.seq).padStart(5, '0')}`;
};
