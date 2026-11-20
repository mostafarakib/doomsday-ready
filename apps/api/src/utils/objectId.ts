import mongoose from 'mongoose';

/**
 * Validates whether a string is a valid 24-character hex MongoDB ObjectId.
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
}

/**
 * Normalizes a movie title for case-insensitive and whitespace-trimmed uniqueness.
 */
export function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

/**
 * Normalizes a cinema name for case-insensitive and whitespace-trimmed uniqueness.
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}
