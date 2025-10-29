import { Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { EventsFilter, IEventsFilter } from '../../model/mongo/eventsFilter';
import z from 'zod';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { objectIdSchema, criteriaArraySchema } from '../../utils/zodUtil';

export const updateEventsFilterValidateSchema = z.object({
  body: z.object({
    id: objectIdSchema,
    name: z.string().trim().min(1, responseMessages.NAME_IS_REQUIRED),
    criteria: criteriaArraySchema.min(1, 'At least one criterion is required'),
  })
});

export async function updateEventsFilter(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { id, name, criteria } = updateEventsFilterValidateSchema.parse(req).body;
  const userId = req.user._id;

  const filter: IEventsFilter & Document | null = await EventsFilter.findOne({ _id: id, user: userId }).exec();
  
  if (!filter) {
    return res.status(400).json({ error: responseMessages.EVENTS_FILTER_NOT_FOUND });
  }

  const existingFilterQuery = { 
    _id: { $ne: id }, 
    user: userId, 
    name,
    applicationId: filter.applicationId
  };
  
  const existFilterWithSameName = await EventsFilter.findOne(existingFilterQuery).exec();

  if (existFilterWithSameName) {
    return res.status(400).json({ error: responseMessages.EVENTS_FILTER_NAME_ALREADY_EXISTS });
  }

  filter.name = name;
  filter.criteria = criteria;

  await filter.save();

  return res.status(200).json({
    success: true,
    result: {
      id: filter.id,
      name: filter.name,
      criteria: filter.criteria,
      createdAt: filter.createdAt,
      updatedAt: filter.updatedAt,
    }
  });
}

