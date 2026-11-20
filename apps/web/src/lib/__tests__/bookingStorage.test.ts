import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { bookingStorage, BOOKING_STORAGE_KEY } from '../bookingStorage.ts';
import { BookingQuotePossible } from '../../types/booking.ts';

// In-memory mock for Storage
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('bookingStorage', () => {
  let mockStorage: MemoryStorage;

  const sampleQuote: BookingQuotePossible = {
    cinemaId: 'cinema-123',
    cinemaName: 'IMAX Victoria',
    groupSize: 11,
    possible: true,
    totalBundles: 2,
    totalSeats: 11,
    bundleBreakdown: [
      { size: 8, quantity: 1 },
      { size: 3, quantity: 1 },
    ],
  };

  const sampleBundleSizes = [2, 3, 5, 8];

  beforeEach(() => {
    mockStorage = new MemoryStorage();
    // Provide standard window and localStorage
    vi.stubGlobal('window', {
      localStorage: mockStorage,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('saving and loading plans', () => {
    it('returns an empty array when no plans are stored', () => {
      const plans = bookingStorage.getSavedBookings();
      expect(plans).toEqual([]);
    });

    it('saves a booking plan snapshot and retrieves it accurately', () => {
      const saved = bookingStorage.saveBookingPlan(sampleQuote, sampleBundleSizes);

      expect(saved).toBeDefined();
      expect(saved._id).toBeTruthy();
      expect(saved.cinema).toBe('cinema-123');
      expect(saved.cinemaName).toBe('IMAX Victoria');
      expect(saved.groupSize).toBe(11);
      expect(saved.bundleSizes).toEqual([2, 3, 5, 8]);
      expect(saved.bundleBreakdown).toEqual([
        { size: 8, quantity: 1 },
        { size: 3, quantity: 1 },
      ]);
      expect(saved.totalBundles).toBe(2);
      expect(saved.totalSeats).toBe(11);
      expect(saved.status).toBe('saved');
      expect(saved.createdAt).toBeTruthy();
      expect(saved.updatedAt).toBeTruthy();

      const retrieved = bookingStorage.getSavedBookings();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]).toEqual(saved);
    });

    it('orders multiple saved plans newest first', async () => {
      const quoteA: BookingQuotePossible = {
        cinemaId: 'cinema-1',
        cinemaName: 'Cinema One',
        groupSize: 4,
        possible: true,
        totalBundles: 1,
        totalSeats: 4,
        bundleBreakdown: [{ size: 4, quantity: 1 }],
      };

      const quoteB: BookingQuotePossible = {
        cinemaId: 'cinema-2',
        cinemaName: 'Cinema Two',
        groupSize: 10,
        possible: true,
        totalBundles: 2,
        totalSeats: 10,
        bundleBreakdown: [{ size: 5, quantity: 2 }],
      };

      const planA = bookingStorage.saveBookingPlan(quoteA, [2, 4]);
      // Artificially ensure distinct timestamps
      planA.createdAt = new Date(Date.now() - 5000).toISOString();
      mockStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify([planA]));

      bookingStorage.saveBookingPlan(quoteB, [5]);

      const retrieved = bookingStorage.getSavedBookings();
      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].cinemaName).toBe('Cinema Two');
      expect(retrieved[1].cinemaName).toBe('Cinema One');
    });

    it('persists changes across simulated page reloads', () => {
      bookingStorage.saveBookingPlan(sampleQuote, sampleBundleSizes);

      // Simulate a page refresh: re-instantiate or read anew from storage
      const freshRead = bookingStorage.getSavedBookings();
      expect(freshRead).toHaveLength(1);
      expect(freshRead[0].cinemaName).toBe('IMAX Victoria');
      expect(freshRead[0].groupSize).toBe(11);
    });
  });

  describe('malformed and corrupted storage handling', () => {
    it('handles malformed non-JSON data gracefully without crashing', () => {
      mockStorage.setItem(BOOKING_STORAGE_KEY, 'invalid-json-string{{{');
      const plans = bookingStorage.getSavedBookings();
      expect(plans).toEqual([]);
    });

    it('handles non-array stored data gracefully', () => {
      mockStorage.setItem(
        BOOKING_STORAGE_KEY,
        JSON.stringify({ notAnArray: true, someField: 'value' }),
      );
      const plans = bookingStorage.getSavedBookings();
      expect(plans).toEqual([]);
    });

    it('filters out invalid or incomplete plan objects', () => {
      const validPlan = {
        _id: 'plan-1',
        cinema: 'c1',
        cinemaName: 'Good Cinema',
        groupSize: 5,
        bundleSizes: [5],
        bundleBreakdown: [{ size: 5, quantity: 1 }],
        totalBundles: 1,
        totalSeats: 5,
        status: 'saved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const corruptedItem = {
        _id: 'plan-bad',
        // missing cinemaName, groupSize, bundleBreakdown, etc.
      };

      mockStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify([validPlan, corruptedItem, null]));
      const plans = bookingStorage.getSavedBookings();
      expect(plans).toHaveLength(1);
      expect(plans[0]._id).toBe('plan-1');
    });
  });

  describe('inaccessible localStorage handling', () => {
    it('returns empty array when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);
      const plans = bookingStorage.getSavedBookings();
      expect(plans).toEqual([]);
    });

    it('returns empty array when localStorage access throws SecurityError', () => {
      vi.stubGlobal('window', {
        get localStorage() {
          throw new Error('SecurityError: The operation is insecure.');
        },
      });

      const plans = bookingStorage.getSavedBookings();
      expect(plans).toEqual([]);
    });

    it('throws a clean error when saving fails due to inaccessible storage', () => {
      vi.stubGlobal('window', {
        get localStorage() {
          return {
            getItem: () => null,
            setItem: () => {
              throw new Error('QuotaExceededError: Storage quota exceeded.');
            },
            removeItem: () => {},
            clear: () => {},
            length: 0,
            key: () => null,
          };
        },
      });

      expect(() => {
        bookingStorage.saveBookingPlan(sampleQuote, sampleBundleSizes);
      }).toThrow('Failed to save booking plan to browser storage.');
    });
  });

  describe('browser profile isolation', () => {
    it('maintains independent plans across different profile storage keys', () => {
      const profileAKey = 'profile-a-bookings-v1';
      const profileBKey = 'profile-b-bookings-v1';

      bookingStorage.saveBookingPlan(sampleQuote, sampleBundleSizes, profileAKey);

      const quoteB: BookingQuotePossible = {
        cinemaId: 'cinema-456',
        cinemaName: 'Profile B Cinema',
        groupSize: 7,
        possible: true,
        totalBundles: 1,
        totalSeats: 7,
        bundleBreakdown: [{ size: 7, quantity: 1 }],
      };

      bookingStorage.saveBookingPlan(quoteB, [7], profileBKey);

      const profileAPlans = bookingStorage.getSavedBookings(profileAKey);
      const profileBPlans = bookingStorage.getSavedBookings(profileBKey);

      expect(profileAPlans).toHaveLength(1);
      expect(profileAPlans[0].cinemaName).toBe('IMAX Victoria');

      expect(profileBPlans).toHaveLength(1);
      expect(profileBPlans[0].cinemaName).toBe('Profile B Cinema');
    });

    it('clearing plans for one key does not affect another', () => {
      const key1 = 'test-key-1';
      const key2 = 'test-key-2';

      bookingStorage.saveBookingPlan(sampleQuote, sampleBundleSizes, key1);
      bookingStorage.saveBookingPlan(sampleQuote, sampleBundleSizes, key2);

      bookingStorage.clearSavedBookings(key1);

      expect(bookingStorage.getSavedBookings(key1)).toHaveLength(0);
      expect(bookingStorage.getSavedBookings(key2)).toHaveLength(1);
    });
  });
});
