import type { LogLevel } from './logLevel';

export interface EventMessageBasic {
  id: string;
  timestamp: number;
  logLevel: LogLevel;
  message: string;
}

