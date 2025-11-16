import { model, Schema, Types, Document } from 'mongoose';
import { IBaseSchema, baseSchema } from './baseSchema';
import { IUser } from './user';

export interface IApplication extends IBaseSchema {
  _id: Types.ObjectId;
  name: string;
  bundles: IBundleId[];
  token: string;
  maintainers: Types.ObjectId[];
  deleted: boolean;
  deletedAt?: Date;
}

export interface IBundleId {
  platform: string;
  bundleId: string;
}

export type ApplicationPopulatedDoc = Omit<IApplication, 'maintainers'> & {
  maintainers: IUser[];
} & Document;

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
  token: {type: String, required: true},
  maintainers: [
    {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      default: []
    },
  ],
  deleted: { type: Boolean, required: true, default: false },
  deletedAt: { type: Date, default: null }
});

export const Application = model<IApplication>('Application', applicationSchema);
