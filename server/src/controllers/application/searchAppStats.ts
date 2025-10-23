import { Response, NextFunction } from 'express';
import { Document } from 'mongoose';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { Application, IApplication } from '../../model/mongo/application';
import { ApplicationStats, IApplicationStats } from '../../model/mongo/applicationStats';
import { LogLevel } from '../../model/eventMessageDto';

export const searchAppStatsValidateSchema = z.object({
  query: z.object({
    search: z.string().trim().nullable().optional(),
    limit: z.coerce.number().int().nonnegative(),
    offset: z.coerce.number().int().nonnegative(),
  })
});


export async function searchAppStats(req: UserAuthRequest, res: Response, next: NextFunction) {
  try {
    const search = (req.query.search as string || '').trim();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const searchQuery = search ? { name: { $regex: search, $options: 'i' }, deleted: false } : { deleted: false };
    const query = { ...searchQuery, maintainers: req.user._id };

    const applicationsCount = await Application.countDocuments(query).exec();

    const applications: (IApplication & Document)[] = await Application.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();


    const appIds = applications.map(app => app._id);
    
    // Get today's date range (start and end of today)
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayStatsDocs = await ApplicationStats.aggregate([
      { 
        $match: { 
          application: { $in: appIds },
          date: { $gte: startOfToday, $lt: endOfToday }
        } 
      },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$application',
          latestStats: { $first: '$$ROOT' }
        }
      }
    ]);


    const todayStatsMap = new Map<string, IApplicationStats & Document>();
    for (const doc of todayStatsDocs) {
      todayStatsMap.set(doc._id.toString(), doc.latestStats);
    }

    return res.status(200).json({
      success: true,
      result: {
        total: applicationsCount,
        applications: applications.map(app => ({
          id: app._id.toString(),
          name: app.name,
          stats: todayStatsMap.get(app._id.toString())?.logLevelStats || Object.values(LogLevel).reduce((acc, level) => {
            acc[level] = 0;
            return acc;
          }, {} as Record<LogLevel, number>),
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}
