import { Schema, model, Document, Types } from 'mongoose';

export interface IBundleBreakdownItem {
  size: number;
  quantity: number;
}

export interface IBooking {
  cinema: Types.ObjectId;
  cinemaName: string;
  groupSize: number;
  bundleSizes: number[];
  bundleBreakdown: IBundleBreakdownItem[];
  totalBundles: number;
  totalSeats: number;
  status: 'saved';
  createdAt: Date;
  updatedAt: Date;
}

export type BookingDocument = IBooking & Document;

const bundleBreakdownSchema = new Schema<IBundleBreakdownItem>(
  {
    size: {
      type: Number,
      required: true,
      min: 1,
      max: 500,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const bookingSchema = new Schema<IBooking>(
  {
    cinema: {
      type: Schema.Types.ObjectId,
      ref: 'Cinema',
      required: true,
    },
    cinemaName: {
      type: String,
      required: true,
      trim: true,
    },
    groupSize: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
    },
    bundleSizes: {
      type: [Number],
      required: true,
    },
    bundleBreakdown: {
      type: [bundleBreakdownSchema],
      required: true,
    },
    totalBundles: {
      type: Number,
      required: true,
      min: 1,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
    },
    status: {
      type: String,
      required: true,
      enum: ['saved'],
      default: 'saved',
    },
  },
  {
    timestamps: true,
  },
);

export const Booking = model<IBooking>('Booking', bookingSchema);
