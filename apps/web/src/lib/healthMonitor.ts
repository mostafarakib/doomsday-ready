import { healthApi } from '../api/health.ts';

export type HealthState = 'checking' | 'available' | 'unavailable';

export interface HealthMonitorOptions {
  /**
   * Interval in milliseconds to retry when the server is unavailable.
   * Default: 5000 (5 seconds) per requirement.
   */
  retryIntervalMs?: number;

  /**
   * Interval in milliseconds for ongoing monitoring once healthy.
   * Default: 30000 (30 seconds).
   */
  pollIntervalMs?: number;

  /**
   * Timeout in milliseconds for each health check request.
   * Default: 10000 (10 seconds) per requirement.
   */
  requestTimeoutMs?: number;

  /**
   * Function to execute for the health check.
   * Defaults to healthApi.checkHealth(signal).
   */
  checkFn?: (signal?: AbortSignal) => Promise<unknown>;
}

export type HealthListener = (isAvailable: boolean, status: HealthState) => void;

export class BackendHealthMonitor {
  private readonly retryIntervalMs: number;
  private readonly pollIntervalMs: number;
  private readonly requestTimeoutMs: number;
  private readonly checkFn: (signal?: AbortSignal) => Promise<unknown>;

  private isAvailable: boolean = true;
  private status: HealthState = 'checking';
  private inFlight: boolean = false;
  private isRunning: boolean = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private requestTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;
  private readonly listeners = new Set<HealthListener>();

  constructor(options: HealthMonitorOptions = {}) {
    this.retryIntervalMs = options.retryIntervalMs ?? 5000;
    this.pollIntervalMs = options.pollIntervalMs ?? 30000;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 10000;
    this.checkFn = options.checkFn ?? ((signal) => healthApi.checkHealth(signal));
  }

  public getStatus(): HealthState {
    return this.status;
  }

  public getIsAvailable(): boolean {
    return this.isAvailable;
  }

  public isInFlight(): boolean {
    return this.inFlight;
  }

  /**
   * Starts monitoring backend availability.
   * Performs an immediate health check on startup without blocking.
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    void this.executeCheck();
  }

  /**
   * Triggers an immediate health check if one is not already in flight.
   */
  public async checkNow(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.executeCheck();
  }

  /**
   * Stops monitoring and cancels any pending timeouts and in-flight health requests.
   */
  public stop(): void {
    this.isRunning = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.requestTimeoutTimer) {
      clearTimeout(this.requestTimeoutTimer);
      this.requestTimeoutTimer = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.inFlight = false;
  }

  /**
   * Subscribes a listener to health availability changes.
   * Invokes listener immediately with the current state.
   */
  public subscribe(listener: HealthListener): () => void {
    this.listeners.add(listener);
    listener(this.isAvailable, this.status);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.isAvailable, this.status);
    }
  }

  private scheduleNext(delayMs: number): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (!this.isRunning) {
      return;
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      void this.executeCheck();
    }, delayMs);
  }

  /**
   * Executes a single health check request with overlap prevention and 10s timeout.
   */
  public async executeCheck(): Promise<void> {
    // Prevent overlapping requests or executions after stop()
    if (this.inFlight || !this.isRunning) {
      return;
    }

    this.inFlight = true;
    const controller = new AbortController();
    this.abortController = controller;
    let didTimeout = false;

    // Set 10-second request timeout to ensure health request cannot hang indefinitely
    this.requestTimeoutTimer = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, this.requestTimeoutMs);

    try {
      await this.checkFn(controller.signal);

      if (this.requestTimeoutTimer) {
        clearTimeout(this.requestTimeoutTimer);
        this.requestTimeoutTimer = null;
      }

      if (!this.isRunning) {
        return;
      }

      // Check succeeded:
      const changed = !this.isAvailable || this.status !== 'available';
      this.isAvailable = true;
      this.status = 'available';

      if (changed) {
        this.notify();
      }

      // When health check succeeds: immediately hide banner and stop retrying.
      // Resume regular background monitoring interval.
      this.scheduleNext(this.pollIntervalMs);
    } catch {
      if (this.requestTimeoutTimer) {
        clearTimeout(this.requestTimeoutTimer);
        this.requestTimeoutTimer = null;
      }

      if (!this.isRunning) {
        return;
      }

      // If aborted via stop() (and not a timeout), ignore error
      if (controller.signal.aborted && !didTimeout) {
        return;
      }

      // Health check failed (network error, timeout, or non-2xx response):
      // Treat timeout as backend unavailability and continue normal retry behavior
      const changed = this.isAvailable || this.status !== 'unavailable';
      this.isAvailable = false;
      this.status = 'unavailable';

      if (changed) {
        this.notify();
      }

      // While unavailable, retry health endpoint every 5 seconds
      this.scheduleNext(this.retryIntervalMs);
    } finally {
      if (this.requestTimeoutTimer) {
        clearTimeout(this.requestTimeoutTimer);
        this.requestTimeoutTimer = null;
      }
      this.inFlight = false;
      this.abortController = null;
    }
  }
}
