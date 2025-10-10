import type { LogLevel } from '../event/logLevel';

export interface IApplicationStats {
  _id: string;
  application: string;
  logLevelStats?: {
    [K in LogLevel]: number;
  };
  platformStats?: Map<string, number>;
  osStats?: Map<string, number>;
  date: Date;
}
