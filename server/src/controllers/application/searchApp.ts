import { Response, NextFunction } from 'express';
import { IUser, User } from '../../model/mongo/user';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { AuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { Application, IApplication } from '../../model/mongo/application';

export const searchAppsValidateSchema = z.object({
  query: z.object({
    search: z.string().trim().nullable().optional(),
    limit: z.coerce.number().int().nonnegative(),
    offset: z.coerce.number().int().nonnegative(),
  })
});

export async function searchApps(req: AuthRequest, res: Response, next: NextFunction) {
  const search = (req.query.search as string || '').trim();
  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;

  const query = search ? { name: { $regex: search, $options: 'i' }, deleted: false } : { deleted: false };
  const applicationsCount = await Application.countDocuments(query).exec();
  const applications: (IApplication & Document)[] = await Application.find(query)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .exec();


  return res.status(200).json({
    success: true,
    result: {
      total: applicationsCount,
      applications: applications.map(app => ({
        id: app._id.toString(),
        name: app.name,
        bundles: app.bundles.map(bundle => ({
          platform: bundle.platform,
          bundleId: bundle.bundleId,
        })),
      }))
    }
  });
}