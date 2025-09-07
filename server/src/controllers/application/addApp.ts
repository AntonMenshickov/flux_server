import { Request, Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { Application, IApplication } from '../../model/mongo/application';
import z from 'zod';

export const addAppValidateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, responseMessages.NAME_IS_REQUIRED),
    bundleIds: z.array(z.string().min(1)).nonempty(responseMessages.BUNDLE_ID_IS_REQUIRED),
  })
});

export async function addApp(req: Request, res: Response, next: NextFunction) {
  const name: string = req.body.name.trim();
  const bundleIds: string[] = req.body.bundleIds;

  const existApp: IApplication & Document | null = await Application.findOne({ name }).exec();
  if (existApp) {
    return res.status(400).json({ error: responseMessages.APP_NAME_ALREADY_TAKEN });
  }
  const app: IApplication & Document = new Application({
    name: name,
    bundleIds: bundleIds
  });

  await app.save();


  return res.status(200).json({
    success: true,
    result: {
      id: app.id,
      name: app.name,
      bundleIds: bundleIds,
    }
  });
}