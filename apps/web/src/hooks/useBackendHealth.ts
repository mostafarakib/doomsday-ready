import { useEffect, useState } from 'react';
import { BackendHealthMonitor, HealthMonitorOptions, HealthState } from '../lib/healthMonitor.ts';

export function useBackendHealth(options: HealthMonitorOptions = {}) {
  const { retryIntervalMs, pollIntervalMs, requestTimeoutMs, checkFn } = options;

  const [state, setState] = useState<{ isAvailable: boolean; status: HealthState }>({
    isAvailable: true,
    status: 'checking',
  });

  useEffect(() => {
    const monitor = new BackendHealthMonitor({
      retryIntervalMs,
      pollIntervalMs,
      requestTimeoutMs,
      checkFn,
    });

    const unsubscribe = monitor.subscribe((isAvailable, status) => {
      setState({ isAvailable, status });
    });

    monitor.start();

    const handleOnline = () => {
      void monitor.checkNow();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
      unsubscribe();
      monitor.stop();
    };
  }, [retryIntervalMs, pollIntervalMs, requestTimeoutMs, checkFn]);

  return state;
}
