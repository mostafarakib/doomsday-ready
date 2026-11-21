import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout.tsx';
import { Button } from '../components/ui/Button.tsx';
import { apiRequest } from '../api/client.ts';

type HealthStatus = 'loading' | 'ok' | 'error';

interface HealthData {
  status: string;
  timestamp: string;
  database: string;
}

export default function LandingPage() {
  const [health, setHealth] = useState<HealthStatus>('loading');
  const [healthData, setHealthData] = useState<HealthData | null>(null);

  useEffect(() => {
    apiRequest<HealthData>('/api/health')
      .then((data) => {
        setHealthData(data);
        setHealth('ok');
      })
      .catch(() => {
        setHealth('error');
      });
  }, []);

  return (
    <Layout>
      <div className="flex flex-col items-center">
        {/* Cinematic Hero Section */}
        <header className="relative w-full py-16 sm:py-24 text-center overflow-hidden flex flex-col items-center">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 10%, #dc2626 0%, transparent 65%)',
            }}
          />

          <p className="relative text-xs uppercase tracking-widest text-[#dc2626] mb-3 font-bold">
            MCU Timeline &amp; Opening Night Planner
          </p>
          <h1 className="relative text-5xl sm:text-7xl font-black tracking-tight mb-6 text-white">
            Doomsday <span className="text-[#dc2626]">Ready</span>
          </h1>
          <p className="relative max-w-2xl text-base sm:text-lg text-[#a3a3a3] leading-relaxed mb-8 px-4">
            Manage your MCU watch list, compute the exact prerequisite rewatch order before{' '}
            <em className="text-white font-semibold">Avengers: Doomsday</em>, and calculate the
            minimum opening-night cinema seat bundles.
          </p>

          {/* Action CTAs */}
          <div className="relative flex flex-wrap items-center justify-center gap-4">
            <Link to="/movies">
              <Button variant="primary" size="lg">
                🎬 Open Movies Catalog
              </Button>
            </Link>
            <Link to="/rewatch-plan">
              <Button variant="secondary" size="lg">
                📋 Rewatch Plan
              </Button>
            </Link>
            <Link to="/booking">
              <Button variant="secondary" size="lg">
                🎟️ Cinema Booking
              </Button>
            </Link>
          </div>
        </header>

        {/* Feature Cards Grid */}
        <section className="w-full max-w-5xl px-4 py-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <Link to="/movies" className="block group">
              <FeatureCard
                title="Movie Catalog"
                description="Create and organize MCU movies, track watched status, and manage prerequisite dependencies with cycle detection."
                icon="🎬"
                active
              />
            </Link>
            <Link to="/rewatch-plan" className="block group">
              <FeatureCard
                title="Rewatch Plan"
                description="Get the full prerequisite chain for any target movie in topological order, with remaining runtime calculations."
                icon="📋"
                active
              />
            </Link>
            <Link to="/booking" className="block group">
              <FeatureCard
                title="Group Booking"
                description="Find the optimal minimum bundle combination for your opening-night group size using dynamic programming."
                icon="🎟️"
                active
              />
            </Link>
          </div>

          {/* API Health Status Box */}
          <div className="mt-12 rounded-xl border border-[#262626] bg-[#141414] p-5">
            <h2 className="text-xs uppercase tracking-widest text-[#888888] mb-3 font-semibold flex items-center justify-between">
              <span>System Health &amp; API Connectivity</span>
              <span className="text-[10px] text-[#666666] font-mono">/api/health</span>
            </h2>
            {health === 'loading' && (
              <p className="text-sm text-[#888888]">Checking backend status…</p>
            )}
            {health === 'ok' && healthData && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <StatusRow label="Backend API" value="Connected (HTTP 200)" ok />
                <StatusRow
                  label="Database"
                  value={healthData.database}
                  ok={healthData.database === 'connected'}
                />
                <StatusRow
                  label="Last Checked"
                  value={new Date(healthData.timestamp).toLocaleTimeString()}
                />
              </div>
            )}
            {health === 'error' && (
              <p className="text-sm text-[#dc2626]">
                Could not connect to backend API on port 5000. Start the backend with{' '}
                <code>npm run dev:api</code>.
              </p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  active?: boolean;
  badge?: string;
}

function FeatureCard({ title, description, icon, active, badge }: FeatureCardProps) {
  return (
    <div
      className={`rounded-xl border p-6 flex flex-col justify-between h-full transition-all ${
        active
          ? 'border-[#333333] bg-[#161616] group-hover:border-[#dc2626]/60 group-hover:bg-[#1a1a1a]'
          : 'border-[#222222] bg-[#121212] group-hover:border-[#333333]'
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-3xl">{icon}</span>
          {active ? (
            <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              Available
            </span>
          ) : (
            badge && (
              <span className="text-[10px] uppercase tracking-wider bg-[#222222] text-[#888888] px-2 py-0.5 rounded-full border border-[#2e2e2e]">
                {badge}
              </span>
            )
          )}
        </div>
        <div>
          <h3 className="font-bold text-[#f5f5f5] text-base group-hover:text-white transition-colors">
            {title}
          </h3>
          <p className="mt-1.5 text-xs text-[#888888] leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-[#222222] flex items-center text-xs font-medium text-[#dc2626] group-hover:text-red-400">
        <span>{active ? 'Manage Movies →' : 'View Details →'}</span>
      </div>
    </div>
  );
}

interface StatusRowProps {
  label: string;
  value: string;
  ok?: boolean;
}

function StatusRow({ label, value, ok }: StatusRowProps) {
  const color = ok === undefined ? '#a3a3a3' : ok ? '#22c55e' : '#dc2626';

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-[#777777]">{label}</span>
      <span className="font-medium text-xs truncate" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
