/**
 * UnoAccess Performance Monitoring SDK
 *
 * Usage (Express):
 *   import { UnoAccessMonitor } from 'unoaccess-monitor';
 *   const monitor = new UnoAccessMonitor({
 *     clientId: 'your-client-id',
 *     clientSecret: 'your-client-secret',
 *     endpoint: 'https://your-unoaccess-instance.com/api/monitoring/logs',
 *   });
 *   app.use(monitor.expressMiddleware());
 */

export interface MonitorConfig {
  /** OAuth2 client ID issued by UnoAccess */
  clientId: string;
  /** OAuth2 client secret issued by UnoAccess */
  clientSecret: string;
  /** Full URL to the UnoAccess monitoring ingest endpoint */
  endpoint: string;
  /**
   * Sampling rate between 0 and 1 (default: 1.0 = 100%).
   * 0.1 means only 10% of requests are logged.
   */
  sampleRate?: number;
  /** How many logs to accumulate before flushing (default: 50) */
  batchSize?: number;
  /** How often to flush in ms even if batchSize not reached (default: 10_000) */
  flushInterval?: number;
  /** Whether to include request IP (default: false). Hashed server-side. */
  includeIp?: boolean;
}

export interface LogEntry {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userAgent: string;
  ip?: string;
  userId?: string;
  timestamp: string;
}

export class UnoAccessMonitor {
  private config: Required<MonitorConfig>;
  private queue: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: MonitorConfig) {
    this.config = {
      sampleRate: 1.0,
      batchSize: 50,
      flushInterval: 10_000,
      includeIp: false,
      ...config,
    };
    // Start periodic flush
    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
    // Flush on process exit
    process.on('beforeExit', () => this.flush());
  }

  /**
   * Express middleware that automatically tracks all incoming requests.
   *
   * @example
   *   app.use(monitor.expressMiddleware());
   */
  expressMiddleware() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (req: any, res: any, next: any) => {
      // Sampling
      if (Math.random() > this.config.sampleRate) return next();

      const start = Date.now();
      res.on('finish', () => {
        const entry: LogEntry = {
          endpoint: req.path || req.url,
          method: req.method,
          responseTime: Date.now() - start,
          statusCode: res.statusCode,
          userAgent: req.headers['user-agent'] || '',
          timestamp: new Date().toISOString(),
        };
        if (this.config.includeIp) {
          entry.ip = req.ip || req.connection?.remoteAddress || '';
        }
        // Extract userId from common patterns (JWT bearer, session, etc.)
        if (req.user?.id) entry.userId = req.user.id;
        else if (req.user?.userId) entry.userId = req.user.userId;

        this.enqueue(entry);
      });
      next();
    };
  }

  /**
   * Manually log a single entry (useful for non-Express environments).
   */
  log(entry: LogEntry): void {
    if (Math.random() > this.config.sampleRate) return;
    this.enqueue(entry);
  }

  private enqueue(entry: LogEntry): void {
    this.queue.push(entry);
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Immediately flush all queued logs to the UnoAccess ingest endpoint.
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    try {
      const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({ logs: batch }),
      });
      if (!response.ok) {
        console.warn(`[UnoAccess Monitor] Flush failed: ${response.status} ${response.statusText}`);
        // Re-queue on transient errors (keep up to 500 items to avoid memory leak)
        if (response.status >= 500 && this.queue.length < 500) {
          this.queue.unshift(...batch.slice(-50)); // keep last 50 of the failed batch
        }
      }
    } catch (err) {
      console.warn('[UnoAccess Monitor] Flush error:', err);
    }
  }

  /**
   * Stop the periodic flush timer (call on graceful shutdown).
   */
  destroy(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flush();
  }
}
