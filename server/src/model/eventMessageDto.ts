
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

export interface EventMessageDto {
  timestamp: number;
  logLevel: LogLevel;
  platform: string;
  bundleId: string;
  deviceId: string;
  message: string;
  tags?: string[] | null;
  meta?: Record<string, string> | null;
  stackTrace?: string | null;
}