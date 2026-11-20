import { describe, it, expect } from 'vitest';
import { calculateMinimumBundles } from '../cinema.booking.js';

describe('Minimum-Bundle Dynamic Programming (calculateMinimumBundles)', () => {
  describe('Assessment canonical examples', () => {
    it('calculates optimal bundle combination for [1, 3, 4] and groupSize 6 (non-greedy)', () => {
      // Greedy would pick 4 + 1 + 1 = 3 bundles.
      // DP optimal solution is 3 + 3 = 2 bundles.
      const result = calculateMinimumBundles([1, 3, 4], 6);

      expect(result.possible).toBe(true);
      if (result.possible) {
        expect(result.totalBundles).toBe(2);
        expect(result.totalSeats).toBe(6);
        expect(result.bundleBreakdown).toEqual([{ size: 3, quantity: 2 }]);
      }
    });

    it('calculates optimal bundle combination for [2, 5] and groupSize 11', () => {
      // 5 * 1 + 2 * 3 = 11 (4 bundles).
      const result = calculateMinimumBundles([2, 5], 11);

      expect(result.possible).toBe(true);
      if (result.possible) {
        expect(result.totalBundles).toBe(4);
        expect(result.totalSeats).toBe(11);
        expect(result.bundleBreakdown).toEqual([
          { size: 5, quantity: 1 },
          { size: 2, quantity: 3 },
        ]);
      }
    });

    it('calculates optimal bundle combination for [6, 9, 20] and groupSize 44', () => {
      // 20 * 1 + 9 * 2 + 6 * 1 = 44 (4 bundles).
      const result = calculateMinimumBundles([6, 9, 20], 44);

      expect(result.possible).toBe(true);
      if (result.possible) {
        expect(result.totalBundles).toBe(4);
        expect(result.totalSeats).toBe(44);
        expect(result.bundleBreakdown).toEqual([
          { size: 20, quantity: 1 },
          { size: 9, quantity: 2 },
          { size: 6, quantity: 1 },
        ]);
      }
    });

    it('returns possible: false when no exact combination exists ([4, 6] for 7)', () => {
      const result = calculateMinimumBundles([4, 6], 7);

      expect(result).toEqual({ possible: false });
    });
  });

  describe('Single bundle size cases', () => {
    it('returns exact bundle count when group size is an exact multiple', () => {
      const result = calculateMinimumBundles([5], 15);

      expect(result.possible).toBe(true);
      if (result.possible) {
        expect(result.totalBundles).toBe(3);
        expect(result.totalSeats).toBe(15);
        expect(result.bundleBreakdown).toEqual([{ size: 5, quantity: 3 }]);
      }
    });

    it('returns possible: false when group size is not a multiple of single bundle size', () => {
      const result = calculateMinimumBundles([5], 14);

      expect(result).toEqual({ possible: false });
    });
  });

  describe('Boundary cases (group size 1 and 10,000)', () => {
    it('handles group size 1 when a 1-seat bundle exists', () => {
      const result = calculateMinimumBundles([1, 5], 1);

      expect(result.possible).toBe(true);
      if (result.possible) {
        expect(result.totalBundles).toBe(1);
        expect(result.totalSeats).toBe(1);
        expect(result.bundleBreakdown).toEqual([{ size: 1, quantity: 1 }]);
      }
    });

    it('handles group size 1 when no 1-seat bundle exists', () => {
      const result = calculateMinimumBundles([2, 5], 1);

      expect(result).toEqual({ possible: false });
    });

    it('handles maximum group size 10,000 efficiently and accurately', () => {
      const result = calculateMinimumBundles([500, 300, 100], 10000);

      expect(result.possible).toBe(true);
      if (result.possible) {
        expect(result.totalBundles).toBe(20);
        expect(result.totalSeats).toBe(10000);
        expect(result.bundleBreakdown).toEqual([{ size: 500, quantity: 20 }]);
      }
    });

    it('handles large group size with prime bundle sizes', () => {
      // 10,000 with [7, 13]: 13 * 767 + 7 * 4 = 9971 + 28 = 9999 (not 10000)
      // 10000 = 13 * 764 + 7 * 10 = 9932 + 70 = 10002
      // 10000 = 13 * 765 + 7 * 8 = 9945 + 56 = 10001
      // 10000 = 13 * 766 + 7 * 6 = 9958 + 42 = 10000 (total = 772 bundles)
      const result = calculateMinimumBundles([7, 13], 10000);

      expect(result.possible).toBe(true);
      if (result.possible) {
        expect(result.totalSeats).toBe(10000);
        expect(result.totalBundles).toBe(772);
        expect(result.bundleBreakdown).toEqual([
          { size: 13, quantity: 766 },
          { size: 7, quantity: 6 },
        ]);
      }
    });
  });

  describe('Tie-breaking rule', () => {
    it('prefers the combination containing the larger bundle at first point of difference ([4, 3, 2] for 6)', () => {
      // 4 + 2 = 6 (2 bundles)
      // 3 + 3 = 6 (2 bundles)
      // 2 + 2 + 2 = 6 (3 bundles)
      // Both [4, 2] and [3, 3] have 2 bundles. First bundle 4 > 3, so [4, 2] is preferred.
      const result = calculateMinimumBundles([4, 3, 2], 6);

      expect(result.possible).toBe(true);
      if (result.possible) {
        expect(result.totalBundles).toBe(2);
        expect(result.totalSeats).toBe(6);
        expect(result.bundleBreakdown).toEqual([
          { size: 4, quantity: 1 },
          { size: 2, quantity: 1 },
        ]);
      }
    });

    it('prefers larger bundle at first point of difference ([10, 8, 6, 4] for 14)', () => {
      // 10 + 4 = 14 (2 bundles)
      // 8 + 6 = 14 (2 bundles)
      // First bundle 10 > 8, so [10, 4] is preferred.
      const result = calculateMinimumBundles([10, 8, 6, 4], 14);

      expect(result.possible).toBe(true);
      if (result.possible) {
        expect(result.totalBundles).toBe(2);
        expect(result.totalSeats).toBe(14);
        expect(result.bundleBreakdown).toEqual([
          { size: 10, quantity: 1 },
          { size: 4, quantity: 1 },
        ]);
      }
    });
  });

  describe('Input resilience and order invariance', () => {
    it('produces identical results regardless of input bundle size ordering', () => {
      const orderA = calculateMinimumBundles([1, 3, 4], 6);
      const orderB = calculateMinimumBundles([4, 1, 3], 6);
      const orderC = calculateMinimumBundles([3, 4, 1], 6);

      expect(orderA).toEqual(orderB);
      expect(orderB).toEqual(orderC);
    });

    it('handles duplicate bundle sizes seamlessly', () => {
      const resultWithDupes = calculateMinimumBundles([3, 1, 3, 4, 4], 6);
      const resultClean = calculateMinimumBundles([1, 3, 4], 6);

      expect(resultWithDupes).toEqual(resultClean);
    });

    it('returns possible: false for invalid or empty inputs', () => {
      expect(calculateMinimumBundles([], 10)).toEqual({ possible: false });
      expect(calculateMinimumBundles([2, 5], 0)).toEqual({ possible: false });
      expect(calculateMinimumBundles([2, 5], -5)).toEqual({ possible: false });
      expect(calculateMinimumBundles([2, 5], 5.5)).toEqual({ possible: false });
    });
  });
});
