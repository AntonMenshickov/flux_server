import { model, Types } from 'mongoose';
import { IBaseSchema, baseSchema } from './baseSchema';

export interface IBundleId extends IBaseSchema {
  _id: Types.ObjectId;
  platform: string;
  bundleId: string;
  
}

export const bundleIdSchema = baseSchema<IBundleId>({
  platform: { type: String, required: true },
  bundleId: { type: String, required: true },
});

export const BundleId = model<IBundleId>('BundleId', bundleIdSchema);
