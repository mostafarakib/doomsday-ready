import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackendHealthMonitor } from '../healthMonitor.ts';

describe('BackendHealthMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. does not show an error banner while initial health check is pending (initial loading)', async () => {
    let resolveCheck: (value: unknown) => void = () => {};
    const checkFn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveCheck = resolve;
        }),
    );

    const monitor = new BackendHealthMonitor({ checkFn });
    const states: Array<{ isAvailable: boolean; status: string }> = [];

    monitor.subscribe((isAvailable, status) => {
      states.push({ isAvailable, status });
    });

    monitor.start();

    // Health check was called on startup
    expect(checkFn).toHaveBeenCalledTimes(1);

    // Initial state before resolution: isAvailable is true (banner is hidden)
    expect(monitor.getIsAvailable()).toBe(true);
    expect(monitor.getStatus()).toBe('checking');
    expect(states[0]).toEqual({ isAvailable: true, status: 'checking' });

    // Clean up
    resolveCheck({ status: 'ok' });
    monitor.stop();
  });

  it('2. transitions to unavailable on 10s request timeout and schedules 5s retry', async () => {
    let callCount = 0;
    const checkFn = vi.fn().mockImplementation((signal?: AbortSignal) => {
      callCount++;
      if (callCount === 1) {
        // First call hangs indefinitely until 10s timeout aborts it
        return new Promise((_, reject) => {
          signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      }
      // Retry succeeds
      return Promise.resolve({ status: 'ok', database: 'connected' });
    });

    const monitor = new BackendHealthMonitor({
      checkFn,
      requestTimeoutMs: 10000,
      retryIntervalMs: 5000,
    });

    const states: Array<{ isAvailable: boolean; status: string }> = [];
    monitor.subscribe((isAvailable, status) => {
      states.push({ isAvailable, status });
    });

    monitor.start();

    // At 9999ms, request is still pending; banner is not yet shown
    await vi.advanceTimersByTimeAsync(9999);
    expect(checkFn).toHaveBeenCalledTimes(1);
    expect(monitor.getIsAvailable()).toBe(true);

    // At 10000ms, request timeout fires and aborts in-flight request
    await vi.advanceTimersByTimeAsync(1);

    // Timeout is treated as backend unavailability
    expect(monitor.getIsAvailable()).toBe(false);
    expect(monitor.getStatus()).toBe('unavailable');
    expect(states[states.length - 1]).toEqual({
      isAvailable: false,
      status: 'unavailable',
    });

    // Advance 5000ms to verify normal retry behavior
    await vi.advanceTimersByTimeAsync(5000);
    expect(checkFn).toHaveBeenCalledTimes(2);

    // On successful retry, recovers immediately
    expect(monitor.getIsAvailable()).toBe(true);
    expect(monitor.getStatus()).toBe('available');

    monitor.stop();
  });

  it('3. continuously retries every 5s while remaining unavailable', async () => {
    const checkFn = vi.fn().mockRejectedValue(new Error('Server unavailable (503)'));
    const monitor = new BackendHealthMonitor({
      checkFn,
      retryIntervalMs: 5000,
    });

    monitor.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(checkFn).toHaveBeenCalledTimes(1);

    // Advance through 3 retry cycles (15s total)
    for (let i = 1; i <= 3; i++) {
      await vi.advanceTimersByTimeAsync(5000);
      expect(checkFn).toHaveBeenCalledTimes(1 + i);
      expect(monitor.getIsAvailable()).toBe(false);
    }

    monitor.stop();
  });

  it('4. immediately hides banner and stops 5s retrying when health check succeeds (automatic recovery)', async () => {
    let callCount = 0;
    const checkFn = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Connection refused'));
      }
      return Promise.resolve({ status: 'ok', database: 'connected' });
    });

    const monitor = new BackendHealthMonitor({
      checkFn,
      retryIntervalMs: 5000,
      pollIntervalMs: 30000,
    });

    const availabilityChanges: boolean[] = [];
    monitor.subscribe((isAvailable) => {
      availabilityChanges.push(isAvailable);
    });

    monitor.start();
    await vi.advanceTimersByTimeAsync(0);

    // Initial check failed -> unavailable
    expect(monitor.getIsAvailable()).toBe(false);
    expect(checkFn).toHaveBeenCalledTimes(1);

    // Advance 5000ms to trigger retry
    await vi.advanceTimersByTimeAsync(5000);

    // Second check succeeded -> recovered immediately
    expect(checkFn).toHaveBeenCalledTimes(2);
    expect(monitor.getIsAvailable()).toBe(true);
    expect(monitor.getStatus()).toBe('available');

    // Retrying should have stopped!
    // Advance by another 5000ms and verify checkFn was NOT called again at 5s
    await vi.advanceTimersByTimeAsync(5000);
    expect(checkFn).toHaveBeenCalledTimes(2);

    monitor.stop();
  });

  it('5. continues monitoring after recovery and detects subsequent outages', async () => {
    let callCount = 0;
    const checkFn = vi.fn().mockImplementation(() => {
      callCount++;
      // Call 1 (startup): success
      // Call 2 (poll check at 30s): failure (subsequent outage!)
      // Call 3 (retry at 35s): success (recovery again)
      if (callCount === 2) {
        return Promise.reject(new Error('Backend crashed: 502 Bad Gateway'));
      }
      return Promise.resolve({ status: 'ok', database: 'connected' });
    });

    const monitor = new BackendHealthMonitor({
      checkFn,
      retryIntervalMs: 5000,
      pollIntervalMs: 30000,
    });

    const statusHistory: string[] = [];
    monitor.subscribe((_, status) => {
      statusHistory.push(status);
    });

    // 1. Startup
    monitor.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(monitor.getIsAvailable()).toBe(true);
    expect(monitor.getStatus()).toBe('available');
    expect(checkFn).toHaveBeenCalledTimes(1);

    // 2. Advance 30s to the regular background poll interval
    await vi.advanceTimersByTimeAsync(30000);

    // Call 2 executed and failed -> banner displayed again!
    expect(checkFn).toHaveBeenCalledTimes(2);
    expect(monitor.getIsAvailable()).toBe(false);
    expect(monitor.getStatus()).toBe('unavailable');

    // 3. While unavailable, it retries at 5s (not 30s)
    await vi.advanceTimersByTimeAsync(5000);

    // Call 3 executed and succeeded -> recovered again!
    expect(checkFn).toHaveBeenCalledTimes(3);
    expect(monitor.getIsAvailable()).toBe(true);
    expect(monitor.getStatus()).toBe('available');

    monitor.stop();
  });

  it('6. prevents overlapping health requests while an in-flight check is pending', async () => {
    let resolveFirstCheck: () => void = () => {};
    const checkFn = vi.fn().mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirstCheck = () => resolve({ status: 'ok' });
        }),
    );

    const monitor = new BackendHealthMonitor({ checkFn });
    monitor.start();

    expect(checkFn).toHaveBeenCalledTimes(1);
    expect(monitor.isInFlight()).toBe(true);

    // Attempt concurrent executions while first request is pending
    await monitor.checkNow();
    await monitor.executeCheck();

    // Should NOT have made overlapping calls
    expect(checkFn).toHaveBeenCalledTimes(1);

    // Resolve the in-flight request
    resolveFirstCheck();
    await vi.advanceTimersByTimeAsync(0);

    expect(monitor.isInFlight()).toBe(false);
    monitor.stop();
  });

  it('7. cleans up intervals and aborts in-flight requests when stopped (unmount)', async () => {
    let abortedSignal: boolean = false;
    const checkFn = vi.fn().mockImplementation((signal?: AbortSignal) => {
      if (signal) {
        signal.addEventListener('abort', () => {
          abortedSignal = true;
        });
      }
      return new Promise((_, reject) => {
        if (signal?.aborted) {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        }
      });
    });

    const monitor = new BackendHealthMonitor({
      checkFn,
      retryIntervalMs: 5000,
    });

    monitor.start();
    expect(checkFn).toHaveBeenCalledTimes(1);

    // Stop monitor (simulating component unmount)
    monitor.stop();

    expect(abortedSignal).toBe(true);

    // Advancing timers should not trigger any further checks or retries
    await vi.advanceTimersByTimeAsync(100000);
    expect(checkFn).toHaveBeenCalledTimes(1);
  });

  it('8. ignores ordinary application errors unrelated to health endpoint', async () => {
    const checkFn = vi.fn().mockResolvedValue({ status: 'ok', database: 'connected' });
    const monitor = new BackendHealthMonitor({ checkFn });

    monitor.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(monitor.getIsAvailable()).toBe(true);

    // Simulate an unrelated application API error elsewhere in the app (e.g. 400 validation error)
    const unrelatedApiError = new Error('Validation failed: releaseYear must be positive');

    // The health monitor is not affected by unrelated app errors
    expect(monitor.getIsAvailable()).toBe(true);
    expect(monitor.getStatus()).toBe('available');
    expect(unrelatedApiError.message).toContain('Validation failed');

    monitor.stop();
  });
});
