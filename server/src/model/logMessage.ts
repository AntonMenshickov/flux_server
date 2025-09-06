export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

export interface LogMessage {
  id: string;
  timestamp: Date;
  LogLevel: LogLevel;
  message: string;
  context?: Record<string, any>;
  stackTrace?: string;
}