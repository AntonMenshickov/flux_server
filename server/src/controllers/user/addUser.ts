import { Response, NextFunction } from 'express';
import { IUser, User } from '../../model/mongo/user';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { bcryptUtil } from '../../utils/bcryptUtil';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { authValidateSchema } from '../auth/auth';
import z from 'zod';

export const addUserValidateSchema = z.object({
  body: z.object({
    login: z.string().trim().min(3),
    password: z.string().trim().min(5).regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit"),
  })
});

export async function addUser(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { login, password } = req.body;

  if (req.user.isOwner !== true) {
    return res.status(403).json({ error: responseMessages.FORBIDDEN });
  }

  const existUser: IUser & Document | null = await User.findOne({ login }).exec();

  if (existUser) {
    return res.status(400).json({ error: responseMessages.USERNAME_TAKEN });
  }
  const user = new User({ login, passwordHash: await bcryptUtil.hash(password) });
  await user.save();


  return res.status(200).json({
    success: true,
    result: {
      id: user._id.toString(),
      login: user.login,
      isOwner: user.isOwner,
    }
  });
}