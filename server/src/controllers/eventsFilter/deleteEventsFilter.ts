import { Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { EventsFilter, IEventsFilter } from '../../model/mongo/eventsFilter';
import z from 'zod';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { objectIdSchema } from '../../utils/zodUtil';

export const deleteEventsFilterValidateSchema = z.object({
  query: z.object({
    id: objectIdSchema,
  })
});

export async function deleteEventsFilter(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { id } = deleteEventsFilterValidateSchema.parse(req).query;
  const userId = req.user._id;

  const filter: IEventsFilter & Document | null = await EventsFilter.findOne({ 
    _id: id, 
    user: userId 
  }).exec();

  if (!filter) {
    return res.status(400).json({ error: responseMessages.EVENTS_FILTER_NOT_FOUND });
  }

  await filter.deleteOne().exec();

  return res.status(200).json({
    success: true,
  });
}


