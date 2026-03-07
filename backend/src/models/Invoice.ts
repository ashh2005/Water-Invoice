import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  customerId: Types.ObjectId;
  paidFromMonth: string; // YYYY-MM
  paidToMonth: string; // YYYY-MM
  monthsCovered: number;
  amountPaid: number;
  paymentMethod: 'Cash' | 'Online';
  pendingMonths: number;
  pendingAmount: number;
  whatsappSent: boolean;
  whatsappSentBy?: Types.ObjectId;
  whatsappSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    paidFromMonth: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
    },
    paidToMonth: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
    },
    monthsCovered: {
      type: Number,
      required: true,
      min: 1,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Online'],
      required: true,
    },
    pendingMonths: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    whatsappSent: {
      type: Boolean,
      default: false,
    },
    whatsappSentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    whatsappSentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ paidFromMonth: 1, paidToMonth: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
