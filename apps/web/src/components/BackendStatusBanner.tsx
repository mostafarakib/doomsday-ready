import { useBackendHealth } from '../hooks/useBackendHealth.ts';
import { HealthMonitorOptions } from '../lib/healthMonitor.ts';

export interface BackendStatusBannerViewProps {
  isAvailable: boolean;
}

/**
 * Pure presentation component for the global server availability banner.
 * Displays a non-blocking, responsive notification when the backend is unreachable.
 */
export function BackendStatusBannerView({ isAvailable }: BackendStatusBannerViewProps) {
  if (isAvailable) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-[#1e130c] border-b border-amber-600/70 text-amber-200 px-4 py-2 text-xs sm:text-sm font-medium shadow-md transition-all pointer-events-auto"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 text-center">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <p className="tracking-wide">Server temporarily unavailable. We&apos;re reconnecting...</p>
      </div>
    </div>
  );
}

/**
 * Connected global backend status banner.
 * Automatically checks /api/health and handles reconnection retries.
 */
export function BackendStatusBanner(props: HealthMonitorOptions) {
  const { isAvailable } = useBackendHealth(props);

  return <BackendStatusBannerView isAvailable={isAvailable} />;
}
