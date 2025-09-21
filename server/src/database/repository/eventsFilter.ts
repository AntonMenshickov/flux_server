import { LogLevel } from '../../model/eventMessageDto';

export interface EventFilter {
  message?: string | null;
  logLevel?: LogLevel[] | null;
  tags?: string[] | null;
  meta?: Record<string, string> | null;
  platform?: string | null;
  bundleId?: string | null;
  deviceId?: string | null;
  from?: number | null;
  to?: number | null;
}