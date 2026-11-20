import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout.tsx';
import { Button } from '../components/ui/Button.tsx';

export default function RewatchPlanPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800/60 text-3xl shadow-lg shadow-red-950/50">
          📋
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#dc2626]">
            Phase 7 Milestone
          </span>
          <h1 className="text-4xl font-black text-white tracking-tight">MCU Rewatch Plan</h1>
          <p className="text-base text-[#888888] max-w-xl mx-auto leading-relaxed">
            Select any target MCU film to generate a complete, topologically-ordered prerequisite
            watch list powered by handwritten DFS algorithms.
          </p>
        </div>

        {/* Informational card */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 text-left space-y-3">
          <h3 className="text-sm font-semibold text-[#f5f5f5] flex items-center gap-2">
            <span>⚡</span> Backend API Status: Ready
          </h3>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            The backend rewatch calculation is already fully implemented at:
          </p>
          <code className="block rounded bg-[#0b0b0b] p-3 text-xs text-red-300 font-mono border border-[#222222]">
            GET /api/movies/:id/rewatch-order
          </code>
          <p className="text-xs text-[#737373]">
            This endpoint returns all transitive prerequisites exactly once in correct
            prerequisite-first order, unwatched runtime totals, and watched progress counts. The
            interactive UI view will be connected in Phase 7.
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
