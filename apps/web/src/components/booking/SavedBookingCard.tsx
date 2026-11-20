import { BookingPlan } from '../../types/booking.ts';

export interface SavedBookingCardProps {
  booking: BookingPlan;
}

export function SavedBookingCard({ booking }: SavedBookingCardProps) {
  const formattedDate = new Date(booking.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-xl border border-[#262626] bg-[#161616] p-5 space-y-4 hover:border-[#383838] transition-all">
      {/* Header: Cinema Snapshot & Timestamp */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-white leading-snug">{booking.cinemaName}</h4>
          <span className="text-[11px] text-[#737373] mt-0.5 block">Saved on {formattedDate}</span>
        </div>
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/60 shrink-0">
          Plan Snapshot
        </span>
      </div>

      {/* Totals Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs bg-[#111111] p-3 rounded-lg border border-[#222222]">
        <div>
          <span className="text-[#737373] block text-[10px] uppercase">Group Size</span>
          <span className="font-bold text-white text-sm">{booking.groupSize} seats</span>
        </div>
        <div>
          <span className="text-[#737373] block text-[10px] uppercase">Total Bundles</span>
          <span className="font-bold text-emerald-400 text-sm">{booking.totalBundles} bundles</span>
        </div>
      </div>

      {/* Breakdown Pills */}
      <div>
        <span className="text-[10px] uppercase font-semibold text-[#737373] tracking-wider block mb-1.5">
          Bundle Allocation
        </span>
        <div className="flex flex-wrap gap-1.5">
          {booking.bundleBreakdown.map((item) => (
            <span
              key={item.size}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#222222] text-[#e0e0e0] border border-[#333333]"
            >
              {item.quantity} × [{item.size} seats]
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
