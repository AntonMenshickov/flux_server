import { model, Types } from 'mongoose';
import { IBaseSchema, withTimestamps } from './baseSchema';

export interface IUser extends IBaseSchema {
  _id: Types.ObjectId;
  login: string;
  passwordHash: string;
}

export const userSchema = withTimestamps<IUser>({
  login: { type: String, required: true },
  passwordHash: { type: String, required: true },
});

export const User = model<IUser>('User', userSchema);
