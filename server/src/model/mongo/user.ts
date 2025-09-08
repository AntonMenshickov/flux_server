import { model, Types } from 'mongoose';
import { IBaseSchema, baseSchema } from './baseSchema';

export interface IUser extends IBaseSchema {
  _id: Types.ObjectId;
  login: string;
  passwordHash: string;
  isOwner: boolean;
}

export const userSchema = baseSchema<IUser>({
  login: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isOwner: { type: Boolean, required: true, default: false },
});

export const User = model<IUser>('User', userSchema);
