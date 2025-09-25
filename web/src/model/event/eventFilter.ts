import type { LogLevel } from './logLevel';

export interface EventFilter {
  message?: string | null;
  logLevel?: LogLevel[] | null;
  tags?: string[] | null;
  meta?: Record<string, string> | null;
  platform?: string | null;
  bundleId?: string | null;
  deviceId?: string | null;
  deviceName?: string | null;
  osName?: string | null;
  from?: number | null;
  to?: number | null;
}