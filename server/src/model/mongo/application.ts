import { model, Schema, Types } from 'mongoose';
import { IBaseSchema, baseSchema } from './baseSchema';

export interface IApplication extends IBaseSchema {
  _id: Types.ObjectId;
  name: string;
  bundles: IBundleId[];
  deleted: boolean;
  deletedAt?: Date;
}

export interface IBundleId {
  platform: string;
  bundleId: string;

}

export const bundleSchema = new Schema<IBundleId>({
  platform: { type: String, required: true },
  bundleId: { type: String, required: true },
});


export const applicationSchema = baseSchema<IApplication>({
  name: { type: String, required: true, unique: true },
  bundles: {
    type: [bundleSchema],
    validate: {
      validator: function (bundleIds: IBundleId[]) {
        const seen = new Set();
        for (const b of bundleIds) {
          const key = `${b.platform}|${b.bundleId}`;
          if (seen.has(key)) return false;
          seen.add(key);
        }
        return true;
      },
      message: 'bundleIds must be unique within the application',
    },
  },
  deleted: { type: Boolean, required: true, default: false },
  deletedAt: { type: Date, default: null }
});

export const Application = model<IApplication>('Application', applicationSchema);
