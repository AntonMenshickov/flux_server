import { model, Schema, Types } from 'mongoose';
import { IBaseSchema, baseSchema } from './baseSchema';
import { BundleId, IBundleId } from './bundleId';

export interface IApplication extends IBaseSchema {
  _id: Types.ObjectId;
  name: string;
  bundleIds: IBundleId[];
  deleted: boolean;
  deletedAt?: Date;
}

export const applicationSchema = baseSchema<IApplication>({
  name: { type: String, required: true, unique: true },
  bundleIds: [{ type: Schema.Types.ObjectId, ref: 'BundleId', required: true }],
  deleted: { type: Boolean, required: true, default: false },
  deletedAt: { type: Date, default: null }
});

export const Application = model<IApplication>('Application', applicationSchema);
