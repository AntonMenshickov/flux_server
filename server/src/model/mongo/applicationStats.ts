import { model, Types } from 'mongoose';
import { IBaseSchema, baseSchema } from './baseSchema';
import { LogLevel } from '../eventMessageDto';

export interface IApplicationStats extends IBaseSchema {
  _id: Types.ObjectId;
  application: Types.ObjectId;
  logLevelStats: Map<LogLevel, number>;
  platformStats: Map<LogLevel, number>;
  osStats: Map<LogLevel, number>;
  date: Date;
}

export const applicationStatsSchema = baseSchema<IApplicationStats>({
  application: {
    type: Types.ObjectId,
    ref: 'Application',
    required: true,
  },
  logLevelStats: {
    type: Map,
    of: Number,
    default: {}
  },
  platformStats: {
    type: Map,
    of: Number,
    default: {}
  },
  osStats: {
    type: Map,
    of: Number,
    default: {}
  },
  date: { type: Date, required: true },
});

applicationStatsSchema.index({ application: 1, date: 1 }, { unique: true });

export const ApplicationStats = model<IApplicationStats>('ApplicationStats', applicationStatsSchema);
