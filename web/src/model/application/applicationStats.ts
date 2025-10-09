import type { LogLevel } from '../event/logLevel';

export interface ApplicationStats {
  id: string;
  name: string;
  stats: {
    [K in LogLevel]: number;
  };
}