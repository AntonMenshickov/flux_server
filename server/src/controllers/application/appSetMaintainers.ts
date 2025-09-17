import { Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { Application, IApplication } from '../../model/mongo/application';
import z from 'zod';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { objectIdSchema } from '../../utils/zodUtil';


export const appSetMaintainersValidateSchema = z.object({
  body: z.object({
    id: objectIdSchema,
    maintainers: z.array(objectIdSchema).nonempty()
  })
});

export async function appSetMaintainers(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { id, maintainers } = appSetMaintainersValidateSchema.parse(req).body;


  const existApp: IApplication & Document | null = await Application.findById(id).exec();
  if (!existApp) {
    return res.status(400).json({ error: responseMessages.APPLICATION_NOT_FOUND });
  }

  const maintainersList = [req.user!._id, ...maintainers.filter(e => e.toString() != req.user?._id.toString())];

  existApp.maintainers = maintainersList;

  await existApp.save();
    return res.status(200).json({
      success: true,
    });
}