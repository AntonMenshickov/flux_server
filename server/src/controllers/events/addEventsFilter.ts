import { Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document, Types } from 'mongoose';
import { EventsFilter, IEventsFilter } from '../../model/mongo/eventsFilter';
import z from 'zod';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { criteriaArraySchema, objectIdSchema } from '../../utils/zodUtil';

export const addEventsFilterValidateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, responseMessages.NAME_IS_REQUIRED),
    criteria: criteriaArraySchema.min(1, 'At least one criterion is required'),
    applicationId: objectIdSchema.nonoptional(),
  })
});

export async function addEventsFilter(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { name, criteria, applicationId } = addEventsFilterValidateSchema.parse(req).body;
  const userId = req.user._id;

  const filterQuery = { user: userId, name, applicationId: new Types.ObjectId(applicationId) };

  const existFilter = await EventsFilter.findOne(filterQuery).exec();
  if (existFilter) {
    return res.status(400).json({ error: responseMessages.EVENTS_FILTER_NAME_ALREADY_EXISTS });
  }

  const filterData = {
    user: userId,
    name,
    criteria,
    applicationId: new Types.ObjectId(applicationId),
    isSharedOnly: false,
  };

  const filter: IEventsFilter & Document = new EventsFilter(filterData);

  await filter.save();

  return res.status(200).json({
    success: true,
    result: {
      id: filter.id,
      name: filter.name,
      criteria: filter.criteria,
      createdAt: filter.createdAt,
    }
  });
}

