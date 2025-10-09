import { model, Schema, Types } from 'mongoose';
import { IBaseSchema, baseSchema } from './baseSchema';
import { LogLevel } from '../eventMessageDto';

export interface IApplicationStats extends IBaseSchema {
  _id: Types.ObjectId;
  application: Types.ObjectId;
  logLevelStats: Map<LogLevel, number>;
  date: Date;
}

export const applicationStatsSchema = baseSchema<IApplicationStats>({
  application: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  },
   logLevelStats: {
    type: Map,
    of: Number,
    default: {}
  },
  date: { type: Date, required: true },
});


applicationStatsSchema.pre('save', function (next) {
  if ((this as any).isNew) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    (this as any).date = date;
  }
  next();
});

export const ApplicationStats = model<IApplicationStats>('ApplicationStats', applicationStatsSchema);
