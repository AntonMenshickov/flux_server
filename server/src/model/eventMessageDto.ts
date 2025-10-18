
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRASH = 'crash',
  DEBUG = 'debug',
}

export interface EventMessageDto {
  timestamp: number;
  logLevel: LogLevel;
  message: string;
  tags?: string[];
  meta?: Record<string, string>;
  stackTrace?: string;
}