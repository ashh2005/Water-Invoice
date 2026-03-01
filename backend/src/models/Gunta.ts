import mongoose, { Document, Schema } from 'mongoose';

export interface IGunta extends Document {
  name: string;
  description?: string;
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
  },
  { timestamps: true }
);

export const Gunta = mongoose.model<IGunta>('Gunta', guntaSchema);
