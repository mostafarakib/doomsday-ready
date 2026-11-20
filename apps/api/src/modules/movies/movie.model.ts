import { Schema, model, Document, Types } from 'mongoose';

export interface IMovie {
  title: string;
  normalizedTitle: string;
  releaseYear: number;
  runtime: number;
  prerequisites: Types.ObjectId[];
  watched: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type MovieDocument = IMovie & Document;

const movieSchema = new Schema<IMovie>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedTitle: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    releaseYear: {
      type: Number,
      required: true,
    },
    runtime: {
      type: Number,
      required: true,
      min: 1,
      max: 300,
    },
    prerequisites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Movie',
        default: [],
      },
    ],
    watched: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Unique database index on normalizedTitle for case-insensitive and trimmed uniqueness
movieSchema.index({ normalizedTitle: 1 }, { unique: true });

export const Movie = model<IMovie>('Movie', movieSchema);
