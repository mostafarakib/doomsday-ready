import { BookingPlan, BookingQuotePossible } from '../types/booking.ts';

export const BOOKING_STORAGE_KEY = 'doomsday-ready-bookings-v1';

/**
 * Safely access browser localStorage if available.
 * Returns null if running in SSR, or if access throws SecurityError (e.g. disabled storage).
 */
function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // In environments with sandboxed permissions or storage disabled, access can throw
  }
  return null;
}

/**
 * Generate a unique identifier for saved booking plans.
 */
function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fallback if crypto is unavailable
  }
  return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validates that an untrusted object meets the required structure of a BookingPlan snapshot.
 */
function isValidBookingPlan(item: unknown): item is BookingPlan {
  if (!item || typeof item !== 'object') return false;
  const p = item as Partial<BookingPlan>;
  return (
    typeof p._id === 'string' &&
    typeof p.cinemaName === 'string' &&
    typeof p.groupSize === 'number' &&
    p.groupSize >= 1 &&
    Array.isArray(p.bundleSizes) &&
    Array.isArray(p.bundleBreakdown) &&
    typeof p.totalBundles === 'number' &&
    typeof p.totalSeats === 'number' &&
    typeof p.createdAt === 'string'
  );
}

export const bookingStorage = {
  /**
   * Retrieve all saved booking plans from localStorage.
   * Handles missing, malformed, or inaccessible localStorage gracefully.
   * Returns plans sorted newest first (descending createdAt).
   */
  getSavedBookings(storageKey: string = BOOKING_STORAGE_KEY): BookingPlan[] {
    const storage = getStorage();
    if (!storage) return [];

    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return [];

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const validPlans = parsed.filter(isValidBookingPlan);

      // Sort newest first
      return validPlans.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });
    } catch {
      // Malformed JSON or read error: gracefully return empty array
      return [];
    }
  },

  /**
   * Persist a new booking plan snapshot immediately to localStorage.
   * Returns the newly created BookingPlan record.
   */
  saveBookingPlan(
    quote: BookingQuotePossible,
    bundleSizes: number[],
    storageKey: string = BOOKING_STORAGE_KEY,
  ): BookingPlan {
    const now = new Date().toISOString();
    const newPlan: BookingPlan = {
      _id: generateId(),
      cinema: quote.cinemaId,
      cinemaName: quote.cinemaName,
      groupSize: quote.groupSize,
      bundleSizes: [...bundleSizes],
      bundleBreakdown: quote.bundleBreakdown.map((item) => ({
        size: item.size,
        quantity: item.quantity,
      })),
      totalBundles: quote.totalBundles,
      totalSeats: quote.totalSeats,
      status: 'saved',
      createdAt: now,
      updatedAt: now,
    };

    const storage = getStorage();
    if (storage) {
      try {
        const currentPlans = this.getSavedBookings(storageKey);
        const updatedPlans = [newPlan, ...currentPlans.filter((p) => p._id !== newPlan._id)];
        storage.setItem(storageKey, JSON.stringify(updatedPlans));
      } catch (err: unknown) {
        console.error('Failed to persist booking plan to localStorage:', err);
        throw new Error('Failed to save booking plan to browser storage.');
      }
    }

    return newPlan;
  },

  /**
   * Clear all saved booking plans from localStorage.
   */
  clearSavedBookings(storageKey: string = BOOKING_STORAGE_KEY): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.removeItem(storageKey);
    } catch {
      // Ignore removal errors
    }
  },
};
