import { LogLevel } from './eventMessageDto';

export interface EventMessageDbView {
  id: string;
  applicationId: string;
  timestamp: string;
  logLevel: LogLevel;
  platform: string;
  bundleId: string;
  deviceId: string;
  message: string;
  tags?: string[] | null;
  meta?: Record<string, string> | null;
  stackTrace?: string | null;
}