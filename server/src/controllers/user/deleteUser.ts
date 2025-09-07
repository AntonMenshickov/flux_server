import { Response, NextFunction } from 'express';
import { IUser, User } from '../../model/mongo/user';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { AuthRequest } from '../../middleware/authorizationRequired';

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  const { userId } = req.query;

  if (req.user?.isOwner !== true) {
    return res.status(403).json({ error: responseMessages.FORBIDDEN });
  }

  if (userId == req.user._id.toString()) {
    return res.status(400).json({ error: responseMessages.CANNOT_DELETE_SELF });
  }

  const user: IUser & Document | null = await User.findById(userId).exec();

  if (!user) {
    return res.status(404).json({ error: responseMessages.USER_NOT_FOUND });
  }
  await User.deleteOne({ _id: userId }).exec();
  console.log('Deleted user:', userId);


  return res.status(200).json({
    success: true,
  });
}