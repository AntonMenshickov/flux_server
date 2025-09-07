import { model, Schema, Types } from 'mongoose';
import { IBaseSchema, baseSchema } from './baseSchema';
import { BundleId, IBundleId } from './bundleId';

export interface IApplication extends IBaseSchema {
  _id: Types.ObjectId;
  name: string;
  bundleIds: IBundleId[];
}

export const applicationSchema = baseSchema<IApplication>({
  name: { type: String, required: true },
  bundleIds: [{ type: Schema.Types.ObjectId, ref: 'BundleId', required: true }],
});

export const Application = model<IApplication>('Application', applicationSchema);
