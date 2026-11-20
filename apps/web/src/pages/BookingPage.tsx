import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout.tsx';
import { Button } from '../components/ui/Button.tsx';

export default function BookingPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800/60 text-3xl shadow-lg shadow-red-950/50">
          🎟️
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#dc2626]">
            Phase 8 Milestone
          </span>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Opening Night Group Booking
          </h1>
          <p className="text-base text-[#888888] max-w-xl mx-auto leading-relaxed">
            Find the minimum bundle combination for any group size up to 10,000 using our
            handwritten dynamic programming optimization algorithm.
          </p>
        </div>

        {/* Informational card */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 text-left space-y-3">
          <h3 className="text-sm font-semibold text-[#f5f5f5] flex items-center gap-2">
            <span>⚡</span> Backend API Status: Ready
          </h3>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            The Cinema and Booking endpoints and optimization algorithms are fully implemented:
          </p>
          <div className="space-y-1.5 font-mono text-xs">
            <code className="block rounded bg-[#0b0b0b] p-2 text-emerald-300 border border-[#222222]">
              GET /api/cinemas/:id/booking?groupSize=X
            </code>
            <code className="block rounded bg-[#0b0b0b] p-2 text-red-300 border border-[#222222]">
              POST /api/bookings &amp; GET /api/bookings
            </code>
          </div>
          <p className="text-xs text-[#737373]">
            The full interactive booking calculator and saved plans interface will be connected in
            Phase 8.
          </p>
        </div>

        <div className="pt-4">
          <Link to="/movies">
            <Button variant="secondary" size="md">
              ← Return to Movies Catalog
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
