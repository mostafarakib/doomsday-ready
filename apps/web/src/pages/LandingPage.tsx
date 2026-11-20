import { useEffect, useState } from 'react';

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
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api';

    fetch(`${apiUrl}/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ success: boolean; data: HealthData }>;
      })
      .then((body) => {
        setHealthData(body.data);
        setHealth('ok');
      })
      .catch(() => {
        setHealth('error');
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <header className="relative flex flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
        {/* Subtle red gradient backdrop */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, #dc2626 0%, transparent 70%)',
          }}
        />

        <p className="relative text-sm uppercase tracking-widest text-[#dc2626] mb-4 font-semibold">
          MCU Prep Tool
        </p>
        <h1 className="relative text-5xl sm:text-7xl font-black tracking-tight mb-6">
          Doomsday <span className="text-[#dc2626]">Ready</span>
        </h1>
        <p className="relative max-w-xl text-lg text-[#a3a3a3] leading-relaxed">
          Manage your MCU watch list, build a rewatch plan before <em>Avengers: Doomsday</em>, and
          calculate the perfect opening-night group booking.
        </p>
      </header>

      {/* Feature cards */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            title="Movies"
            description="Create and manage movies with their prerequisite watch order."
            icon="🎬"
            comingSoon
          />
          <FeatureCard
            title="Rewatch Plan"
            description="Get the full prerequisite chain for any target movie, automatically ordered."
            icon="📋"
            comingSoon
          />
          <FeatureCard
            title="Group Booking"
            description="Find the minimum bundle combination for your group size."
            icon="🎟️"
            comingSoon
          />
        </div>

        {/* API health status */}
        <div className="mt-10 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <h2 className="text-xs uppercase tracking-widest text-[#a3a3a3] mb-3 font-semibold">
            API Status
          </h2>
          {health === 'loading' && <p className="text-sm text-[#a3a3a3]">Checking API…</p>}
          {health === 'ok' && healthData && (
            <div className="flex flex-col gap-1 text-sm">
              <StatusRow label="API" value="online" ok />
              <StatusRow
                label="Database"
                value={healthData.database}
                ok={healthData.database === 'connected'}
              />
              <StatusRow label="Timestamp" value={healthData.timestamp} />
            </div>
          )}
          {health === 'error' && (
            <p className="text-sm text-[#dc2626]">
              Could not reach the API. Make sure the backend is running on port 5000.
            </p>
          )}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-[#a3a3a3] border-t border-[#2a2a2a]">
        Doomsday Ready — Assessment Project · Phase 1
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  comingSoon?: boolean;
}

function FeatureCard({ title, description, icon, comingSoon }: FeatureCardProps) {
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 flex flex-col gap-3">
      <span className="text-3xl">{icon}</span>
      <div>
        <h3 className="font-semibold text-[#f5f5f5] flex items-center gap-2">
          {title}
          {comingSoon && (
            <span className="text-[10px] uppercase tracking-wider bg-[#2a2a2a] text-[#a3a3a3] px-2 py-0.5 rounded-full">
              Coming soon
            </span>
          )}
        </h3>
        <p className="mt-1 text-sm text-[#a3a3a3] leading-relaxed">{description}</p>
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
    <div className="flex gap-2">
      <span className="text-[#a3a3a3] w-24 shrink-0">{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
  );
}
