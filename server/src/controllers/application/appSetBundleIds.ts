import { Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { Application, IApplication } from '../../model/mongo/application';
import z from 'zod';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { objectIdSchema } from '../../utils/zodUtil';


export const appSetBundleIdsValidateSchema = z.object({
  body: z.object({
    id: objectIdSchema,
    bundles: z.array(z.object({
      platform: z.string().trim().min(1),
      bundleId: z.string().trim().min(3)
    })).nonempty(responseMessages.BUNDLE_ID_IS_REQUIRED),
  })
});

export async function appSetBundleIds(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { id, bundles } = appSetBundleIdsValidateSchema.parse(req).body;

  const existApp: IApplication & Document | null = await Application.findOne({_id: id, maintainers: req.user._id}).exec();
  if (!existApp) {
    return res.status(400).json({ error: responseMessages.APPLICATION_NOT_FOUND });
  }

  existApp.bundles = bundles;
  await existApp.save();

  return res.status(200).json({
    success: true,
  });
}