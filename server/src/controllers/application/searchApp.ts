import { Response, NextFunction } from 'express';
import { IUser } from '../../model/mongo/user';
import { Document } from 'mongoose';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { Application, IApplication } from '../../model/mongo/application';

export const searchAppsValidateSchema = z.object({
  query: z.object({
    search: z.string().trim().nullable().optional(),
    limit: z.coerce.number().int().nonnegative(),
    offset: z.coerce.number().int().nonnegative(),
  })
});


// Базовый тип с ObjectId для сырых данных
export type ApplicationDoc = IApplication & Document;

// Тип после populate
export type ApplicationPopulatedDoc = Omit<IApplication, 'maintainers'> & {
  maintainers: IUser[];
} & Document;


export async function searchApps(req: UserAuthRequest, res: Response, next: NextFunction) {
  const search = (req.query.search as string || '').trim();
  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;

  const searchQuery = search ? { name: { $regex: search, $options: 'i' }, deleted: false } : { deleted: false };
  const query = { ...searchQuery, maintainers: req.user._id };
  const applicationsCount = await Application.countDocuments(query).exec();
  const applications: ApplicationPopulatedDoc[] = await Application.find(query)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate<{ maintainers: IUser[] }>('maintainers')
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
        token: app.token,
        maintainers: app.maintainers.map(m => ({
          id: m._id,
          login: m.login,
          isOwner: m.isOwner,
        })),
      }))
    }
  });
}