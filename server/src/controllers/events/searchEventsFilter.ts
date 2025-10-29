import { Response, NextFunction } from 'express';
import { EventsFilter, IEventsFilter } from '../../model/mongo/eventsFilter';
import z from 'zod';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { Types } from 'mongoose';
import { objectIdSchema } from '../../utils/zodUtil';

export const searchEventsFilterValidateSchema = z.object({
  query: z.object({
    search: z.string().trim().optional().default(''),
    applicationId: objectIdSchema.nonoptional(),
  })
});

export async function searchEventsFilter(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { search, applicationId } = searchEventsFilterValidateSchema.parse(req).query;
  const userId = req.user._id;

  const query: any = { 
    user: userId, 
    applicationId: new Types.ObjectId(applicationId),
    $or: [
      { isSharedOnly: { $exists: false } },
      { isSharedOnly: false }
    ]
  };
  
  if (search && search.trim() !== '') {
    query.name = { $regex: search, $options: 'i' };
  }

  const filters: IEventsFilter[] = await EventsFilter.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .exec();

  const result = filters.map(filter => ({
    id: filter._id.toString(),
    name: filter.name,
    criteria: filter.criteria,
    createdAt: filter.createdAt,
    updatedAt: filter.updatedAt,
  }));

  return res.status(200).json({
    success: true,
    result: {
      filters: result,
    }
  });
}

