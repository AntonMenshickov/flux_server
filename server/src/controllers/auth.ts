import { Request, Response, NextFunction } from 'express';
import { IUser, User } from '../model/mongo/user';
import { responseMessages } from '../strings/responseMessages';
import { tokenUtil } from '../utils/tokenUtil';
import { Document } from 'mongoose';
import { bcryptUtil } from '../utils/bcryptUtil';

// typedef UserDocument = IUser & Document;
export async function auth(req: Request, res: Response, next: NextFunction) {
  const { login, password } = req.body;
  const usersCount = await User.countDocuments().exec();
  let user: IUser & Document | null;
  if (usersCount === 0) {
    user = new User({ login, passwordHash: await bcryptUtil.hash(password) });
    await user.save();
    console.log('Created initial user:', login);
  } else {
    user = await User.findOne({ login }).exec();
  }
  if (!user) {
    return res.status(404).json({ error: responseMessages.USER_NOT_FOUND });
  }
  const passwordCorrect = await bcryptUtil.compare(password, user.passwordHash);
  if (!passwordCorrect) {
    return res.status(401).json({ error: responseMessages.INVALID_PASSWORD });
  }
  const tokens = tokenUtil.create(user._id.toString());


  return res.status(200).json({
    success: true,
    result: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  });
}