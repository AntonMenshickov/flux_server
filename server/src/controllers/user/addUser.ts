import { Response, NextFunction } from 'express';
import { IUser, User } from '../../model/mongo/user';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { bcryptUtil } from '../../utils/bcryptUtil';
import { AuthRequest } from '../../middleware/authorizationRequired';

export async function addUser(req: AuthRequest, res: Response, next: NextFunction) {
  const { login, password } = req.body;

  if (req.user?.isOwner !== true) {
    return res.status(403).json({ error: responseMessages.FORBIDDEN });
  }

  const existUser: IUser & Document | null = await User.findOne({ login }).exec();

  if (existUser) {
    return res.status(400).json({ error: responseMessages.USERNAME_TAKEN });
  }
  const user = new User({ login, passwordHash: await bcryptUtil.hash(password) });
  await user.save();
  console.log('Created new user:', login);


  return res.status(200).json({
    success: true,
    result: {
      id: user._id.toString(),
      login: user.login,
      isOwner: user.isOwner,
    }
  });
}