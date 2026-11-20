import { Schema, model, Document } from 'mongoose';

export interface ICinema {
  name: string;
  normalizedName: string;
  bundleSizes: number[];
  createdAt: Date;
  updatedAt: Date;
}

export type CinemaDocument = ICinema & Document;

const cinemaSchema = new Schema<ICinema>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    bundleSizes: {
      type: [Number],
      required: true,
      validate: [
        {
          validator: (val: number[]) => Array.isArray(val) && val.length >= 1 && val.length <= 10,
          message: 'Cinema must have between 1 and 10 bundle sizes.',
        },
        {
          validator: (val: number[]) =>
            val.every((size) => Number.isInteger(size) && size >= 1 && size <= 500),
          message: 'Each bundle size must be an integer between 1 and 500.',
        },
        {
          validator: (val: number[]) => new Set(val).size === val.length,
          message: 'Bundle sizes must be unique.',
        },
      ],
    },
  },
  {
    timestamps: true,
  },
);

// Unique database index on normalizedName for case-insensitive and trimmed uniqueness
cinemaSchema.index({ normalizedName: 1 }, { unique: true });

export const Cinema = model<ICinema>('Cinema', cinemaSchema);
