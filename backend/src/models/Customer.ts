import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type CustomerStatus = 'Rented' | 'Vacant' | 'Closed' | 'Unsold';

export interface ICustomer extends Document {
  nameEnglish: string;
  nameHindi?: string;
  mobile: string;
  address?: string;
  guntaId: Types.ObjectId;
  roomNumber: string;
  monthlyCharge: number;
  status: CustomerStatus;
  username: string;
  password: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const customerSchema = new Schema<ICustomer>(
  {
    nameEnglish: {
      type: String,
      required: [true, 'Customer name (English) is required'],
      trim: true,
      maxlength: 200,
    },
    nameHindi: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    guntaId: {
      type: Schema.Types.ObjectId,
      ref: 'Gunta',
      required: [true, 'Gunta is required'],
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
      maxlength: 50,
    },
    monthlyCharge: {
      type: Number,
      required: [true, 'Monthly charge is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['Rented', 'Vacant', 'Closed', 'Unsold'],
      default: 'Rented',
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 4,
      select: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

customerSchema.index({ roomNumber: 1, guntaId: 1 }, { unique: true });

customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

customerSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
