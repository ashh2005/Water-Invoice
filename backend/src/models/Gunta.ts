import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGunta extends Document {
  name: string;
  description?: string;
  assignedStaff?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const guntaSchema = new Schema<IGunta>(
  {
    name: {
      type: String,
      required: [true, 'Gunta name is required'],
      unique: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    assignedStaff: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export const Gunta = mongoose.model<IGunta>('Gunta', guntaSchema);
