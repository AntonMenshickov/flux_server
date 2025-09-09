export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

export interface EventMessage {
  id: string;
  timestamp: number;
  receiveTimestamp?: number;
  logLevel: LogLevel;
  applicationId: string;
  platform: string;
  bundleId: string;
  deviceId: string;
  message: string;
  tags: string[];
  meta: Map<string, string>;
  stackTrace?: string;
}