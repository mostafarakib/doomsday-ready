import { BookingQuote } from '../../types/booking.ts';
import { Button } from '../ui/Button.tsx';

export interface BookingQuoteCardProps {
  quote: BookingQuote | null;
  isLoading: boolean;
  onSave: () => Promise<void>;
  isSaving: boolean;
  availableBundleSizes: number[];
}

export function BookingQuoteCard({
  quote,
  isLoading,
  onSave,
  isSaving,
  availableBundleSizes,
}: BookingQuoteCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#262626] bg-[#161616] p-6 h-56 animate-pulse space-y-4">
        <div className="h-4 bg-[#262626] rounded w-1/3" />
        <div className="h-8 bg-[#262626] rounded w-1/2" />
        <div className="h-16 bg-[#262626] rounded w-full" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="rounded-xl border border-dashed border-[#2a2a2a] bg-[#121212] p-8 text-center space-y-2">
        <span className="text-3xl">🎟️</span>
        <h4 className="text-sm font-semibold text-[#f5f5f5]">No Quote Calculated Yet</h4>
        <p className="text-xs text-[#737373] max-w-sm mx-auto">
          Select a cinema and enter your party size, then click &quot;Calculate Quote&quot; to
          compute the minimum required seat bundles.
        </p>
      </div>
    );
  }

  if (!quote.possible) {
    return (
      <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
          <span className="text-xl">⚠️</span>
          <span>No Exact Bundle Combination Available</span>
        </div>
        <p className="text-xs text-amber-200/80 leading-relaxed">
          The requested group size of <strong className="text-white">{quote.groupSize}</strong>{' '}
          cannot be formed exactly using this cinema&apos;s available bundles: [
          {availableBundleSizes.join(', ')}].
        </p>
        <p className="text-xs text-[#888888]">
          Try adjusting your group size by adding or removing a ticket, or choose another cinema
          with different bundle configurations.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-900/60 bg-gradient-to-b from-[#141815] to-[#121212] p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
            Optimal DP Quote Calculated
          </span>
          <h3 className="text-lg font-black text-white">
            {quote.groupSize} Seats at {quote.cinemaName}
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
          Exact Match
        </span>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#262626] bg-[#161616] p-3 text-center">
          <span className="text-[10px] uppercase font-semibold text-[#888888] tracking-wider block">
            Minimum Bundles
          </span>
          <span className="text-2xl font-black text-emerald-400">{quote.totalBundles}</span>
        </div>

        <div className="rounded-lg border border-[#262626] bg-[#161616] p-3 text-center">
          <span className="text-[10px] uppercase font-semibold text-[#888888] tracking-wider block">
            Total Seats
          </span>
          <span className="text-2xl font-black text-white">{quote.totalSeats}</span>
        </div>
      </div>

      {/* Bundle Breakdown */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#888888] block mb-2">
          Bundle Breakdown:
        </span>
        <div className="space-y-2">
          {quote.bundleBreakdown.map((item) => (
            <div
              key={item.size}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-950/60 border border-red-800/80 text-red-400 flex items-center justify-center font-bold text-[11px]">
                  {item.quantity}
                </span>
                <span className="font-semibold text-white">
                  × {item.size}-seat bundle{item.quantity > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-[#888888]">
                = {item.quantity * item.size} seat{item.quantity * item.size > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Save Action */}
      <div className="pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="w-full"
          onClick={onSave}
          isLoading={isSaving}
        >
          💾 Save Booking Plan
        </Button>
        <p className="text-[11px] text-[#666666] text-center mt-2">
          Stores this calculated plan in your saved plans list. Does not reserve real cinema seats.
        </p>
      </div>
    </div>
  );
}
