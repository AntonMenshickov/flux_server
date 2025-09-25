import type { LogLevel } from './logLevel';

export interface EventMessage {
  id: string;
  timestamp: number;
  logLevel: LogLevel;
  applicationId: string;
  platform: string;
  bundleId: string;
  deviceId: string;
  deviceName: string;
  osName: string;
  message: string;
  tags: string[];
  meta: Map<string, string>;
  stackTrace?: string;
}