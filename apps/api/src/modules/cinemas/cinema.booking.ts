export interface BundleBreakdownItem {
  size: number;
  quantity: number;
}

export interface BookingQuotePossible {
  possible: true;
  totalBundles: number;
  totalSeats: number;
  bundleBreakdown: BundleBreakdownItem[];
}

export interface BookingQuoteImpossible {
  possible: false;
}

export type BookingQuoteResult = BookingQuotePossible | BookingQuoteImpossible;

/**
 * Calculates the minimum number of seat bundles required to exactly match
 * the requested group size using bottom-up dynamic programming.
 *
 * Algorithm Details:
 *   - State:
 *       dp[i] = minimum bundle count needed to form exactly i seats
 *       choice[i] = bundle size chosen to transition to seat total i
 *   - Base case:
 *       dp[0] = 0 (0 seats requires 0 bundles)
 *       dp[i] = Infinity for i = 1 .. groupSize
 *   - Transitions:
 *       For each seat total i from 1 to groupSize:
 *         For each bundle in sortedSizes (descending):
 *           if i >= bundle and dp[i - bundle] !== Infinity:
 *             candidate = dp[i - bundle] + 1
 *             if candidate < dp[i]:
 *               dp[i] = candidate
 *               choice[i] = bundle
 *   - Tie-breaking:
 *       Bundle sizes are evaluated in descending order. Because candidate < dp[i]
 *       is strictly less, when two choices yield the identical minimum bundle count,
 *       the choice evaluated earlier (the larger bundle) is preserved. This guarantees
 *       that the combination preferring the larger bundle at the first point of
 *       difference is deterministically selected.
 *   - Complexity:
 *       Time:  O(G * B) where G = groupSize (<= 10,000) and B = bundle count (<= 10)
 *       Space: O(G) for the dp and choice arrays
 */
export function calculateMinimumBundles(
  bundleSizes: number[],
  groupSize: number,
): BookingQuoteResult {
  if (!Number.isInteger(groupSize) || groupSize <= 0) {
    return { possible: false };
  }

  // Deduplicate and sort bundle sizes in descending order for predictable tie-breaking
  const sortedSizes = Array.from(new Set(bundleSizes))
    .filter((size) => Number.isInteger(size) && size > 0)
    .sort((a, b) => b - a);

  if (sortedSizes.length === 0) {
    return { possible: false };
  }

  const dp: number[] = new Array(groupSize + 1).fill(Infinity);
  const choice: number[] = new Array(groupSize + 1).fill(0);

  dp[0] = 0;

  for (let i = 1; i <= groupSize; i++) {
    for (const bundle of sortedSizes) {
      if (i >= bundle && dp[i - bundle] !== Infinity) {
        const candidateCount = dp[i - bundle] + 1;
        // Strictly better: preserves earlier (larger) bundle choice when counts tie
        if (candidateCount < dp[i]) {
          dp[i] = candidateCount;
          choice[i] = bundle;
        }
      }
    }
  }

  // Target group size is unreachable with available bundles
  if (dp[groupSize] === Infinity) {
    return { possible: false };
  }

  // Backtrack through choice array to reconstruct quantities of each bundle used
  const counts = new Map<number, number>();
  let remaining = groupSize;
  while (remaining > 0) {
    const chosenBundle = choice[remaining];
    if (!chosenBundle || chosenBundle <= 0) {
      return { possible: false };
    }
    counts.set(chosenBundle, (counts.get(chosenBundle) || 0) + 1);
    remaining -= chosenBundle;
  }

  // Format bundle breakdown sorted descending by bundle size
  const bundleBreakdown: BundleBreakdownItem[] = [];
  for (const size of sortedSizes) {
    const quantity = counts.get(size);
    if (quantity && quantity > 0) {
      bundleBreakdown.push({ size, quantity });
    }
  }

  return {
    possible: true,
    totalBundles: dp[groupSize],
    totalSeats: groupSize,
    bundleBreakdown,
  };
}
