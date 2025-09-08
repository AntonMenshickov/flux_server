import { Request, Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { Application, IApplication } from '../../model/mongo/application';
import z from 'zod';
import { BundleId, IBundleId } from '../../model/mongo/bundleId';


interface BundleIdObject {
  platform: string;
  bundleId: string;
}

export const addAppValidateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, responseMessages.NAME_IS_REQUIRED),
    bundleIds: z.array(z.object({
      platform: z.string().trim().min(1),
      bundleId: z.string().trim().min(3)
    })).nonempty(responseMessages.BUNDLE_ID_IS_REQUIRED),
  })
});

export async function addApp(req: Request, res: Response, next: NextFunction) {
  const name: string = req.body.name.trim();
  const bundleIds: BundleIdObject[] = req.body.bundleIds;

  const existApp: IApplication & Document | null = await Application.findOne({ name }).exec();
  if (existApp) {
    return res.status(400).json({ error: responseMessages.APP_NAME_ALREADY_TAKEN });
  }


  const existingBundles = await BundleId.find({
    $or: bundleIds.map(b => ({
      platform: b.platform,
      bundleId: b.bundleId,
    })),
  });


  const existingSet = new Set(
    existingBundles.map(b => `${b.platform}:${b.bundleId}`)
  );


  const toInsert = bundleIds.filter(
    b => !existingSet.has(`${b.platform}:${b.bundleId}`)
  );


  if (toInsert.length > 0) {
    await BundleId.insertMany(toInsert);
  }


  const allBundles = await BundleId.find({
    $or: bundleIds.map(b => ({
      platform: b.platform,
      bundleId: b.bundleId,
    })),
  });

  const app: IApplication & Document = new Application({
    name: name,
    bundleIds: allBundles.map(b => b._id)
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