import { Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { Application, IApplication, ApplicationPopulatedDoc } from '../../model/mongo/application';
import z from 'zod';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { objectIdSchema } from '../../utils/zodUtil';
import { serializeApplication } from '../../model/responses/applicationResponse';


export const updateAppValidateSchema = z.object({
  body: z.object({
    id: objectIdSchema,
    name: z.string().trim().min(1, responseMessages.NAME_IS_REQUIRED),
    bundles: z.array(z.object({
      platform: z.string().trim().min(1),
      bundleId: z.string().trim().min(3)
    })).nonempty(responseMessages.BUNDLE_ID_IS_REQUIRED),
    maintainers: z.array(objectIdSchema)
  })
});

export async function updateApp(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { id, name, bundles, maintainers } = updateAppValidateSchema.parse(req).body;
  const userId = req.user._id;

  const app: IApplication & Document | null = await Application.findById(id).exec();

  if (!app) {
    return res.status(400).json({ error: responseMessages.APPLICATION_NOT_FOUND });
  }

  if (!app.maintainers.find(e => e._id.toString() == userId.toString())) {
    return res.status(400).json({ error: responseMessages.NOT_ALLOWED_TO_EDIT_APP });
  }

  const existApp: IApplication & Document | null = await Application.findOne({ $and: [{ name }, { _id: { $ne: id } }] }).exec();
  if (existApp) {
    return res.status(400).json({ error: responseMessages.APP_NAME_ALREADY_TAKEN });
  }

  const maintainersList = [req.user?._id!, ...maintainers.filter(e => e.toString() != req.user?._id.toString())];

  app.maintainers = maintainersList;
  app.bundles = bundles;
  app.name = name;
  await app.save();

  const populatedApp = await app.populate('maintainers') as ApplicationPopulatedDoc;

  return res.status(200).json({
    success: true,
    result: serializeApplication(populatedApp)
  });
}