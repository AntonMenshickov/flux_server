import type { LogLevel } from '../event/logLevel';

export interface ApplicationShortStats {
  id: string;
  name: string;
  stats: {
    [K in LogLevel]: number;
  };
  date: Date;
}