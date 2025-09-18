import { Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { Application, IApplication } from '../../model/mongo/application';
import z from 'zod';
import { tokenUtil } from '../../utils/tokenUtil';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { objectIdSchema } from '../../utils/zodUtil';


export const addAppValidateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, responseMessages.NAME_IS_REQUIRED),
    bundles: z.array(z.object({
      platform: z.string().trim().min(1),
      bundleId: z.string().trim().min(3)
    })).nonempty(responseMessages.BUNDLE_ID_IS_REQUIRED),
    maintainers: z.array(objectIdSchema)
  })
});

export async function addApp(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { name, bundles, maintainers } = addAppValidateSchema.parse(req).body;

  const existApp: IApplication & Document | null = await Application.findOne({ name }).exec();
  if (existApp) {
    return res.status(400).json({ error: responseMessages.APP_NAME_ALREADY_TAKEN });
  }

  const maintainersList = [req.user?._id, ...maintainers.filter(e => e.toString() != req.user?._id.toString())];

  const app: IApplication & Document = new Application({
    name,
    bundles: bundles,
    token: 'empty token',
    maintainers: maintainersList,
  });
  await app.save();
  try {
    const token = tokenUtil.createDeviceToken(app._id.toString());
    app.token = token;
    await app.save();

    const populatedMaintainers = await app.populate('maintainers');

    return res.status(200).json({
      success: true,
      result: {
        id: app.id,
        name: app.name,
        bundles: bundles,
        token,
        maintainers: populatedMaintainers.maintainers,
      }
    });
  } catch (e) {
    await app.deleteOne();
    throw e;
  }
}